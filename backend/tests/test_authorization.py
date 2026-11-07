import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session

from authorization import has_permission
from models import (
    Base,
    Permission,
    Role,
    RolePermission,
    User,
    UserPermissionOverride,
    UserRole,
)


@pytest.fixture(scope="session")
def test_engine():
    password_file = Path(os.environ["TEST_DATABASE_PASSWORD_FILE"])
    password = password_file.read_text(encoding="utf-8").strip()
    if not password:
        raise RuntimeError("El secreto de pruebas está vacío")

    url = URL.create(
        "postgresql+psycopg",
        username=os.environ["TEST_DATABASE_USER"],
        password=password,
        host=os.environ["TEST_DATABASE_HOST"],
        database=os.environ["TEST_DATABASE_NAME"],
    )
    engine = create_engine(url)

    Base.metadata.create_all(engine)
    try:
        yield engine
    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture
def db(test_engine):
    with test_engine.connect() as connection:
        transaction = connection.begin()
        with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
            yield session
        transaction.rollback()


def make_user(db, *, active=True, verified=True):
    user = User(
        email=f"{uuid4().hex}@campusucc.edu.co",
        is_active=active,
        email_verified_at=datetime.now(timezone.utc) if verified else None,
    )
    db.add(user)
    db.flush()
    return user


def make_permission(db, code="events.create"):
    permission = db.scalar(
        select(Permission).where(Permission.code == code)
    )
    if permission is None:
        permission = Permission(code=code)
        db.add(permission)
        db.flush()
    return permission


def test_nonexistent_user_is_denied(db):
    assert has_permission(db, uuid4(), "events.create") is False


def test_inactive_user_is_denied(db):
    user = make_user(db, active=False)
    permission = make_permission(db)
    db.add(
        UserPermissionOverride(
            user_id=user.id,
            permission_id=permission.id,
            decision="allow",
        )
    )
    db.flush()
    assert has_permission(db, user.id, permission.code) is False


def test_unverified_user_is_denied(db):
    user = make_user(db, verified=False)
    permission = make_permission(db)
    db.add(
        UserPermissionOverride(
            user_id=user.id,
            permission_id=permission.id,
            decision="allow",
        )
    )
    db.flush()
    assert has_permission(db, user.id, permission.code) is False


def test_permission_inherited_from_role(db):
    user = make_user(db)
    permission = make_permission(db)
    role = Role(name="professor")
    db.add(role)
    db.flush()
    db.add_all(
        [
            UserRole(user_id=user.id, role_id=role.id),
            RolePermission(role_id=role.id, permission_id=permission.id),
        ]
    )
    db.flush()
    assert has_permission(db, user.id, permission.code) is True


def test_individual_allow(db):
    user = make_user(db)
    permission = make_permission(db)
    db.add(
        UserPermissionOverride(
            user_id=user.id,
            permission_id=permission.id,
            decision="allow",
        )
    )
    db.flush()
    assert has_permission(db, user.id, permission.code) is True


def test_individual_deny_overrides_role(db):
    user = make_user(db)
    permission = make_permission(db)
    role = Role(name="professor")
    db.add(role)
    db.flush()
    db.add_all(
        [
            UserRole(user_id=user.id, role_id=role.id),
            RolePermission(role_id=role.id, permission_id=permission.id),
            UserPermissionOverride(
                user_id=user.id,
                permission_id=permission.id,
                decision="deny",
            ),
        ]
    )
    db.flush()
    assert has_permission(db, user.id, permission.code) is False


def test_no_permission_is_denied(db):
    user = make_user(db)
    assert has_permission(db, user.id, "events.create") is False