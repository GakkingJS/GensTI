from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from authorization import require_permission
from database import get_db
from models import (
    Permission,
    Role,
    RolePermission,
    User,
    UserRole,
)

router = APIRouter(
    prefix="/auth/admin",
    tags=["Administración de usuarios"],
)

USERS_MANAGE_PERMISSION = "users.manage"
USERS_DELETE_PERMISSION = "users.delete"


class UpdateUserRolesRequest(BaseModel):
    role_ids: list[int] = Field(max_length=100)


class UpdateUserStatusRequest(BaseModel):
    is_active: bool


def count_other_active_delete_admins(
    db: Session,
    excluded_user_id: UUID,
) -> int:
    delete_permission = db.scalar(
        select(Permission).where(
            Permission.code == USERS_DELETE_PERMISSION
        )
    )

    if delete_permission is None:
        return 0

    return db.scalar(
        select(func.count(User.id))
        .join(UserRole, UserRole.user_id == User.id)
        .join(
            RolePermission,
            RolePermission.role_id == UserRole.role_id,
        )
        .where(
            RolePermission.permission_id == delete_permission.id,
            User.is_active.is_(True),
            User.id != excluded_user_id,
        )
    ) or 0


def get_target_user_or_404(
    db: Session,
    user_id: UUID,
    for_update: bool = False,
):
    query = select(User).where(User.id == user_id)

    if for_update:
        query = query.with_for_update()

    user = db.scalar(query)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    return user


@router.get("/roles")
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(USERS_MANAGE_PERMISSION)
    ),
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
    current_user: User = Depends(
        require_permission(USERS_MANAGE_PERMISSION)
    ),
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

    roles_by_user = {
        user.id: [] for user in users
    }

    if users:
        assignments = db.execute(
            select(UserRole.user_id, Role.id, Role.name)
            .join(Role, Role.id == UserRole.role_id)
            .where(
                UserRole.user_id.in_(
                    roles_by_user.keys()
                )
            )
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
                "email_verified": (
                    user.email_verified_at is not None
                ),
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
    current_user: User = Depends(
        require_permission(USERS_MANAGE_PERMISSION)
    ),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No puedes modificar tus propios roles "
                "desde este panel."
            ),
        )

    target_user = get_target_user_or_404(
        db,
        user_id,
        for_update=True,
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uno o más roles no existen.",
        )

    try:
        db.execute(
            delete(UserRole).where(
                UserRole.user_id == user_id
            )
        )

        db.add_all(
            UserRole(
                user_id=user_id,
                role_id=role_id,
            )
            for role_id in sorted(role_ids)
        )

        result = {
            "id": str(target_user.id),
            "roles": [
                {
                    "id": role.id,
                    "name": role.name,
                }
                for role in roles
            ],
        }

        db.commit()

    except SQLAlchemyError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No pudimos guardar los roles.",
        ) from exc

    return result


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: UUID,
    payload: UpdateUserStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(USERS_MANAGE_PERMISSION)
    ),
):
    if user_id == current_user.id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No puedes desactivar tu propia cuenta.",
        )

    target_user = get_target_user_or_404(
        db,
        user_id,
        for_update=True,
    )

    if (
        not payload.is_active
        and target_user.is_active
    ):
        active_delete_admins = (
            count_other_active_delete_admins(
                db,
                user_id,
            )
        )

        if active_delete_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "No puedes desactivar la última cuenta "
                    "con permiso para eliminar usuarios."
                ),
            )

    target_user.is_active = payload.is_active

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No pudimos actualizar el estado de la cuenta.",
        ) from exc

    db.refresh(target_user)

    return {
        "id": str(target_user.id),
        "email": target_user.email,
        "is_active": target_user.is_active,
    }


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(USERS_DELETE_PERMISSION)
    ),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No puedes eliminar tu propia cuenta.",
        )

    target_user = get_target_user_or_404(
        db,
        user_id,
        for_update=True,
    )

    active_delete_admins = count_other_active_delete_admins(
        db,
        user_id,
    )

    if active_delete_admins == 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No puedes eliminar la última cuenta "
                "con permiso para eliminar usuarios."
            ),
        )

    try:
        db.delete(target_user)
        db.commit()

    except SQLAlchemyError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No fue posible eliminar la cuenta porque "
                "tiene PQRS, eventos u otros registros "
                "relacionados. Desactívala en su lugar."
            ),
        ) from exc