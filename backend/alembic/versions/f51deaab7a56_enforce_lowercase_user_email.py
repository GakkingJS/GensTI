"""enforce_lowercase_user_email

Revision ID: f51deaab7a56
Revises: 33fb2d9de810
Create Date: 2026-09-28 23:03:03.194430

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f51deaab7a56'
down_revision: Union[str, Sequence[str], None] = '33fb2d9de810'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_users_email_lowercase",
        "users",
        "email = lower(email)",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_users_email_lowercase",
        "users",
        type_="check",
    )
