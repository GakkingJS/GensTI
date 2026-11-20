from datetime import datetime, timedelta, timezone
from hashlib import sha256
from hmac import compare_digest
from secrets import token_urlsafe

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from models import PasswordResetOutbox, PasswordResetToken, User
from passwords import hash_password


RESET_TOKEN_LIFETIME = timedelta(minutes=30)


class InvalidPasswordResetToken(Exception):
    pass


def _token_hash(raw_token: str) -> str:
    return sha256(raw_token.encode("utf-8")).hexdigest()


def create_password_reset_token(
    db: Session,
    user: User,
) -> str:
    """Invalida tokens anteriores y crea uno nuevo. No hace commit."""
    now = datetime.now(timezone.utc)

    db.execute(
        update(PasswordResetToken)
        .where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
        .values(used_at=now)
    )

    raw_token = token_urlsafe(32)

    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=_token_hash(raw_token),
            expires_at=now + RESET_TOKEN_LIFETIME,
        )
    )
    db.flush()

    return raw_token


def queue_password_reset_email(
    db: Session,
    user: User,
    raw_token: str,
    cipher,
) -> None:
    token_record = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.token_hash == _token_hash(raw_token),
        )
    )

    if token_record is None:
        raise ValueError("No se encontró el token de recuperación")

    db.add(
        PasswordResetOutbox(
            password_reset_token_id=token_record.id,
            recipient=user.email,
            token_ciphertext=cipher.encrypt_token(raw_token),
            status="pending",
            attempts=0,
        )
    )
    db.flush()


def reset_password(
    db: Session,
    raw_token: str,
    new_password: str,
) -> None:
    """Valida el token y cambia la contraseña. No hace commit."""
    if not raw_token:
        raise InvalidPasswordResetToken()

    if not 12 <= len(new_password) <= 1024:
        raise ValueError(
            "La contraseña debe tener entre 12 y 1024 caracteres"
        )

    now = datetime.now(timezone.utc)

    token_record = db.scalar(
        select(PasswordResetToken)
        .where(
            PasswordResetToken.token_hash == _token_hash(raw_token),
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
        .with_for_update()
    )

    if token_record is None:
        raise InvalidPasswordResetToken()

    user = db.get(User, token_record.user_id)

    if user is None or not user.email_verified_at:
        raise InvalidPasswordResetToken()

    user.password_hash = hash_password(new_password)
    token_record.used_at = now
    db.flush()