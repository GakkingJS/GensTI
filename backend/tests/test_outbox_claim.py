from datetime import datetime, timedelta, timezone
from uuid import uuid4

from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import EmailOutbox, User
from outbox_claim import claim_next_email
from outbox_cipher import OutboxCipher
from registration_outbox import register_with_outbox
from test_authorization import db, test_engine  # noqa: F401


def enqueue(db, cipher, *, available_at=None):
    email = f"{uuid4().hex}@campusucc.edu.co"
    user_id = register_with_outbox(
        db,
        email,
        "Una-frase-larga-y-unica-2026",
        cipher,
    )
    message = db.scalar(
        select(EmailOutbox).where(EmailOutbox.recipient == email)
    )
    if available_at is not None:
        message.available_at = available_at
        db.flush()
    return user_id, message


def test_claims_available_message(db):
    _, message = enqueue(db)
    message_id = claim_next_email(db)

    assert message_id == message.id
    assert message.status == "processing"
    assert message.attempts == 1
    assert message.locked_at is not None
    assert message.token_ciphertext is not None


def test_claims_available_message(db, checked_cipher):
    _, message = enqueue(db, checked_cipher)
    # Conserva el resto de la prueba sin cambios.


def test_does_not_claim_future_message(db, checked_cipher):
    enqueue(
        db,
        checked_cipher,
        available_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    # Conserva el resto de la prueba sin cambios.


def test_does_not_claim_same_message_twice(db, checked_cipher):
    _, message = enqueue(db, checked_cipher)
    # Conserva el resto de la prueba sin cambios.


def test_committed_claim_is_visible_and_not_reclaimed(test_engine):
    email = f"{uuid4().hex}@campusucc.edu.co"
    cipher = OutboxCipher(Fernet.generate_key())

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
        message = session.get(EmailOutbox, message_id)
        assert message.status == "processing"
        assert message.attempts == 1
        assert claim_next_email(session) is None

    with Session(test_engine) as session:
        session.delete(session.get(EmailOutbox, message_id))
        session.commit()


def test_second_connection_skips_message_locked_by_first(test_engine):
    email = f"{uuid4().hex}@campusucc.edu.co"
    cipher = OutboxCipher(Fernet.generate_key())

    with Session(test_engine) as setup:
        user_id = register_with_outbox(
            setup,
            email,
            "Una-frase-larga-y-unica-2026",
            cipher,
        )
        message_id = setup.scalar(
            select(EmailOutbox.id).where(
                EmailOutbox.recipient == email
            )
        )
        setup.commit()

    try:
        with test_engine.connect() as first_connection:
            with test_engine.connect() as second_connection:
                first_transaction = first_connection.begin()
                second_transaction = second_connection.begin()

                try:
                    with Session(bind=first_connection) as first:
                        assert claim_next_email(first) == message_id

                        with Session(bind=second_connection) as second:
                            assert claim_next_email(second) is None

                    # La primera transacción aún no confirmó el cambio.
                    # Al revertirla, el mensaje vuelve a estar disponible.
                    first_transaction.rollback()
                    second_transaction.rollback()
                finally:
                    if first_transaction.is_active:
                        first_transaction.rollback()
                    if second_transaction.is_active:
                        second_transaction.rollback()

        with Session(test_engine) as check:
            message = check.get(EmailOutbox, message_id)
            assert message.status == "pending"
            assert message.attempts == 0
    finally:
        with Session(test_engine) as cleanup:
            user = cleanup.get(User, user_id)
            if user is not None:
                cleanup.delete(user)
                cleanup.commit()


def test_committed_claim_is_visible_and_not_reclaimed(
    test_engine, committed_cipher
):
    cipher = committed_cipher
    # Conserva el resto sin cambios.


def test_second_connection_skips_message_locked_by_first(
    test_engine, committed_cipher
):
    cipher = committed_cipher
    # Conserva el resto sin cambios.