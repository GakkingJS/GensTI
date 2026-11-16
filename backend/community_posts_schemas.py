import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PostSection = Literal["community", "opportunities"]
PostStatus = Literal["pending", "published", "rejected"]


class CommunityPostCreate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    title: str = Field(
        min_length=5,
        max_length=180,
    )

    content: str = Field(
        min_length=20,
        max_length=20000,
    )

    category: str = Field(
        default="General",
        min_length=2,
        max_length=60,
    )

    section: PostSection = "community"


class CommunityPostReview(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    status: Literal["published", "rejected"]

    admin_note: str | None = Field(
        default=None,
        max_length=2000,
    )

    # Permite corregir el destino antes de aprobar.
    section: PostSection | None = None


class CommunityPostPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    author_id: uuid.UUID
    title: str
    content: str
    category: str
    section: PostSection
    status: PostStatus
    image_url: str | None = None
    image_alt: str = ""
    created_at: datetime


class CommunityPostOwn(CommunityPostPublic):
    admin_note: str | None = None
    image_authorized: bool = False


class CommunityPostAdmin(CommunityPostOwn):
    updated_at: datetime
    reviewed_at: datetime | None = None
    reviewed_by: uuid.UUID | None = None