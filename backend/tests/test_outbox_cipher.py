import pytest
from cryptography.fernet import Fernet, InvalidToken

from outbox_cipher import OutboxCipher


def test_token_round_trip_without_storing_plaintext():
    cipher = OutboxCipher(Fernet.generate_key())
    original = "token-de-verificacion-de-prueba"

    ciphertext = cipher.encrypt_token(original)

    assert ciphertext != original
    assert original not in ciphertext
    assert cipher.decrypt_token(ciphertext) == original


def test_wrong_key_cannot_decrypt():
    first = OutboxCipher(Fernet.generate_key())
    second = OutboxCipher(Fernet.generate_key())

    with pytest.raises(InvalidToken):
        second.decrypt_token(first.encrypt_token("token-de-prueba"))


def test_tampered_ciphertext_is_rejected():
    cipher = OutboxCipher(Fernet.generate_key())
    ciphertext = cipher.encrypt_token("token-de-prueba")
    replacement = "A" if ciphertext[-2] != "A" else "B"
    tampered = ciphertext[:-2] + replacement + ciphertext[-1]

    with pytest.raises(InvalidToken):
        cipher.decrypt_token(tampered)


def test_empty_token_is_rejected():
    cipher = OutboxCipher(Fernet.generate_key())

    with pytest.raises(ValueError):
        cipher.encrypt_token("")