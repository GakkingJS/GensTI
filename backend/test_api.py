import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session

from main import app, get_db


password = Path(
    os.environ["TEST_DATABASE_PASSWORD_FILE"]
).read_text(encoding="utf-8").strip()

if not password:
    raise RuntimeError("El secreto de pruebas está vacío")

test_url = URL.create(
    "postgresql+psycopg",
    username=os.environ["TEST_DATABASE_USER"],
    password=password,
    host=os.environ["TEST_DATABASE_HOST"],
    database=os.environ["TEST_DATABASE_NAME"],
)

test_engine = create_engine(test_url, pool_pre_ping=True)


def get_test_db():
    with Session(test_engine) as session:
        yield session


app.dependency_overrides[get_db] = get_test_db