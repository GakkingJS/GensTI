"""Add email outbox.

Revision ID: b7d4e20c8a31
Revises: a6c2e91b4d70
"""

from alembic import op
import sqlalchemy as sa


revision = "b7d4e20c8a31"
down_revision = "a6c2e91b4d70"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "email_outbox",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("verification_token_id", sa.UUID(), nullable=False),
        sa.Column("recipient", sa.String(length=254), nullable=False),
        sa.Column(
            "message_type",
            sa.String(length=50),
            server_default="email_verification",
            nullable=False,
        ),
        sa.Column("token_ciphertext", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=20),
            server_default="pending",
            nullable=False,
        ),
        sa.Column(
            "attempts",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "available_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.String(length=200), nullable=True),
        sa.CheckConstraint(
            "status IN ('pending', 'processing', 'sent', 'failed')",
            name="ck_email_outbox_status",
        ),
        sa.CheckConstraint(
            "message_type = 'email_verification'",
            name="ck_email_outbox_message_type",
        ),
        sa.CheckConstraint(
            "attempts >= 0",
            name="ck_email_outbox_attempts_nonnegative",
        ),
        sa.ForeignKeyConstraint(
            ["verification_token_id"],
            ["email_verification_tokens.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_email_outbox_status_available_at",
        "email_outbox",
        ["status", "available_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_email_outbox_status_available_at",
        table_name="email_outbox",
    )
    op.drop_table("email_outbox")