from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Aplicación
    APP_NAME: str = "Discord Clone API"
    DEBUG: bool = False

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 horas

    # Base de Datos (asyncpg)
    DATABASE_URL: str
    # Modo SSL de asyncpg. Neon/Render exigen "require"; Postgres local no
    # acepta el upgrade de SSL, por lo que en desarrollo se usa "disable".
    DB_SSL: str = "require"

    # CORS — lista explícita de orígenes permitidos
    ALLOWED_ORIGINS: list[str] = ["http://localhost:4200", "http://localhost:8050"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Singleton — importar desde cualquier módulo
settings = Settings()
