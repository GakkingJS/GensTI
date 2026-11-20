"""create password reset tables

Revision ID: a1b2c3d4e5f6
Revises: community_highlights_20261116
Create Date: 2026-11-19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "a1b2c3d4e5f6"
down_revision = "community_highlights_20261116"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "password_reset_tokens",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey(
                "users.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_password_reset_tokens_user_id",
        "password_reset_tokens",
        ["user_id"],
    )

    op.create_index(
        "ix_password_reset_tokens_token_hash",
        "password_reset_tokens",
        ["token_hash"],
    )

    op.create_table(
        "password_reset_outbox",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
        ),
        sa.Column(
            "password_reset_token_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey(
                "password_reset_tokens.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column("recipient", sa.String(length=254), nullable=False),
        sa.Column("token_ciphertext", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "available_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.String(length=200), nullable=True),
        sa.CheckConstraint(
            "status IN ('pending', 'processing', 'sent', 'failed')",
            name="ck_password_reset_outbox_status",
        ),
        sa.CheckConstraint(
            "attempts >= 0",
            name="ck_password_reset_outbox_attempts_nonnegative",
        ),
        sa.CheckConstraint(
            "status NOT IN ('pending', 'processing') "
            "OR token_ciphertext IS NOT NULL",
            name="ck_password_reset_outbox_active_ciphertext",
        ),
    )

    op.create_index(
        "ix_password_reset_outbox_status_available_at",
        "password_reset_outbox",
        ["status", "available_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_password_reset_outbox_status_available_at",
        table_name="password_reset_outbox",
    )
    op.drop_table("password_reset_outbox")
    op.drop_index(
        "ix_password_reset_tokens_token_hash",
        table_name="password_reset_tokens",
    )
    op.drop_index(
        "ix_password_reset_tokens_user_id",
        table_name="password_reset_tokens",
    )
    op.drop_table("password_reset_tokens")
