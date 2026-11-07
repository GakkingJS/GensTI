import pytest
from cryptography.fernet import Fernet

from outbox_cipher import OutboxCipher
from outbox_key_check import (
    OutboxKeyMismatch,
    OutboxKeyNotInitialized,
    initialize_outbox_key_check,
    require_outbox_key,
)
from test_authorization import db, test_engine  # noqa: F401


def test_missing_key_check_fails_closed(db):
    with pytest.raises(OutboxKeyNotInitialized):
        require_outbox_key(db, OutboxCipher(Fernet.generate_key()))


def test_correct_key_passes(db):
    cipher = OutboxCipher(Fernet.generate_key())
    initialize_outbox_key_check(db, cipher)

    require_outbox_key(db, cipher)


def test_different_valid_key_is_rejected(db):
    original = OutboxCipher(Fernet.generate_key())
    wrong = OutboxCipher(Fernet.generate_key())
    initialize_outbox_key_check(db, original)

    with pytest.raises(OutboxKeyMismatch):
        require_outbox_key(db, wrong)


def test_cannot_initialize_twice(db):
    cipher = OutboxCipher(Fernet.generate_key())
    initialize_outbox_key_check(db, cipher)

    with pytest.raises(RuntimeError, match="ya está inicializada"):
        initialize_outbox_key_check(db, cipher)