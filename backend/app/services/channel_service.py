from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.channel_repository import ChannelRepository
from app.schemas.channel import ChannelOut


class ChannelService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = ChannelRepository(db)

    async def get_all(self) -> list[ChannelOut]:
        channels = await self.repo.get_all()
        return [ChannelOut.model_validate(ch) for ch in channels]
