import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CommunityPostCreate(BaseModel):
    title: str = Field(min_length=5, max_length=180)
    content: str = Field(min_length=20)
    category: str = Field(default="General", max_length=60)


class CommunityPostReview(BaseModel):
    status: str = Field(pattern="^(published|rejected)$")
    admin_note: Optional[str] = None


class CommunityPostAdmin(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    title: str
    content: str
    category: str
    status: str
    admin_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True


class CommunityPostPublic(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    title: str
    content: str
    category: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True