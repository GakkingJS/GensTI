"""Agregar permiso users.delete para superadministradores."""

from alembic import op
import sqlalchemy as sa


revision = "users_delete_20261115"
down_revision = "post_media_20261115"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        sa.text(
            """
            INSERT INTO permissions (code)
            SELECT 'users.delete'
            WHERE NOT EXISTS (
                SELECT 1
                FROM permissions
                WHERE code = 'users.delete'
            )
            """
        )
    )

    op.execute(
        sa.text(
            """
            INSERT INTO role_permissions (
                role_id,
                permission_id
            )
            SELECT
                roles.id,
                permissions.id
            FROM roles
            CROSS JOIN permissions
            WHERE
                roles.name = 'superadmin'
                AND permissions.code = 'users.delete'
                AND NOT EXISTS (
                    SELECT 1
                    FROM role_permissions
                    WHERE
                        role_permissions.role_id = roles.id
                        AND role_permissions.permission_id = permissions.id
                )
            """
        )
    )


def downgrade():
    op.execute(
        sa.text(
            """
            DELETE FROM role_permissions
            WHERE permission_id = (
                SELECT id
                FROM permissions
                WHERE code = 'users.delete'
            )
            """
        )
    )

    op.execute(
        sa.text(
            """
            DELETE FROM permissions
            WHERE code = 'users.delete'
            AND NOT EXISTS (
                SELECT 1
                FROM role_permissions
                WHERE permission_id = permissions.id
            )
            """
        )
    )