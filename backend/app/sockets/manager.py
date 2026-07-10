from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    """
    Gestiona conexiones WebSocket agrupadas por canal.

    Estructura interna:
        { channel_id (str) -> { user_id (str) -> {"username": str,
                                                  "sockets": set[WebSocket]} } }

    Un mismo usuario puede tener varias conexiones abiertas al mismo canal
    (por ejemplo, dos pestañas del navegador). Se guarda un conjunto de
    sockets por usuario para que solo se le considere desconectado cuando
    se cierra la ultima de ellas.

    Thread-safety: asyncio es single-threaded, por lo que no se necesitan
    locks para operaciones sobre este diccionario.
    """

    def __init__(self) -> None:
        self._rooms: dict[str, dict[str, dict]] = defaultdict(dict)

    # ------------------------------------------------------------------
    # Gestión de conexiones
    # ------------------------------------------------------------------

    def connect(
        self, channel_id: str, user_id: str, username: str, ws: WebSocket
    ) -> bool:
        """
        Registra una conexión en el canal.
        Devuelve True si es la primera conexión del usuario (acaba de entrar),
        False si ya tenía otra pestaña abierta.
        """
        room = self._rooms[channel_id]
        entry = room.get(user_id)
        if entry is None:
            room[user_id] = {"username": username, "sockets": {ws}}
            return True
        entry["sockets"].add(ws)
        return False

    def disconnect(
        self, channel_id: str, user_id: str, ws: WebSocket | None = None
    ) -> bool:
        """
        Elimina una conexión del canal.

        Si `ws` se omite se elimina al usuario por completo. Devuelve True si
        el usuario se quedó sin conexiones (salió del canal), False si aún le
        quedan sockets abiertos.
        """
        room = self._rooms.get(channel_id)
        if not room or user_id not in room:
            return False

        entry = room[user_id]
        if ws is None:
            entry["sockets"].clear()
        else:
            entry["sockets"].discard(ws)

        user_left = not entry["sockets"]
        if user_left:
            room.pop(user_id, None)
        if not room:
            self._rooms.pop(channel_id, None)
        return user_left

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
        Emite un mensaje JSON a todos los sockets del canal.
        Detecta y limpia conexiones muertas automáticamente.
        """
        room = self._rooms.get(channel_id, {})
        # Materializar la lista antes de iterar: el envío puede mutar el dict.
        targets = [
            (uid, ws)
            for uid, entry in list(room.items())
            for ws in list(entry["sockets"])
            if uid != exclude_user_id
        ]

        for uid, ws in targets:
            try:
                await ws.send_json(message)
            except Exception:
                # Conexión cerrada inesperadamente — limpiar ese socket.
                self.disconnect(channel_id, uid, ws)

    async def send_to_user(
        self, channel_id: str, user_id: str, message: dict
    ) -> None:
        """Envío directo a todas las conexiones de un usuario en un canal."""
        entry = self._rooms.get(channel_id, {}).get(user_id)
        if not entry:
            return
        for ws in list(entry["sockets"]):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(channel_id, user_id, ws)

    async def send_to_socket(self, ws: WebSocket, message: dict) -> None:
        """Envío a una única conexión, típicamente la recién aceptada."""
        try:
            await ws.send_json(message)
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Consultas de estado
    # ------------------------------------------------------------------

    def get_users_in_channel(self, channel_id: str) -> list[str]:
        """Devuelve la lista de user_ids conectados a un canal."""
        return list(self._rooms.get(channel_id, {}).keys())

    def get_roster(self, channel_id: str) -> list[dict]:
        """
        Lista de usuarios conectados al canal, ordenada alfabéticamente, en el
        formato que consume el cliente:
            [{"user_id": "...", "username": "..."}, ...]
        """
        room = self._rooms.get(channel_id, {})
        roster = [
            {"user_id": uid, "username": entry["username"]}
            for uid, entry in room.items()
        ]
        roster.sort(key=lambda u: u["username"].lower())
        return roster

    def get_channel_count(self, channel_id: str) -> int:
        return len(self._rooms.get(channel_id, {}))


# Singleton — una única instancia compartida en toda la aplicación FastAPI
manager = ConnectionManager()
