import logging
import uuid

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.core.security import decode_token
from app.db.base import AsyncSessionLocal
from app.repositories.channel_repository import ChannelRepository
from app.repositories.message_repository import MessageRepository
from app.sockets.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()


async def _authenticate_ws(token: str) -> dict | None:
    """
    Valida el JWT recibido en el handshake WebSocket.
    Retorna el payload si es válido, None si es inválido.
    """
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        username: str | None = payload.get("username")
        if not user_id or not username:
            return None
        return {"user_id": user_id, "username": username}
    except JWTError:
        return None


@router.websocket("/ws/{channel_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    channel_id: str,
    token: str = Query(..., description="JWT de autenticación"),
):
    """
    Endpoint WebSocket principal.

    Protocolo de eventos (JSON):
    ─────────────────────────────────────────────────────────────
    Cliente → Servidor:
      { "type": "message",  "content": "..." }
      { "type": "typing",   "is_typing": true|false }

    Servidor → Cliente:
      { "type": "history_batch", "messages": [...] }
      { "type": "message",    id, channel_id, user_id, username, content, created_at }
      { "type": "typing",     user_id, username, is_typing }
      { "type": "user_list",   users: [{user_id, username}, ...] }
      { "type": "user_joined", user_id, username }
      { "type": "user_left",   user_id, username }

    `user_list` es la fuente de verdad de la lista de usuarios conectados: se
    envía al entrar y se reemite al canal cada vez que alguien entra o sale.
    `user_joined` / `user_left` se conservan como notificaciones puntuales.
    ─────────────────────────────────────────────────────────────
    Códigos de cierre personalizados:
      4001 — Token inválido o ausente
      4002 — channel_id no es un UUID válido
      4004 — Canal inexistente (UUID válido pero no existe en la BD)
    """

    # ── 1. Autenticación en el handshake (antes de accept) ────────────
    user_data = await _authenticate_ws(token)
    if not user_data:
        await websocket.close(code=4001)
        return

    user_id = user_data["user_id"]
    username = user_data["username"]

    # Validar que el channel_id sea un UUID bien formado
    try:
        channel_uuid = uuid.UUID(channel_id)
    except ValueError:
        await websocket.close(code=4002)
        return

    # Validar que el canal exista realmente en la BD (no solo que el UUID
    # tenga formato válido) para evitar que cualquier usuario autenticado
    # abra un socket contra un canal inexistente.
    async with AsyncSessionLocal() as db:
        channel_repo = ChannelRepository(db)
        channel = await channel_repo.get_by_id(channel_uuid)
    if channel is None:
        await websocket.close(code=4004)
        return

    # ── 2. Aceptar conexión ─────────────────────────────────────────────
    await websocket.accept()

    # ── 3. Enviar historial ANTES de registrar en el roster ─────────────
    # Se envía primero para evitar que un mensaje en vivo llegue al socket
    # antes que el historial (condición de carrera entre el fetch, que cede
    # el loop de eventos, y un broadcast concurrente).
    async with AsyncSessionLocal() as db:
        repo = MessageRepository(db)
        history = await repo.get_last_n_by_channel(channel_uuid, n=20)

        history_payload = []
        for m in history:
            history_payload.append({
                "id":         str(m.id),
                "channel_id": str(m.channel_id),
                "user_id":    str(m.user_id) if m.user_id else None,
                "username":   m.user.username if m.user else "Usuario eliminado",
                "content":    m.content,
                "created_at": m.created_at.isoformat(),
            })

        await websocket.send_json({
            "type":     "history_batch",
            "messages": history_payload,
        })

    # ── 4. Registrar en el manager ───────────────────────────────────────
    # A partir de este punto el usuario queda en el roster: el try/finally
    # garantiza que manager.disconnect se ejecute ante cualquier error
    # (incluido durante el broadcast de entrada o el bucle principal), para
    # que nunca quede "fantasma" en la lista de conectados.
    is_first_connection = manager.connect(channel_id, user_id, username, websocket)
    try:
        # ── 5. Presencia: enviar el roster actual y notificar la entrada ─
        # El roster se emite a TODO el canal (incluido quien entra) para que
        # la lista de conectados sea idéntica en todos los clientes.
        if is_first_connection:
            await manager.broadcast_to_channel(
                channel_id,
                {"type": "user_joined", "user_id": user_id, "username": username},
                exclude_user_id=user_id,
            )
        await manager.broadcast_to_channel(
            channel_id,
            {"type": "user_list", "users": manager.get_roster(channel_id)},
        )

        # ── 6. Loop principal de recepción ───────────────────────────────
        while True:
            data: dict = await websocket.receive_json()
            event_type: str = data.get("type", "")

            if event_type == "message":
                content = data.get("content", "").strip()
                if not content:
                    continue  # Ignorar mensajes vacíos

                # Persistir en BD y hacer broadcast
                async with AsyncSessionLocal() as db:
                    repo = MessageRepository(db)
                    msg = await repo.create(
                        channel_id=channel_uuid,
                        user_id=uuid.UUID(user_id),
                        content=content,
                    )
                    await db.commit()

                await manager.broadcast_to_channel(
                    channel_id,
                    {
                        "type":       "message",
                        "id":         str(msg.id),
                        "channel_id": channel_id,
                        "user_id":    user_id,
                        "username":   username,
                        "content":    msg.content,
                        "created_at": msg.created_at.isoformat(),
                    },
                )

            elif event_type == "typing":
                # Solo broadcast — NO persistir, es un evento efímero
                await manager.broadcast_to_channel(
                    channel_id,
                    {
                        "type":      "typing",
                        "user_id":   user_id,
                        "username":  username,
                        "is_typing": data.get("is_typing", True),
                    },
                    exclude_user_id=user_id,
                )

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Error en el bucle de recepcion del websocket")
    finally:
        # ── 7. Limpieza al desconectar ─────────────────────────────────
        # Se ejecuta siempre, también ante errores inesperados: de lo
        # contrario el usuario quedaría "fantasma" en la lista de conectados.
        user_left = manager.disconnect(channel_id, user_id, websocket)
        if user_left:
            await manager.broadcast_to_channel(
                channel_id,
                {"type": "user_left", "user_id": user_id, "username": username},
            )
            await manager.broadcast_to_channel(
                channel_id,
                {"type": "user_list", "users": manager.get_roster(channel_id)},
            )
