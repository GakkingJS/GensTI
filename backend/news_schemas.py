from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class NewsBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    excerpt: str = Field(min_length=3, max_length=500)
    content: str = ""
    category: str = "Anuncios"
    author_name: str | None = None
    image_url: str | None = None
    status: str = "published"
    is_featured: bool = False


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    excerpt: str | None = Field(default=None, min_length=3, max_length=500)
    content: str | None = None
    category: str | None = None
    author_name: str | None = None
    image_url: str | None = None
    status: str | None = None
    is_featured: bool | None = None


class NewsRead(NewsBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    author_id: UUID | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime