"""create community highlights

Revision ID: community_highlights_20261116
Revises: create_news_20261116
Create Date: 2026-11-16

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "community_highlights_20261116"
down_revision: Union[str, Sequence[str], None] = "create_news_20261116"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    table_exists = conn.execute(
        text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_schema = 'public' "
            "AND table_name = 'community_highlights'"
        )
    ).scalar() is not None

    if not table_exists:
        op.create_table(
            "community_highlights",
            sa.Column("id", UUID(as_uuid=True), primary_key=True),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("category", sa.String(length=80), nullable=False),
            sa.Column(
                "sort_order",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column("image_key", sa.String(length=100), nullable=True),
            sa.Column(
                "image_alt",
                sa.String(length=300),
                nullable=False,
                server_default="",
            ),
            sa.Column(
                "image_position",
                sa.String(length=30),
                nullable=False,
                server_default="center",
            ),
            sa.Column(
                "status",
                sa.String(length=20),
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
                UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_by_id",
                UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "updated_by_id",
                UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
            ),
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
                "(publication_authorized = true AND image_key IS NOT NULL)",
                name="ck_community_highlights_published",
            ),
        )

    index_exists = conn.execute(
        text(
            "SELECT 1 FROM pg_indexes "
            "WHERE schemaname = 'public' "
            "AND indexname = 'ix_community_highlights_status_order'"
        )
    ).scalar() is not None

    if not index_exists:
        op.create_index(
            "ix_community_highlights_status_order",
            "community_highlights",
            ["status", "sort_order"],
        )


def downgrade() -> None:
    op.drop_index(
        "ix_community_highlights_status_order",
        table_name="community_highlights",
    )
    op.drop_table("community_highlights")
