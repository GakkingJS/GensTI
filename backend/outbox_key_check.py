from cryptography.fernet import InvalidToken
from sqlalchemy.orm import Session

from models import OutboxKeyCheck
from outbox_cipher import OutboxCipher


CHECK_TEXT = "GENSTI_OUTBOX_KEY_CHECK_V1"


class OutboxKeyNotInitialized(RuntimeError):
    pass


class OutboxKeyMismatch(RuntimeError):
    pass


def initialize_outbox_key_check(
    db: Session,
    cipher: OutboxCipher,
) -> None:
    """Solo para inicialización controlada; el llamador confirma."""
    if db.get(OutboxKeyCheck, 1) is not None:
        raise RuntimeError("La identidad de clave ya está inicializada")

    db.add(
        OutboxKeyCheck(
            id=1,
            check_ciphertext=cipher.encrypt_token(CHECK_TEXT),
        )
    )
    db.flush()


def require_outbox_key(
    db: Session,
    cipher: OutboxCipher,
) -> None:
    """Falla si falta el verificador o la clave no puede abrirlo."""
    check = db.get(OutboxKeyCheck, 1)
    if check is None:
        raise OutboxKeyNotInitialized(
            "La clave de la outbox no está inicializada"
        )

    try:
        plaintext = cipher.decrypt_token(check.check_ciphertext)
    except (InvalidToken, ValueError, UnicodeError, TypeError) as exc:
        raise OutboxKeyMismatch(
            "La clave de la outbox no corresponde al verificador"
        ) from exc

    if plaintext != CHECK_TEXT:
        raise OutboxKeyMismatch(
            "El verificador de la clave de la outbox es inválido"
        )