from datetime import datetime, timezone
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from authorization import require_permission
from calendar_schemas import (
    AcademicCalendarEventCreate,
    AcademicCalendarEventRead,
    AcademicCalendarEventUpdate,
    AcademicPeriodCreate,
    AcademicPeriodRead,
)
from database import get_db
from models import (
    AcademicCalendarEvent,
    AcademicPeriod,
    User,
)
from sessions import get_current_user

router = APIRouter(prefix="/calendar", tags=["Calendar"])


def get_period_or_404(
    period_id: UUID,
    db: Session,
) -> AcademicPeriod:
    period = db.scalar(
        select(AcademicPeriod).where(
            AcademicPeriod.id == period_id
        )
    )

    if period is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Periodo académico no encontrado",
        )

    return period


def get_event_or_404(
    event_id: UUID,
    db: Session,
) -> AcademicCalendarEvent:
    event = db.scalar(
        select(AcademicCalendarEvent).where(
            AcademicCalendarEvent.id == event_id
        )
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento del calendario no encontrado",
        )

    return event


@router.get(
    "/periods",
    response_model=list[AcademicPeriodRead],
    dependencies=[
        Depends(require_permission("calendar.view")),
    ],
)
def list_periods(
    db: Session = Depends(get_db),
):
    periods = db.scalars(
        select(AcademicPeriod)
        .where(AcademicPeriod.campus == "Ibagué")
        .order_by(AcademicPeriod.starts_at.desc())
    ).all()

    return periods


@router.post(
    "/periods",
    response_model=AcademicPeriodRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(require_permission("calendar.manage")),
    ],
)
def create_period(
    payload: AcademicPeriodCreate,
    db: Session = Depends(get_db),
):
    period = AcademicPeriod(**payload.model_dump())

    db.add(period)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un periodo académico con ese código",
        ) from exc

    db.refresh(period)

    return period


@router.get(
    "/events",
    response_model=list[AcademicCalendarEventRead]
)
def list_published_events(
    period_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = (
        select(AcademicCalendarEvent)
        .where(
            AcademicCalendarEvent.status == "published",
            AcademicCalendarEvent.campus == "Ibagué",
        )
        .order_by(
            AcademicCalendarEvent.starts_at.asc()
        )
    )

    if period_id is not None:
        query = query.where(
            AcademicCalendarEvent.period_id == period_id
        )

    events = db.scalars(query).all()

    return events


@router.post(
    "/events",
    response_model=AcademicCalendarEventRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(require_permission("calendar.manage")),
    ],
)
def create_event(
    payload: AcademicCalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_period_or_404(payload.period_id, db)

    event = AcademicCalendarEvent(
        **payload.model_dump(),
        status="draft",
        created_by_id=current_user.id,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


@router.patch(
    "/events/{event_id}",
    response_model=AcademicCalendarEventRead,
    dependencies=[
        Depends(require_permission("calendar.manage")),
    ],
)
def update_event(
    event_id: UUID,
    payload: AcademicCalendarEventUpdate,
    db: Session = Depends(get_db),
):
    event = get_event_or_404(event_id, db)

    update_data = payload.model_dump(
        exclude_unset=True,
        mode="json",
    )

    for field, value in update_data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)

    return event


@router.post(
    "/events/{event_id}/publish",
    response_model=AcademicCalendarEventRead,
    dependencies=[
        Depends(require_permission("calendar.publish")),
    ],
)
def publish_event(
    event_id: UUID,
    db: Session = Depends(get_db),
):
    event = get_event_or_404(event_id, db)

    if event.status == "published":
        return event

    event.status = "published"
    event.published_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(event)

    return event


@router.post(
    "/events/{event_id}/unpublish",
    response_model=AcademicCalendarEventRead,
    dependencies=[
        Depends(require_permission("calendar.publish")),
    ],
)
def unpublish_event(
    event_id: UUID,
    db: Session = Depends(get_db),
):
    event = get_event_or_404(event_id, db)

    event.status = "draft"
    event.published_at = None

    db.commit()
    db.refresh(event)

    return event