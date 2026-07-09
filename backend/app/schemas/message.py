import uuid
from datetime import datetime

from pydantic import BaseModel


class MessageOut(BaseModel):
    id: uuid.UUID
    channel_id: uuid.UUID
    user_id: uuid.UUID | None
    username: str | None  # Resuelto via JOIN en el repositorio
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
