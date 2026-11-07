from uuid import uuid4

import pytest
from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import EmailOutbox, User
from outbox_cipher import OutboxCipher
from outbox_key_check import OutboxKeyMismatch, OutboxKeyNotInitialized
from outbox_run import run_outbox_once
from registration_outbox import register_with_outbox
from test_authorization import test_engine  # noqa: F401
from verification_mail import FakeVerificationEmailSender


PASSWORD = "Una-frase-larga-y-unica-2026"


def enqueue(test_engine, cipher, count):
    user_ids = []

    with Session(test_engine) as session:
        with session.begin():
            for _ in range(count):
                email = f"{uuid4().hex}@campusucc.edu.co"
                user_ids.append(
                    register_with_outbox(
                        session, email, PASSWORD, cipher
                    )
                )

    return user_ids


def cleanup(test_engine, user_ids):
    with Session(test_engine) as session:
        with session.begin():
            for user_id in user_ids:
                user = session.get(User, user_id)
                if user is not None:
                    session.delete(user)


def test_run_sends_pending_messages(test_engine, committed_cipher):
    cipher = committed_cipher
    sender = FakeVerificationEmailSender()
    user_ids = enqueue(test_engine, cipher, 2)

    try:
        result = run_outbox_once(test_engine, cipher, sender)

        assert result.recovered == 0
        assert result.claimed == 2
        assert result.sent == 2
        assert result.retry == 0
        assert result.failed == 0
        assert len(sender.sent) == 2

        with Session(test_engine) as session:
            messages = session.scalars(select(EmailOutbox)).all()
            assert len(messages) == 2
            assert all(message.status == "sent" for message in messages)
            assert all(
                message.token_ciphertext is None
                for message in messages
            )
    finally:
        cleanup(test_engine, user_ids)


def test_run_respects_limit(test_engine, committed_cipher):
    cipher = committed_cipher
    sender = FakeVerificationEmailSender()
    user_ids = enqueue(test_engine, cipher, 2)

    try:
        result = run_outbox_once(
            test_engine, cipher, sender, limit=1
        )

        assert result.claimed == 1
        assert result.sent == 1
        assert len(sender.sent) == 1

        with Session(test_engine) as session:
            messages = session.scalars(select(EmailOutbox)).all()
            assert sorted(message.status for message in messages) == [
                "pending",
                "sent",
            ]
    finally:
        cleanup(test_engine, user_ids)


def test_empty_run_does_nothing(test_engine, committed_cipher):
    sender = FakeVerificationEmailSender()

    result = run_outbox_once(
        test_engine, committed_cipher, sender
    )

    assert result.recovered == 0
    assert result.claimed == 0
    assert result.sent == 0
    assert sender.sent == []


def test_run_requires_initialized_key(test_engine):
    with pytest.raises(OutboxKeyNotInitialized):
        run_outbox_once(
            test_engine,
            OutboxCipher(Fernet.generate_key()),
            FakeVerificationEmailSender(),
        )


def test_run_rejects_wrong_key_before_claiming(
    test_engine, committed_cipher
):
    user_ids = enqueue(test_engine, committed_cipher, 1)
    wrong_cipher = OutboxCipher(Fernet.generate_key())
    sender = FakeVerificationEmailSender()

    try:
        with pytest.raises(OutboxKeyMismatch):
            run_outbox_once(test_engine, wrong_cipher, sender)

        with Session(test_engine) as session:
            message = session.scalar(
                select(EmailOutbox).where(
                    EmailOutbox.status == "pending"
                )
            )
            assert message is not None
            assert message.attempts == 0
            assert message.token_ciphertext is not None
        assert sender.sent == []
    finally:
        cleanup(test_engine, user_ids)

from outbox_claim import claim_next_email
from outbox_process import process_claimed_email


def test_accepted_email_before_commit_can_be_retried(
    test_engine, committed_cipher
):
    sender = FakeVerificationEmailSender()
    user_ids = enqueue(test_engine, committed_cipher, 1)

    try:
        with Session(test_engine) as session:
            with session.begin():
                message_id = claim_next_email(session)

        assert message_id is not None

        with Session(test_engine) as session:
            outcome = process_claimed_email(
                session, message_id, committed_cipher, sender
            )
            assert outcome == "sent"
            assert len(sender.sent) == 1
            session.rollback()

        with Session(test_engine) as session:
            message = session.get(EmailOutbox, message_id)
            assert message.status == "processing"
            assert message.token_ciphertext is not None
            assert message.sent_at is None
            assert message.attempts == 1

        # Simula la recuperación tras vencer el reclamo, sin esperar
        # diez minutos ni ejecutar un emisor real.
        from datetime import datetime, timedelta, timezone
        from outbox_recovery import (
            CLAIM_TIMEOUT,
            recover_abandoned_emails,
        )

        with Session(test_engine) as session:
            with session.begin():
                message = session.get(EmailOutbox, message_id)
                message.locked_at = (
                    datetime.now(timezone.utc)
                    - CLAIM_TIMEOUT
                    - timedelta(seconds=1)
                )
                session.flush()
                assert recover_abandoned_emails(session) == 1

        result = run_outbox_once(
            test_engine, committed_cipher, sender, limit=1
        )
        assert result.claimed == 1
        assert result.sent == 1
        assert len(sender.sent) == 2
        assert sender.sent[0] == sender.sent[1]
    finally:
        cleanup(test_engine, user_ids)