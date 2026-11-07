from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PqrsCreate(BaseModel):
    subject: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20)


class PqrsRead(BaseModel):
    id: UUID
    user_id: UUID
    subject: str
    description: str
    status: str
    admin_response: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class PqrsStatusUpdate(BaseModel):
    status: str


class PqrsResponseCreate(BaseModel):
    admin_response: str = Field(min_length=5)