from unittest.mock import Mock

from outbox_entrypoint import run_outbox_with_configured_key
from outbox_run import OutboxRunResult


def test_entrypoint_passes_loaded_cipher_and_sender(monkeypatch):
    engine = object()
    sender = object()
    cipher = object()
    expected = OutboxRunResult(
        recovered=0,
        claimed=0,
        sent=0,
        retry=0,
        failed=0,
    )
    loader = Mock(return_value=cipher)
    runner = Mock(return_value=expected)

    monkeypatch.setattr(
        "outbox_entrypoint.load_outbox_cipher", loader
    )
    monkeypatch.setattr(
        "outbox_entrypoint.run_outbox_once", runner
    )

    result = run_outbox_with_configured_key(
        engine, sender, limit=3
    )

    loader.assert_called_once_with()
    runner.assert_called_once_with(
        engine, cipher, sender, limit=3
    )
    assert result is expected


from uuid import uuid4

from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import EmailOutbox, User
from outbox_cipher import OutboxCipher
from outbox_key_check import initialize_outbox_key_check
from registration_outbox import register_with_outbox
from test_authorization import test_engine  # noqa: F401
from verification_mail import FakeVerificationEmailSender


def test_entrypoint_processes_with_temporary_key_and_fake_sender(
    test_engine, tmp_path, monkeypatch
):
    key = Fernet.generate_key()
    key_file = tmp_path / "outbox_fernet_key"
    key_file.write_bytes(key + b"\n")
    monkeypatch.setenv("OUTBOX_FERNET_KEY_FILE", str(key_file))

    cipher = OutboxCipher(key)
    email = f"{uuid4().hex}@campusucc.edu.co"
    sender = FakeVerificationEmailSender()
    user_id = None

    try:
        with Session(test_engine) as session:
            with session.begin():
                initialize_outbox_key_check(session, cipher)
                user_id = register_with_outbox(
                    session,
                    email,
                    "Una-frase-larga-y-unica-2026",
                    cipher,
                )

        result = run_outbox_with_configured_key(
            test_engine, sender, limit=1
        )

        assert result.recovered == 0
        assert result.claimed == 1
        assert result.sent == 1
        assert result.retry == 0
        assert result.failed == 0
        assert len(sender.sent) == 1
        assert sender.sent[0].recipient == email

        with Session(test_engine) as session:
            message = session.scalar(
                select(EmailOutbox).where(
                    EmailOutbox.recipient == email
                )
            )
            assert message is not None
            assert message.status == "sent"
            assert message.token_ciphertext is None
    finally:
        from models import OutboxKeyCheck

        with Session(test_engine) as session:
            with session.begin():
                if user_id is not None:
                    user = session.get(User, user_id)
                    if user is not None:
                        session.delete(user)

                check = session.get(OutboxKeyCheck, 1)
                if check is not None:
                    session.delete(check)