import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Channel


class ChannelRepository:
    """Capa de acceso a datos para Channel."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_all(self) -> list[Channel]:
        result = await self.db.execute(select(Channel).order_by(Channel.name))
        return list(result.scalars().all())

    async def get_by_id(self, channel_id: uuid.UUID) -> Channel | None:
        result = await self.db.execute(
            select(Channel).where(Channel.id == channel_id)
        )
        return result.scalar_one_or_none()
