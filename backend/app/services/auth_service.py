from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    """Lógica de negocio para autenticación. Delega el acceso a datos al repositorio."""

    def __init__(self, db: AsyncSession) -> None:
        self.repo = UserRepository(db)

    async def register(self, data: RegisterRequest) -> TokenResponse:
        # Verificar unicidad del email
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El email ya está registrado",
            )

        # Verificar unicidad del username
        existing_username = await self.repo.get_by_username(data.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El nombre de usuario ya esta registrado",
            )

        try:
            user = await self.repo.create(
                username=data.username,
                email=data.email,
                password_hash=hash_password(data.password),
            )
        except IntegrityError:
            # Condición de carrera: dos registros concurrentes pasaron las
            # verificaciones de arriba y uno choca con la restricción UNIQUE
            # de la BD (email o username).
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El email o el nombre de usuario ya está registrado",
            )

        token = create_access_token(
            subject=str(user.id),
            extra_data={"username": user.username},
        )
        return TokenResponse(
            access_token=token,
            user_id=str(user.id),
            username=user.username,
        )

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.repo.get_by_email(data.email)

        # Mensaje genérico para no revelar qué campo falló (seguridad)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = create_access_token(
            subject=str(user.id),
            extra_data={"username": user.username},
        )
        return TokenResponse(
            access_token=token,
            user_id=str(user.id),
            username=user.username,
        )
