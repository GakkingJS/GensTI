from datetime import datetime, timedelta, timezone
from hashlib import sha256
from hmac import compare_digest
from secrets import randbelow

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from models import EmailOutbox, EmailVerificationToken, User


CODE_LIFETIME = timedelta(minutes=10)
MAX_ATTEMPTS = 5


def _code_hash(user_id, code: str) -> str:
    # Se mezcla el user_id: dos usuarios con el mismo código no chocan
    # con la restricción unique de token_hash.
    return sha256(f"{user_id}:{code}".encode("utf-8")).hexdigest()


def create_verification_token(db: Session, user: User) -> str:
    """Crea un código de 6 dígitos; invalida los anteriores. No hace commit."""
    if user.email_verified_at is not None or user.is_active:
        raise ValueError("La cuenta ya no está pendiente de verificación")

    now = datetime.now(timezone.utc)

    db.execute(
        update(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used_at.is_(None),
        )
        .values(used_at=now)
    )

    code = f"{randbelow(1_000_000):06d}"

    db.add(
        EmailVerificationToken(
            user_id=user.id,
            token_hash=_code_hash(user.id, code),
            expires_at=now + CODE_LIFETIME,
        )
    )
    db.flush()
    return code


def verify_email_code(db: Session, email: str, code: str) -> bool:
    """Verifica el correo con el código. No hace commit.

    Devuelve False en cualquier fallo; el llamador debe lanzar el error
    FUERA del bloque de transacción para que el contador de intentos persista.
    """
    if not code or len(code) != 6 or not code.isdigit():
        return False

    user = db.scalar(
        select(User).where(User.email == email).with_for_update()
    )
    if user is None or user.email_verified_at is not None or user.is_active:
        return False

    now = datetime.now(timezone.utc)

    record = db.scalar(
        select(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
        .order_by(EmailVerificationToken.created_at.desc())
        .limit(1)
        .with_for_update()
    )
    if record is None or record.attempts >= MAX_ATTEMPTS:
        return False

    if not compare_digest(record.token_hash, _code_hash(user.id, code)):
        record.attempts += 1
        db.flush()
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
    cipher,
) -> None:
    token_record = db.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.token_hash == _code_hash(user.id, raw_token),
        )
    )

    if token_record is None:
        raise ValueError("No se encontró el código de verificación")

    ciphertext = cipher.encrypt_token(raw_token)

    db.add(
        EmailOutbox(
            verification_token_id=token_record.id,
            recipient=user.email,
            message_type="email_verification",
            token_ciphertext=ciphertext,
            status="pending",
            attempts=0,
        )
    )