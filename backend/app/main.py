from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, channels
from app.core.config import settings
from app.sockets import handler

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────
# NUNCA usar allow_origins=["*"] en producción.
# ALLOWED_ORIGINS se configura en .env con el dominio exacto de Vercel.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Routers HTTP ──────────────────────────────────────────────────────────
app.include_router(auth.router,     prefix="/api/v1")
app.include_router(channels.router, prefix="/api/v1")

# ── Router WebSocket ───────────────────────────────────────────────────────
# Endpoint: ws://<host>/ws/{channel_id}?token=<JWT>
app.include_router(handler.router)


@app.get("/health", tags=["status"])
async def health_check() -> dict:
    """Endpoint de salud para Railway y monitoreo."""
    return {"status": "ok", "app": settings.APP_NAME}
