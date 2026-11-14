from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from authorization import require_permission
from database import get_db
from models import Role, User, UserRole


router = APIRouter(
    prefix="/auth/admin",
    tags=["Administración de usuarios"],
)


class UpdateUserRolesRequest(BaseModel):
    role_ids: list[int] = Field(max_length=100)


@router.get("/roles")
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.manage")),
):
    roles = db.scalars(
        select(Role).order_by(Role.name)
    ).all()

    return [
        {"id": role.id, "name": role.name}
        for role in roles
    ]


@router.get("/users")
def list_users(
    q: str = Query(default="", max_length=254),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.manage")),
):
    filters = []
    search = q.strip().lower()

    if search:
        filters.append(
            User.email.contains(search, autoescape=True)
        )

    total = db.scalar(
        select(func.count())
        .select_from(User)
        .where(*filters)
    ) or 0

    users = db.scalars(
        select(User)
        .where(*filters)
        .order_by(User.email)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    roles_by_user = {user.id: [] for user in users}

    if users:
        assignments = db.execute(
            select(UserRole.user_id, Role.id, Role.name)
            .join(Role, Role.id == UserRole.role_id)
            .where(UserRole.user_id.in_(roles_by_user.keys()))
            .order_by(Role.name)
        ).all()

        for user_id, role_id, role_name in assignments:
            roles_by_user[user_id].append(
                {"id": role_id, "name": role_name}
            )

    return {
        "items": [
            {
                "id": str(user.id),
                "email": user.email,
                "is_active": user.is_active,
                "email_verified": user.email_verified_at is not None,
                "created_at": user.created_at,
                "roles": roles_by_user[user.id],
            }
            for user in users
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.put("/users/{user_id}/roles")
def update_user_roles(
    user_id: UUID,
    payload: UpdateUserRolesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.manage")),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="No puedes modificar tus propios roles desde este panel.",
        )

    target_user = db.scalar(
        select(User)
        .where(User.id == user_id)
        .with_for_update()
    )

    if target_user is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado.",
        )

    role_ids = set(payload.role_ids)

    roles = (
        db.scalars(
            select(Role)
            .where(Role.id.in_(role_ids))
            .order_by(Role.name)
        ).all()
        if role_ids
        else []
    )

    if len(roles) != len(role_ids):
        raise HTTPException(
            status_code=400,
            detail="Uno o más roles no existen.",
        )

    try:
        db.execute(
            delete(UserRole).where(UserRole.user_id == user_id)
        )

        db.add_all(
            UserRole(user_id=user_id, role_id=role_id)
            for role_id in sorted(role_ids)
        )

        result = {
            "id": str(target_user.id),
            "roles": [
                {"id": role.id, "name": role.name}
                for role in roles
            ],
        }

        db.commit()

    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No pudimos guardar los roles.",
        ) from exc

    return result