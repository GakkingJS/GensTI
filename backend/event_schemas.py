from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CommunityEventCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    type: str = Field(min_length=2, max_length=50)
    short_description: str = Field(min_length=5, max_length=500)
    description: str | None = None
    start_date: date
    end_date: date | None = None
    time: str | None = Field(default=None, max_length=100)
    location: str | None = Field(default=None, max_length=200)
    image_url: str | None = Field(default=None, max_length=500)
    external_url: str | None = Field(default=None, max_length=500)
    featured: bool = False


class CommunityEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    type: str | None = Field(default=None, min_length=2, max_length=50)
    short_description: str | None = Field(
        default=None,
        min_length=5,
        max_length=500,
    )
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    time: str | None = Field(default=None, max_length=100)
    location: str | None = Field(default=None, max_length=200)
    image_url: str | None = Field(default=None, max_length=500)
    external_url: str | None = Field(default=None, max_length=500)
    featured: bool | None = None


class CommunityEventRead(BaseModel):
    id: UUID
    title: str
    type: str
    short_description: str
    description: str | None
    start_date: date
    end_date: date | None
    time: str | None
    location: str | None
    image_url: str | None
    external_url: str | None
    featured: bool
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }