"""Crear contenido administrable de TBOG y su permiso."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "tbog_20261114"
down_revision = "d15372611d99"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "tbog_entries",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "content_type",
            sa.String(20),
            nullable=False,
            server_default="recognition",
        ),
        sa.Column("student_name", sa.String(200), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "category",
            sa.String(30),
            nullable=False,
            server_default="excelencia",
        ),
        sa.Column(
            "period",
            sa.String(120),
            nullable=False,
            server_default="",
        ),
        sa.Column("image_key", sa.String(100), nullable=True),
        sa.Column(
            "image_alt",
            sa.String(300),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "image_position",
            sa.String(30),
            nullable=False,
            server_default="center",
        ),
        sa.Column(
            "featured",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "publication_authorized",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "verified_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "verified_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "updated_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "content_type IN ('recognition', 'gallery')",
            name="ck_tbog_entries_content_type",
        ),
        sa.CheckConstraint(
            "status IN ('draft', 'published', 'archived')",
            name="ck_tbog_entries_status",
        ),
        sa.CheckConstraint(
            "category IN "
            "('semilleros', 'saber-pro', 'proyectos', 'excelencia')",
            name="ck_tbog_entries_category",
        ),
        sa.CheckConstraint(
            "status != 'published' OR "
            "(publication_authorized = true AND image_key IS NOT NULL)",
            name="ck_tbog_entries_published",
        ),
    )

    op.create_index(
        "ix_tbog_entries_status_type",
        "tbog_entries",
        ["status", "content_type"],
    )

    op.execute(
        """
        GRANT SELECT, INSERT, UPDATE, DELETE
        ON TABLE tbog_entries
        TO gensti_app
        """
    )

    op.execute(
        """
        INSERT INTO permissions (code)
        VALUES ('tbog.manage')
        ON CONFLICT (code) DO NOTHING
        """
    )

    op.execute(
        """
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles AS r
        CROSS JOIN permissions AS p
        WHERE r.name IN ('admin', 'superadmin')
          AND p.code = 'tbog.manage'
        ON CONFLICT (role_id, permission_id) DO NOTHING
        """
    )


def downgrade():
    op.execute(
        """
        DELETE FROM user_permission_overrides
        WHERE permission_id IN (
            SELECT id
            FROM permissions
            WHERE code = 'tbog.manage'
        )
        """
    )

    op.execute(
        """
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id
            FROM permissions
            WHERE code = 'tbog.manage'
        )
        """
    )

    op.execute(
        """
        DELETE FROM permissions
        WHERE code = 'tbog.manage'
        """
    )

    op.drop_index(
        "ix_tbog_entries_status_type",
        table_name="tbog_entries",
    )

    op.drop_table("tbog_entries")