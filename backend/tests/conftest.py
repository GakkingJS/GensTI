import pytest
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session

from models import OutboxKeyCheck
from outbox_cipher import OutboxCipher
from outbox_key_check import initialize_outbox_key_check
from test_authorization import db, test_engine  # noqa: F401


@pytest.fixture
def checked_cipher(db):
    cipher = OutboxCipher(Fernet.generate_key())
    initialize_outbox_key_check(db, cipher)
    return cipher


@pytest.fixture
def committed_cipher(test_engine):
    cipher = OutboxCipher(Fernet.generate_key())

    with Session(test_engine) as session:
        with session.begin():
            initialize_outbox_key_check(session, cipher)

    try:
        yield cipher
    finally:
        with Session(test_engine) as session:
            with session.begin():
                check = session.get(OutboxKeyCheck, 1)
                if check is not None:
                    session.delete(check)