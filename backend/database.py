import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session


def read_app_password() -> str:
    password_file = Path(
        os.getenv(
            "DB_PASSWORD_FILE",
            "/run/secrets/gensti_app_password",
        )
    )

    try:
        password = password_file.read_text(
            encoding="utf-8"
        ).strip()
    except OSError as exc:
        raise RuntimeError(
            "No se pudo leer el archivo secreto de PostgreSQL. "
            "Verifica DB_PASSWORD_FILE y los permisos."
        ) from exc

    if not password:
        raise RuntimeError(
            "La contraseña de la base de datos está vacía"
        )

    return password


def read_db_port() -> int:
    raw_port = os.getenv("DB_PORT", "5432")

    try:
        return int(raw_port)
    except ValueError as exc:
        raise RuntimeError(
            "DB_PORT debe ser un número entero válido."
        ) from exc


database_url = URL.create(
    drivername=os.getenv(
        "DB_DRIVER",
        "postgresql+psycopg",
    ),
    username=os.getenv(
        "DB_USER",
        "gensti_app",
    ),
    password=read_app_password(),
    host=os.getenv(
        "DB_HOST",
        "db",
    ),
    port=read_db_port(),
    database=os.getenv(
        "DB_NAME",
        "gensti",
    ),
)

engine = create_engine(
    database_url,
    pool_pre_ping=True,
)


def get_db():
    with Session(engine) as session:
        yield session