"""Agregar secciones e imágenes a publicaciones estudiantiles."""

from alembic import op
import sqlalchemy as sa


revision = "post_media_20261115"
down_revision = "community_photos_20261115"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "community_posts",
        sa.Column(
            "section",
            sa.String(20),
            nullable=False,
            server_default="community",
        ),
    )

    op.add_column(
        "community_posts",
        sa.Column(
            "image_key",
            sa.String(100),
            nullable=True,
        ),
    )

    op.add_column(
        "community_posts",
        sa.Column(
            "image_alt",
            sa.String(300),
            nullable=False,
            server_default="",
        ),
    )

    op.add_column(
        "community_posts",
        sa.Column(
            "image_authorized",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.create_check_constraint(
        "ck_community_posts_section",
        "community_posts",
        "section IN ('community', 'opportunities')",
    )

    op.create_index(
        "ix_community_posts_status_section",
        "community_posts",
        ["status", "section"],
    )


def downgrade():
    op.drop_index(
        "ix_community_posts_status_section",
        table_name="community_posts",
    )

    op.drop_constraint(
        "ck_community_posts_section",
        "community_posts",
        type_="check",
    )

    op.drop_column("community_posts", "image_authorized")
    op.drop_column("community_posts", "image_alt")
    op.drop_column("community_posts", "image_key")
    op.drop_column("community_posts", "section")