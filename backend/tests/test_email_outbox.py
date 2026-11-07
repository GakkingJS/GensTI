from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from models import EmailOutbox, EmailVerificationToken
from test_authorization import db, make_user, test_engine  # noqa: F401


def make_verification_token(db):
    user = make_user(db, active=False, verified=False)
    token = EmailVerificationToken(
        user_id=user.id,
        token_hash=uuid4().hex.ljust(64, "0"),
        expires_at=user.created_at,
    )
    db.add(token)
    db.flush()
    return user, token


def make_outbox(db, **overrides):
    user, token = make_verification_token(db)
    values = {
        "verification_token_id": token.id,
        "recipient": user.email,
        "token_ciphertext": "valor-ficticio-para-probar-el-esquema",
    }
    values.update(overrides)
    message = EmailOutbox(**values)
    db.add(message)
    return message


def test_outbox_defaults_and_token_reference(db):
    message = make_outbox(db)
    db.flush()

    saved = db.scalar(select(EmailOutbox).where(EmailOutbox.id == message.id))

    assert saved.verification_token_id == message.verification_token_id
    assert saved.status == "pending"
    assert saved.message_type == "email_verification"
    assert saved.attempts == 0
    assert saved.available_at is not None
    assert saved.created_at is not None
    assert saved.sent_at is None
    assert saved.locked_at is None
    assert saved.last_error is None


@pytest.mark.parametrize(
    "overrides",
    [
        {"status": "unknown"},
        {"message_type": "arbitrary"},
        {"attempts": -1},
    ],
)
def test_outbox_rejects_invalid_values(db, overrides):
    with pytest.raises(IntegrityError):
        with db.begin_nested():
            make_outbox(db, **overrides)
            db.flush()


@pytest.mark.parametrize("status", ["pending", "processing"])
def test_active_outbox_requires_ciphertext(db, status):
    with pytest.raises(IntegrityError):
        with db.begin_nested():
            make_outbox(db, status=status, token_ciphertext=None)
            db.flush()


@pytest.mark.parametrize("status", ["sent", "failed"])
def test_terminal_outbox_allows_cleared_ciphertext(db, status):
    message = make_outbox(
        db,
        status=status,
        token_ciphertext=None,
    )
    db.flush()

    assert message.token_ciphertext is None
    assert message.status == status