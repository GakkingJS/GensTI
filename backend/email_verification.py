from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import EmailVerificationToken, User, EmailOutbox


TOKEN_LIFETIME = timedelta(hours=1)


def _token_hash(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def create_verification_token(db: Session, user: User) -> str:
    """Crea un token para entregar por correo; no hace commit."""
    if user.email_verified_at is not None or user.is_active:
        raise ValueError("La cuenta ya no está pendiente de verificación")

    raw_token = token_urlsafe(32)
    db.add(
        EmailVerificationToken(
            user_id=user.id,
            token_hash=_token_hash(raw_token),
            expires_at=datetime.now(timezone.utc) + TOKEN_LIFETIME,
        )
    )
    db.flush()
    return raw_token


def verify_email_token(db: Session, raw_token: str) -> bool:
    """Verifica el correo y consume el token; no hace commit."""
    if not raw_token or len(raw_token) > 256:
        return False

    now = datetime.now(timezone.utc)
    record = db.scalar(
        select(EmailVerificationToken)
        .where(EmailVerificationToken.token_hash == _token_hash(raw_token))
        .with_for_update()
    )
    if record is None or record.used_at is not None or record.expires_at <= now:
        return False

    user = db.scalar(select(User).where(User.id == record.user_id).with_for_update())
    if user is None or user.email_verified_at is not None or user.is_active:
        return False

    record.used_at = now
    user.email_verified_at = now
    user.is_active = True
    db.flush()
    return True


def queue_verification_email(
    db: Session,
    user: User,
    raw_token: str,
) -> None:
    token_record = db.scalar(
        select(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.token_hash == _token_hash(raw_token),
        )
    )

    if token_record is None:
        raise ValueError("No se encontró el token de verificación")

    db.add(
        EmailOutbox(
            verification_token_id=token_record.id,
            recipient=user.email,
            message_type="email_verification",
            token_ciphertext=raw_token,
            status="pending",
            attempts=0,
        )
    )