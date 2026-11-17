"""create news

Revision ID: create_news_20261116
Revises: users_delete_20261115
Create Date: 2026-11-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "create_news_20261116"
down_revision: Union[str, Sequence[str], None] = "users_delete_20261115"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "news",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=220), nullable=False, unique=True),
        sa.Column("excerpt", sa.String(length=500), nullable=False),
        sa.Column(
            "content",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "category",
            sa.String(length=80),
            nullable=False,
            server_default="Anuncios",
        ),
        sa.Column(
            "author_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("author_name", sa.String(length=120), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "is_featured",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
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
            "status IN ('draft', 'published')",
            name="ck_news_status",
        ),
    )

    op.create_index(
        "ix_news_status_published_at",
        "news",
        ["status", "published_at"],
    )
    op.create_index("ix_news_category", "news", ["category"])


def downgrade() -> None:
    op.drop_index("ix_news_category", table_name="news")
    op.drop_index("ix_news_status_published_at", table_name="news")
    op.drop_table("news")
