"""Require ciphertext for deliverable outbox messages.

Revision ID: d9f6a42e0c53
Revises: c8e5f31d9b42
"""

from alembic import op


revision = "d9f6a42e0c53"
down_revision = "c8e5f31d9b42"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_email_outbox_active_ciphertext",
        "email_outbox",
        "status NOT IN ('pending', 'processing') "
        "OR token_ciphertext IS NOT NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_email_outbox_active_ciphertext",
        "email_outbox",
        type_="check",
    )