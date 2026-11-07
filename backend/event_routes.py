from datetime import datetime, timezone
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from authorization import require_permission
from database import get_db
from event_schemas import (
    CommunityEventCreate,
    CommunityEventRead,
    CommunityEventUpdate,
)
from models import CommunityEvent, User
from sessions import get_current_user


router = APIRouter(prefix="/events", tags=["Events"])


def get_event_or_404(
    event_id: UUID,
    db: Session,
) -> CommunityEvent:
    event = db.scalar(
        select(CommunityEvent).where(
            CommunityEvent.id == event_id
        )
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado",
        )

    return event


@router.get(
    "",
    response_model=list[CommunityEventRead],
)
def list_published_events(
    db: Session = Depends(get_db),
):
    events = db.scalars(
        select(CommunityEvent)
        .where(CommunityEvent.status == "published")
        .order_by(CommunityEvent.start_date.asc())
    ).all()

    return events


@router.get(
    "/admin",
    response_model=list[CommunityEventRead],
    dependencies=[
        Depends(require_permission("events.manage")),
    ],
)
def list_all_events(
    db: Session = Depends(get_db),
):
    events = db.scalars(
        select(CommunityEvent)
        .order_by(CommunityEvent.start_date.asc())
    ).all()

    return events


@router.post(
    "",
    response_model=CommunityEventRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(require_permission("events.manage")),
    ],
)
def create_event(
    payload: CommunityEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = CommunityEvent(
        **payload.model_dump(),
        status="draft",
        created_by_id=current_user.id,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


@router.patch(
    "/{event_id}",
    response_model=CommunityEventRead,
    dependencies=[
        Depends(require_permission("events.manage")),
    ],
)
def update_event(
    event_id: UUID,
    payload: CommunityEventUpdate,
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


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[
        Depends(require_permission("events.manage")),
    ],
)
def delete_event(
    event_id: UUID,
    db: Session = Depends(get_db),
):
    event = get_event_or_404(event_id, db)

    db.delete(event)
    db.commit()


@router.post(
    "/{event_id}/publish",
    response_model=CommunityEventRead,
    dependencies=[
        Depends(require_permission("events.manage")),
    ],
)
def publish_event(
    event_id: UUID,
    db: Session = Depends(get_db),
):
    event = get_event_or_404(event_id, db)

    event.status = "published"

    db.commit()
    db.refresh(event)

    return event


@router.post(
    "/{event_id}/unpublish",
    response_model=CommunityEventRead,
    dependencies=[
        Depends(require_permission("events.manage")),
    ],
)
def unpublish_event(
    event_id: UUID,
    db: Session = Depends(get_db),
):
    event = get_event_or_404(event_id, db)

    event.status = "draft"

    db.commit()
    db.refresh(event)

    return event