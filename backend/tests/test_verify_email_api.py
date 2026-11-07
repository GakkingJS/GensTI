from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from email_verification import create_verification_token
from main import app, get_db
from models import EmailVerificationToken, User
from test_authorization import test_engine  # noqa: F401


from cryptography.fernet import Fernet

from models import EmailOutbox
from outbox_claim import claim_next_email
from outbox_cipher import OutboxCipher
from outbox_process import process_claimed_email
from registration_outbox import register_with_outbox
from verification_mail import FakeVerificationEmailSender
from outbox_key_check import initialize_outbox_key_check


@pytest.fixture
def api_db(test_engine):
    with test_engine.connect() as connection:
        transaction = connection.begin()

        def override_get_db():
            with Session(
                bind=connection,
                join_transaction_mode="create_savepoint",
            ) as session:
                yield session

        app.dependency_overrides[get_db] = override_get_db
        try:
            yield connection
        finally:
            app.dependency_overrides.pop(get_db, None)
            transaction.rollback()


def make_pending_user(connection):
    with Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
    ) as session:
        with session.begin():
            user = User(
                email=f"{uuid4().hex}@campusucc.edu.co",
                is_active=False,
            )
            session.add(user)
            session.flush()
            token = create_verification_token(session, user)
            user_id = user.id

    return user_id, token


def test_verify_email_endpoint_activates_account(api_db):
    user_id, token = make_pending_user(api_db)

    with TestClient(app) as client:
        response = client.post(
            "/auth/verify-email",
            json={"token": token},
        )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    with Session(bind=api_db) as session:
        user = session.get(User, user_id)
        record = session.scalar(
            select(EmailVerificationToken).where(
                EmailVerificationToken.user_id == user_id
            )
        )
        assert user.is_active is True
        assert user.email_verified_at is not None
        assert record.used_at is not None


def test_verify_email_endpoint_rejects_reused_token(api_db):
    _, token = make_pending_user(api_db)

    with TestClient(app) as client:
        first = client.post(
            "/auth/verify-email",
            json={"token": token},
        )
        second = client.post(
            "/auth/verify-email",
            json={"token": token},
        )

    assert first.status_code == 200
    assert second.status_code == 400


def test_verify_email_endpoint_rejects_unknown_token(api_db):
    with TestClient(app) as client:
        response = client.post(
            "/auth/verify-email",
            json={"token": "token-invalido"},
        )

    assert response.status_code == 400


def test_verify_email_endpoint_requires_token(api_db):
    with TestClient(app) as client:
        response = client.post(
            "/auth/verify-email",
            json={},
        )

    assert response.status_code == 422


def test_registration_outbox_delivery_and_api_verification(api_db):
    email = f"{uuid4().hex}@campusucc.edu.co"
    cipher = OutboxCipher(Fernet.generate_key())
    sender = FakeVerificationEmailSender()

    with Session(
        bind=api_db,
        join_transaction_mode="create_savepoint",
    ) as session:
        with session.begin():
            initialize_outbox_key_check(session, cipher)
            user_id = register_with_outbox(
                session,
                email,
                "Una-frase-larga-y-unica-2026",
                cipher,
            )
            user = session.get(User, user_id)
            assert user.is_active is False
            assert user.email_verified_at is None