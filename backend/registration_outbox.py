from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import EmailOutbox, EmailVerificationToken, User
from outbox_cipher import OutboxCipher
from registration import register_user
from outbox_key_check import require_outbox_key



def register_with_outbox(
    db: Session,
    email: str,
    password: str,
    cipher: OutboxCipher,
) -> UUID:
    """Prepara cuenta y correo pendiente; el llamador hace commit/rollback."""
    require_outbox_key(db, cipher)
    registration = register_user(db, email, password)

    user = db.get(User, registration.user_id)
    if user is None:
        raise RuntimeError("No se pudo recuperar el usuario registrado")

    verification = db.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.user_id == user.id
        )
    )
    if verification is None:
        raise RuntimeError("No se pudo recuperar el token de verificación")

    db.add(
        EmailOutbox(
            verification_token_id=verification.id,
            recipient=user.email,
            token_ciphertext=cipher.encrypt_token(
                registration.verification_token
            ),
        )
    )
    db.flush()
    return user.id