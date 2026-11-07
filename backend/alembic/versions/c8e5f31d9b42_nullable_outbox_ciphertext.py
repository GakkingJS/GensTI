"""Allow clearing terminal outbox ciphertext.

Revision ID: c8e5f31d9b42
Revises: b7d4e20c8a31
"""

from alembic import op
import sqlalchemy as sa


revision = "c8e5f31d9b42"
down_revision = "b7d4e20c8a31"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "email_outbox",
        "token_ciphertext",
        existing_type=sa.Text(),
        nullable=True,
    )


def downgrade() -> None:
    # No es seguro volver a NOT NULL si ya se limpiaron mensajes.
    # Se necesitaría una política explícita para esas filas.
    raise RuntimeError(
        "No se puede restaurar NOT NULL después de limpiar tokens cifrados"
    )