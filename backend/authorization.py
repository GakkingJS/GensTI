from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Permission,
    Role,
    RolePermission,
    UserPermissionOverride,
    UserRole,
)
from sessions import get_current_user


def get_user_roles(
    db: Session,
    user_id: UUID,
) -> list[str]:
    """
    Obtiene los roles asignados a un usuario.
    """

    roles = db.scalars(
        select(Role.name)
        .join(
            UserRole,
            UserRole.role_id == Role.id,
        )
        .where(UserRole.user_id == user_id)
        .order_by(Role.name)
    ).all()

    return list(roles)


def get_user_permissions(
    db: Session,
    user_id: UUID,
) -> set[str]:
    """
    Obtiene los permisos efectivos de un usuario.

    Los permisos provenientes de sus roles se combinan
    con los overrides individuales.

    Un override "deny" tiene prioridad sobre un permiso
    otorgado por un rol.
    """

    role_permissions = db.scalars(
        select(Permission.code)
        .join(
            RolePermission,
            RolePermission.permission_id == Permission.id,
        )
        .join(
            UserRole,
            UserRole.role_id == RolePermission.role_id,
        )
        .where(UserRole.user_id == user_id)
        .distinct()
    ).all()

    permissions = set(role_permissions)

    overrides = db.execute(
        select(
            Permission.code,
            UserPermissionOverride.decision,
        )
        .join(
            Permission,
            Permission.id == UserPermissionOverride.permission_id,
        )
        .where(
            UserPermissionOverride.user_id == user_id
        )
    ).all()

    for permission_code, decision in overrides:
        if decision == "allow":
            permissions.add(permission_code)

        elif decision == "deny":
            permissions.discard(permission_code)

    return permissions


def require_permission(required_permission: str):
    """
    Crea una dependencia de FastAPI que exige
    un permiso específico.
    """

    def dependency(
        user=Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        permissions = get_user_permissions(
            db=db,
            user_id=user.id,
        )

        if required_permission not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta acción",
            )

        return user

    return dependency