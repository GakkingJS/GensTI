from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select

from models import EmailOutbox
from outbox_claim import claim_next_email
from outbox_recovery import recover_abandoned_emails
from registration_outbox import register_with_outbox
from test_authorization import db, test_engine  # noqa: F401


def prepare_claimed(db, cipher):
    email = f"{uuid4().hex}@campusucc.edu.co"
    register_with_outbox(
        db,
        email,
        "Una-frase-larga-y-unica-2026",
        cipher,
    )
    message = db.scalar(
        select(EmailOutbox).where(EmailOutbox.recipient == email)
    )
    assert claim_next_email(db) == message.id
    return message


def test_recovers_abandoned_claim_for_retry(db, checked_cipher):
    message = prepare_claimed(db, checked_cipher)
    message.locked_at = datetime.now(timezone.utc) - timedelta(minutes=11)
    db.flush()

    assert recover_abandoned_emails(db) == 1
    assert message.status == "pending"
    assert message.locked_at is None
    assert message.token_ciphertext is not None
    assert message.last_error == "claim_expired"
    assert message.available_at <= datetime.now(timezone.utc)


def test_recent_claim_is_not_recovered(db, checked_cipher):
    message = prepare_claimed(db, checked_cipher)

    assert recover_abandoned_emails(db) == 0
    assert message.status == "processing"
    assert message.locked_at is not None


def test_abandoned_third_attempt_is_terminal(db, checked_cipher):
    message = prepare_claimed(db, checked_cipher)
    message.attempts = 3
    message.locked_at = datetime.now(timezone.utc) - timedelta(minutes=11)
    db.flush()

    assert recover_abandoned_emails(db) == 1
    assert message.status == "failed"
    assert message.token_ciphertext is None
    assert message.locked_at is None
    assert message.last_error == "claim_expired_max_attempts"


def test_inconsistent_processing_without_lock_is_not_recovered(
    db, checked_cipher
):
    message = prepare_claimed(db, checked_cipher)
    message.locked_at = None
    db.flush()

    assert recover_abandoned_emails(db) == 0
    assert message.status == "processing"


def test_recovery_obeys_limit(db, checked_cipher):
    first = prepare_claimed(db, checked_cipher)
    second = prepare_claimed(db, checked_cipher)
    old = datetime.now(timezone.utc) - timedelta(minutes=11)
    first.locked_at = old
    second.locked_at = old