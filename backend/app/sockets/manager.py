from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    """
    Gestiona conexiones WebSocket agrupadas por canal.

    Estructura interna:
        { channel_id (str) -> { user_id (str) -> WebSocket } }

    Thread-safety: asyncio es single-threaded, por lo que no se necesitan
    locks para operaciones sobre este diccionario.
    """

    def __init__(self) -> None:
        self._rooms: dict[str, dict[str, WebSocket]] = defaultdict(dict)

    # ------------------------------------------------------------------
    # Gestión de conexiones
    # ------------------------------------------------------------------

    def connect(self, channel_id: str, user_id: str, ws: WebSocket) -> None:
        """Registra una nueva conexión en el canal."""
        self._rooms[channel_id][user_id] = ws

    def disconnect(self, channel_id: str, user_id: str) -> None:
        """Elimina la conexión del canal y limpia la sala si queda vacía."""
        room = self._rooms.get(channel_id, {})
        room.pop(user_id, None)
        if not room:
            self._rooms.pop(channel_id, None)

    # ------------------------------------------------------------------
    # Emisión de mensajes
    # ------------------------------------------------------------------

    async def broadcast_to_channel(
        self,
        channel_id: str,
        message: dict,
        exclude_user_id: str | None = None,
    ) -> None:
        """
        Emite un mensaje JSON a todos los usuarios del canal.
        Detecta y limpia conexiones muertas automáticamente.
        """
        room = dict(self._rooms.get(channel_id, {}))  # Copiar para iterar seguro
        dead: list[str] = []

        for uid, ws in room.items():
            if uid == exclude_user_id:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                # Conexión cerrada inesperadamente — marcar para limpiar
                dead.append(uid)

        for uid in dead:
            self.disconnect(channel_id, uid)

    async def send_to_user(
        self, channel_id: str, user_id: str, message: dict
    ) -> None:
        """Envío directo a un usuario específico dentro de un canal."""
        ws = self._rooms.get(channel_id, {}).get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(channel_id, user_id)

    # ------------------------------------------------------------------
    # Consultas de estado
    # ------------------------------------------------------------------

    def get_users_in_channel(self, channel_id: str) -> list[str]:
        """Devuelve la lista de user_ids conectados a un canal."""
        return list(self._rooms.get(channel_id, {}).keys())

    def get_channel_count(self, channel_id: str) -> int:
        return len(self._rooms.get(channel_id, {}))


# Singleton — una única instancia compartida en toda la aplicación FastAPI
manager = ConnectionManager()
