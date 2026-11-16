"""Crear fotos administrables de la comunidad."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "community_photos_20261115"
down_revision = "tbog_20261114"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "community_highlights",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "title",
            sa.String(200),
            nullable=False,
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "category",
            sa.String(80),
            nullable=False,
        ),
        sa.Column(
            "sort_order",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "image_key",
            sa.String(100),
            nullable=True,
        ),
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
            "status IN ('draft', 'published', 'archived')",
            name="ck_community_highlights_status",
        ),
        sa.CheckConstraint(
            "sort_order >= 0",
            name="ck_community_highlights_sort_order",
        ),
        sa.CheckConstraint(
            "status != 'published' OR "
            "(publication_authorized = true "
            "AND image_key IS NOT NULL)",
            name="ck_community_highlights_published",
        ),
    )

    op.create_index(
        "ix_community_highlights_status_order",
        "community_highlights",
        ["status", "sort_order"],
    )

    op.execute(
        """
        GRANT SELECT, INSERT, UPDATE, DELETE
        ON TABLE community_highlights
        TO gensti_app
        """
    )

    op.execute(
        """
        INSERT INTO permissions (code)
        VALUES ('community_highlights.manage')
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
          AND p.code = 'community_highlights.manage'
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
            WHERE code = 'community_highlights.manage'
        )
        """
    )

    op.execute(
        """
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id
            FROM permissions
            WHERE code = 'community_highlights.manage'
        )
        """
    )

    op.execute(
        """
        DELETE FROM permissions
        WHERE code = 'community_highlights.manage'
        """
    )

    op.drop_index(
        "ix_community_highlights_status_order",
        table_name="community_highlights",
    )

    op.drop_table("community_highlights")