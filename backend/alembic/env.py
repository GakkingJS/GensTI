import os
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import URL

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from models import Base

target_metadata = Base.metadata

def database_url() -> URL:
    password_file = Path(
        os.getenv(
            "MIGRATION_PASSWORD_FILE",
            "/run/secrets/gensti_migration_password",
        )
    )
    password = password_file.read_text(encoding="utf-8").strip()

    if not password:
        raise RuntimeError("El secreto de migración está vacío")

    return URL.create(
        drivername="postgresql+psycopg",
        username="gensti_user",
        password=password,
        host="db",
        port=5432,
        database="gensti",
    )


def run_migrations_offline() -> None:
    raise RuntimeError(
        "Las migraciones sin conexión están deshabilitadas en GENSTI"
    )


def run_migrations_online() -> None:
    connectable = create_engine(database_url(), poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()