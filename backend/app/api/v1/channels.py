from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.base import get_db
from app.schemas.channel import ChannelOut
from app.services.channel_service import ChannelService

router = APIRouter(prefix="/channels", tags=["channels"])


@router.get("/", response_model=list[ChannelOut])
async def list_channels(
    db: AsyncSession = Depends(get_db),
    _current_user: dict = Depends(get_current_user),  # Requiere JWT válido
):
    """Devuelve todos los canales disponibles. Requiere autenticación."""
    return await ChannelService(db).get_all()
