import pytest

from passwords import hash_password, verify_password


def test_password_is_hashed_and_can_be_verified():
    password = "Una-frase-larga-y-unica-2026"
    stored = hash_password(password)

    assert stored != password
    assert stored.startswith("$argon2id$")
    assert verify_password(password, stored) is True
    assert verify_password("otra-contraseña", stored) is False


@pytest.mark.parametrize("password", ["", "corta123", "x" * 1025])
def test_invalid_password_length_is_rejected(password):
    with pytest.raises(ValueError):
        hash_password(password)


def test_missing_or_invalid_hash_is_rejected():
    assert verify_password("Una-frase-larga-y-unica-2026", None) is False
    assert verify_password("Una-frase-larga-y-unica-2026", "hash-invalido") is False