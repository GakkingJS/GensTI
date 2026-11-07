from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from email_verification import create_verification_token, verify_email_token
from models import EmailVerificationToken
from test_authorization import db, make_user, test_engine  # noqa: F401


def test_valid_token_activates_account(db):
    user = make_user(db, active=False, verified=False)
    token = create_verification_token(db, user)

    assert verify_email_token(db, token) is True
    assert user.email_verified_at is not None
    assert user.is_active is True

    record = db.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.user_id == user.id
        )
    )
    assert record.used_at is not None


def test_token_cannot_be_reused(db):
    user = make_user(db, active=False, verified=False)
    token = create_verification_token(db, user)

    assert verify_email_token(db, token) is True
    assert verify_email_token(db, token) is False


def test_expired_token_does_not_activate_account(db):
    user = make_user(db, active=False, verified=False)
    token = create_verification_token(db, user)
    record = db.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.user_id == user.id
        )
    )
    record.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.flush()

    assert verify_email_token(db, token) is False
    assert user.email_verified_at is None
    assert user.is_active is False


def test_unknown_token_does_not_verify(db):
    assert verify_email_token(db, "token-invalido") is False




from concurrent.futures import ThreadPoolExecutor
from threading import Event
from uuid import uuid4

from sqlalchemy.orm import Session

from models import User


def test_concurrent_verification_consumes_token_only_once(test_engine):
    email = f"{uuid4().hex}@campusucc.edu.co"

    with Session(test_engine) as session:
        with session.begin():
            user = User(email=email, is_active=False)
            session.add(user)
            session.flush()
            user_id = user.id
            token = create_verification_token(session, user)

    first_verified = Event()
    release_first = Event()

    def verify_first():
        with Session(test_engine) as session:
            with session.begin():
                assert verify_email_token(session, token) is True
                first_verified.set()
                if not release_first.wait(timeout=10):
                    raise TimeoutError(
                        "No se liberó la primera transacción"
                    )

    def verify_second():
        with Session(test_engine) as session:
            with session.begin():
                return verify_email_token(session, token)

    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            first = pool.submit(verify_first)
            assert first_verified.wait(timeout=10)

            second = pool.submit(verify_second)
            try:
                # La segunda verificación no debería terminar mientras
                # la primera aún conserva el bloqueo del token.
                from concurrent.futures import TimeoutError as FutureTimeout

                try:
                    second.result(timeout=0.2)
                except FutureTimeout:
                    pass
                else:
                    raise AssertionError(
                        "La segunda verificación terminó antes del commit"
                    )
            finally:
                release_first.set()

            first.result(timeout=10)
            assert second.result(timeout=10) is False

        with Session(test_engine) as session:
            saved_user = session.get(User, user_id)
            assert saved_user.is_active is True
            assert saved_user.email_verified_at is not None
    finally:
        release_first.set()
        with Session(test_engine) as session:
            with session.begin():
                user = session.get(User, user_id)
                if user is not None:
                    session.delete(user)