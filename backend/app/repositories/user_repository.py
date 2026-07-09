import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User


class UserRepository:
    """Capa de acceso a datos para User. Sin lógica de negocio."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create(
        self, username: str, email: str, password_hash: str
    ) -> User:
        user = User(username=username, email=email, password_hash=password_hash)
        self.db.add(user)
        await self.db.flush()  # Obtiene el ID generado sin cerrar la transacción
        await self.db.refresh(user)
        return user
