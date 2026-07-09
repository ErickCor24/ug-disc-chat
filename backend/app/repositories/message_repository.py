import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Message


class MessageRepository:
    """Capa de acceso a datos para Message."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_last_n_by_channel(
        self, channel_id: uuid.UUID, n: int = 20
    ) -> list[Message]:
        """
        Retorna los últimos N mensajes de un canal en orden cronológico ascendente.
        Usa selectinload para evitar N+1 queries al acceder a msg.user.
        """
        result = await self.db.execute(
            select(Message)
            .where(Message.channel_id == channel_id)
            .options(selectinload(Message.user))
            .order_by(Message.created_at.desc())
            .limit(n)
        )
        messages = list(result.scalars().all())
        # Invertir para orden cronológico (más antiguo → más reciente)
        return list(reversed(messages))

    async def create(
        self, channel_id: uuid.UUID, user_id: uuid.UUID, content: str
    ) -> Message:
        message = Message(channel_id=channel_id, user_id=user_id, content=content)
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message
