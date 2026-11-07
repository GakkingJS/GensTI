from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import (
    Permission,
    Role,
    RolePermission,
    User,
    UserPermissionOverride,
    UserRole,
)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
) -> User:
    # Aquí luego conectaremos tu sesión real.
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
    )


def require_permission(permission_code: str):
    async def checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        permission_result = await db.execute(
            select(Permission).where(
                Permission.code == permission_code
            )
        )
        permission = permission_result.scalar_one_or_none()

        if permission is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permiso no configurado",
            )

        override_result = await db.execute(
            select(UserPermissionOverride).where(
                UserPermissionOverride.user_id == current_user.id,
                UserPermissionOverride.permission_id == permission.id,
            )
        )
        override = override_result.scalar_one_or_none()

        if override and override.decision == "deny":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para esta acción",
            )

        if override and override.decision == "allow":
            return current_user

        allowed = await db.execute(
            select(Role.id)
            .join(UserRole, UserRole.role_id == Role.id)
            .join(RolePermission, RolePermission.role_id == Role.id)
            .where(
                UserRole.user_id == current_user.id,
                RolePermission.permission_id == permission.id,
            )
        )

        if allowed.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para esta acción",
            )

        return current_user

    return checker