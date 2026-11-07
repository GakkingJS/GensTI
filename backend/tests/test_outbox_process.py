from datetime import datetime, timedelta, timezone
from uuid import uuid4

from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import EmailOutbox, EmailVerificationToken
from outbox_claim import claim_next_email
from outbox_cipher import OutboxCipher
from outbox_process import process_claimed_email
from registration_outbox import register_with_outbox
from test_authorization import db, test_engine  # noqa: F401
from verification_mail import FakeVerificationEmailSender


def prepare(db, cipher):
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
    return cipher, message


class FailingSender:
    def send_verification(self, message):
        raise RuntimeError("fallo simulado del proveedor")


def test_success_marks_sent_and_clears_ciphertext(db, checked_cipher):
    cipher, message = prepare(db, checked_cipher)
    sender = FakeVerificationEmailSender()

    assert process_claimed_email(db, message.id, cipher, sender) == "sent"
    assert len(sender.sent) == 1
    assert sender.sent[0].recipient == message.recipient
    assert message.status == "sent"
    assert message.sent_at is not None
    assert message.token_ciphertext is None
    assert message.locked_at is None


def test_delivery_failure_schedules_retry(db, checked_cipher):
    cipher, message = prepare(db, checked_cipher)

    assert process_claimed_email(
        db, message.id, cipher, FailingSender()
    ) == "retry"
    assert message.status == "pending"
    assert message.attempts == 1
    assert message.available_at > datetime.now(timezone.utc)
    assert message.token_ciphertext is not None
    assert message.last_error == "delivery_retry"


def test_third_failure_is_terminal(db, checked_cipher):
    cipher, message = prepare(db, checked_cipher)
    message.attempts = 3
    db.flush()

    assert process_claimed_email(
        db, message.id, cipher, FailingSender()
    ) == "failed"
    assert message.status == "failed"
    assert message.token_ciphertext is None
    assert message.last_error == "delivery_failed"


def test_expired_verification_is_not_sent(db, checked_cipher):
    cipher, message = prepare(db, checked_cipher)
    verification = db.get(
        EmailVerificationToken, message.verification_token_id
    )
    verification.expires_at = datetime.now(timezone.utc) - timedelta(
        seconds=1
    )
    db.flush()
    sender = FakeVerificationEmailSender()

    assert process_claimed_email(db, message.id, cipher, sender) == "failed"
    assert sender.sent == []
    assert message.token_ciphertext is None
    assert message.last_error == "verification_unavailable"


def test_wrong_key_is_not_sent(db, checked_cipher):
    _, message = prepare(db, checked_cipher)
    wrong_cipher = OutboxCipher(Fernet.generate_key())
    sender = FakeVerificationEmailSender()

    assert process_claimed_email(
        db, message.id, wrong_cipher, sender
    ) == "failed"
    assert sender.sent == []
    assert message.last_error == "invalid_ciphertext"
    assert message.token_ciphertext is None


def test_non_processing_message_is_ignored(db):
    cipher = OutboxCipher(Fernet.generate_key())
    sender = FakeVerificationEmailSender()

    assert process_claimed_email(
        db, uuid4(), cipher, sender
    ) == "not_processing"
    assert sender.sent == []


def test_committed_claim_can_be_processed(
    test_engine, committed_cipher
):
    cipher = committed_cipher
    sender = FakeVerificationEmailSender()
    email = f"{uuid4().hex}@campusucc.edu.co"

    with Session(test_engine) as session:
        register_with_outbox(
            session,
            email,
            "Una-frase-larga-y-unica-2026",
            cipher,
        )
        session.commit()

    with Session(test_engine) as session:
        message_id = claim_next_email(session)
        assert message_id is not None
        session.commit()

    with Session(test_engine) as session:
        assert process_claimed_email(
            session, message_id, cipher, sender
        ) == "sent"
        session.commit()

    with Session(test_engine) as session:
        message = session.get(EmailOutbox, message_id)
        assert message.status == "sent"
        assert message.token_ciphertext is None
        session.delete(message)
        session.commit()