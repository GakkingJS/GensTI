from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from authorization import require_permission
from database import get_db
from models import Pqrs, User
from pqrs_schemas import (
    PqrsCreate,
    PqrsRead,
    PqrsResponseCreate,
    PqrsStatusUpdate,
)
from sessions import get_current_user


router = APIRouter(prefix="/pqrs", tags=["PQRS"])

VALID_STATUSES = {
    "open",
    "in_progress",
    "resolved",
    "closed",
}


def get_pqrs_or_404(
    pqrs_id: UUID,
    db: Session,
) -> Pqrs:
    pqrs = db.scalar(
        select(Pqrs).where(Pqrs.id == pqrs_id)
    )

    if pqrs is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PQRS no encontrada",
        )

    return pqrs


@router.post(
    "",
    response_model=PqrsRead,
    status_code=status.HTTP_201_CREATED,
)
def create_pqrs(
    payload: PqrsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pqrs = Pqrs(
        user_id=current_user.id,
        subject=payload.subject,
        description=payload.description,
        status="open",
    )

    db.add(pqrs)
    db.commit()
    db.refresh(pqrs)

    return pqrs


@router.get(
    "/mine",
    response_model=list[PqrsRead],
)
def list_my_pqrs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pqrs_list = db.scalars(
        select(Pqrs)
        .where(Pqrs.user_id == current_user.id)
        .order_by(Pqrs.created_at.desc())
    ).all()

    return pqrs_list


@router.get(
    "/admin",
    response_model=list[PqrsRead],
    dependencies=[
        Depends(require_permission("pqr.manage")),
    ],
)
def list_all_pqrs(
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
):
    query = select(Pqrs).order_by(
        Pqrs.created_at.desc()
    )

    if status_filter is not None:
        query = query.where(Pqrs.status == status_filter)

    pqrs_list = db.scalars(query).all()

    return pqrs_list


@router.patch(
    "/{pqrs_id}/status",
    response_model=PqrsRead,
    dependencies=[
        Depends(require_permission("pqr.manage")),
    ],
)
def update_pqrs_status(
    pqrs_id: UUID,
    payload: PqrsStatusUpdate,
    db: Session = Depends(get_db),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado no válido",
        )

    pqrs = get_pqrs_or_404(pqrs_id, db)

    pqrs.status = payload.status

    db.commit()
    db.refresh(pqrs)

    return pqrs


@router.post(
    "/{pqrs_id}/respond",
    response_model=PqrsRead,
    dependencies=[
        Depends(require_permission("pqr.manage")),
    ],
)
def respond_pqrs(
    pqrs_id: UUID,
    payload: PqrsResponseCreate,
    db: Session = Depends(get_db),
):
    pqrs = get_pqrs_or_404(pqrs_id, db)

    pqrs.admin_response = payload.admin_response

    if pqrs.status == "open":
        pqrs.status = "in_progress"

    db.commit()
    db.refresh(pqrs)

    return pqrs