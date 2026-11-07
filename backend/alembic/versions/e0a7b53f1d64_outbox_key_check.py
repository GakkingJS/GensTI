"""Add explicit outbox encryption key check.

Revision ID: e0a7b53f1d64
Revises: d9f6a42e0c53
"""

from alembic import op
import sqlalchemy as sa


revision = "e0a7b53f1d64"
down_revision = "d9f6a42e0c53"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "outbox_key_check",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("check_ciphertext", sa.Text(), nullable=False),
        sa.CheckConstraint(
            "id = 1",
            name="ck_outbox_key_check_single_row",
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("outbox_key_check")