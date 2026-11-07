from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class AcademicPeriodCreate(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=3, max_length=120)
    campus: str = Field(default="Ibagué", max_length=80)
    starts_at: datetime
    ends_at: datetime | None = None


class AcademicPeriodRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    campus: str
    starts_at: datetime
    ends_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AcademicCalendarEventBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    campus: str = Field(default="Ibagué", max_length=80)
    audience: str = Field(
        default="Estudiantes de Ingeniería de Sistemas",
        max_length=120,
    )
    source_url: HttpUrl | None = None
    source_label: str | None = Field(
        default=None,
        max_length=200,
    )


class AcademicCalendarEventCreate(AcademicCalendarEventBase):
    period_id: UUID


class AcademicCalendarEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    campus: str | None = Field(default=None, max_length=80)
    audience: str | None = Field(default=None, max_length=120)
    source_url: HttpUrl | None = None
    source_label: str | None = Field(default=None, max_length=200)


class AcademicCalendarEventRead(AcademicCalendarEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    period_id: UUID
    status: str
    created_by_id: UUID | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime