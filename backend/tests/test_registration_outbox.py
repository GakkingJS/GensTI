from hashlib import sha256
from uuid import uuid4

import pytest
from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import EmailOutbox, EmailVerificationToken, User
from outbox_cipher import OutboxCipher
from outbox_key_check import OutboxKeyMismatch, OutboxKeyNotInitialized
from registration_outbox import register_with_outbox
from test_authorization import db, test_engine  # noqa: F401


PASSWORD = "Una-frase-larga-y-unica-2026"


def test_registration_stores_only_encrypted_token_in_outbox(
    db, checked_cipher
):
    cipher = checked_cipher
    email = f"{uuid4().hex}@campusucc.edu.co"

    user_id = register_with_outbox(db, email, PASSWORD, cipher)
    user = db.get(User, user_id)
    message = db.scalar(
        select(EmailOutbox).where(EmailOutbox.recipient == email)
    )
    verification = db.get(
        EmailVerificationToken,
        message.verification_token_id,
    )
    original_token = cipher.decrypt_token(message.token_ciphertext)

    assert user.email == email
    assert user.is_active is False
    assert user.email_verified_at is None
    assert user.password_hash != PASSWORD
    assert message.status == "pending"
    assert message.recipient == email
    assert message.token_ciphertext != original_token
    assert original_token not in message.token_ciphertext
    assert verification.token_hash == sha256(
        original_token.encode("utf-8")
    ).hexdigest()


def test_registration_commit_persists_user_token_and_outbox(
    test_engine, committed_cipher
):
    email = f"{uuid4().hex}@campusucc.edu.co"
    user_id = None

    try:
        with Session(test_engine) as session:
            user_id = register_with_outbox(
                session, email, PASSWORD, committed_cipher
            )
            session.commit()

        with Session(test_engine) as session:
            assert session.get(User, user_id) is not None
            message = session.scalar(
                select(EmailOutbox).where(
                    EmailOutbox.recipient == email
                )
            )
            assert message is not None
            assert session.get(
                EmailVerificationToken,
                message.verification_token_id,
            ) is not None
    finally:
        if user_id is not None:
            with Session(test_engine) as session:
                user = session.get(User, user_id)
                if user is not None:
                    session.delete(user)
                    session.commit()


def test_registration_rollback_removes_all_three_records(
    test_engine, committed_cipher
):
    email = f"{uuid4().hex}@campusucc.edu.co"

    with Session(test_engine) as session:
        register_with_outbox(
            session, email, PASSWORD, committed_cipher
        )
        session.rollback()

    with Session(test_engine) as session:
        assert session.scalar(
            select(User).where(User.email == email)
        ) is None
        assert session.scalar(
            select(EmailOutbox).where(
                EmailOutbox.recipient == email
            )
        ) is None


def test_cipher_failure_rolls_back_registration(
    test_engine, committed_cipher
):
    email = f"{uuid4().hex}@campusucc.edu.co"

    class FailingCipher:
        def decrypt_token(self, ciphertext: str) -> str:
            return committed_cipher.decrypt_token(ciphertext)

        def encrypt_token(self, token: str) -> str:
            raise RuntimeError("Falló el cifrado")

    with pytest.raises(RuntimeError, match="Falló el cifrado"):
        with Session(test_engine) as session:
            with session.begin():
                register_with_outbox(
                    session,
                    email,
                    PASSWORD,
                    FailingCipher(),
                )

    with Session(test_engine) as session:
        assert session.scalar(
            select(User).where(User.email == email)
        ) is None
        assert session.scalar(
            select(EmailOutbox).where(
                EmailOutbox.recipient == email
            )
        ) is None


def test_registration_requires_initialized_key(db):
    email = f"{uuid4().hex}@campusucc.edu.co"

    with pytest.raises(OutboxKeyNotInitialized):
        register_with_outbox(
            db,
            email,
            PASSWORD,
            OutboxCipher(Fernet.generate_key()),
        )

    assert db.scalar(
        select(User).where(User.email == email)
    ) is None


def test_registration_rejects_wrong_key_without_creating_user(
    db, checked_cipher
):
    email = f"{uuid4().hex}@campusucc.edu.co"
    wrong_cipher = OutboxCipher(Fernet.generate_key())

    with pytest.raises(OutboxKeyMismatch):
        register_with_outbox(
            db,
            email,
            PASSWORD,
            wrong_cipher,
        )

    assert db.scalar(
        select(User).where(User.email == email)
    ) is None
    assert db.scalar(
        select(EmailOutbox).where(
            EmailOutbox.recipient == email
        )
    ) is None