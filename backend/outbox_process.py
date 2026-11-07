from datetime import datetime, timedelta, timezone
from uuid import UUID

from cryptography.fernet import InvalidToken
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import EmailOutbox, EmailVerificationToken, User
from outbox_cipher import OutboxCipher
from verification_mail import VerificationEmail, VerificationEmailSender


MAX_ATTEMPTS = 3
RETRY_DELAY = timedelta(minutes=5)


def process_claimed_email(
    db: Session,
    message_id: UUID,
    cipher: OutboxCipher,
    sender: VerificationEmailSender,
) -> str:
    """Procesa un reclamo confirmado; el llamador controla commit/rollback."""
    now = datetime.now(timezone.utc)
    message = db.scalar(
        select(EmailOutbox)
        .where(EmailOutbox.id == message_id)
        .with_for_update()
    )
    if message is None or message.status != "processing":
        return "not_processing"

    verification = db.get(
        EmailVerificationToken,
        message.verification_token_id,
    )
    user = db.get(User, verification.user_id) if verification else None

    if (
        verification is None
        or verification.used_at is not None
        or verification.expires_at <= now
        or user is None
        or user.is_active
        or user.email_verified_at is not None
        or user.email != message.recipient
    ):
        message.status = "failed"
        message.last_error = "verification_unavailable"
        message.token_ciphertext = None
        message.locked_at = None
        db.flush()
        return "failed"

    try:
        token = cipher.decrypt_token(message.token_ciphertext)
    except (InvalidToken, ValueError, UnicodeError, TypeError):
        message.status = "failed"
        message.last_error = "invalid_ciphertext"
        message.token_ciphertext = None
        message.locked_at = None
        db.flush()
        return "failed"

    try:
         sender.send_verification(
            VerificationEmail(
                recipient=message.recipient,
                token=token,
                message_id=message.id,
            )
        )
    except Exception:
        # No guardar ni registrar el texto de la excepción: podría contener
        # la URL, el token o credenciales del proveedor.
        message.locked_at = None
        if message.attempts >= MAX_ATTEMPTS:
            message.status = "failed"
            message.last_error = "delivery_failed"
            message.token_ciphertext = None
            result = "failed"
        else:
            message.status = "pending"
            message.available_at = now + RETRY_DELAY
            message.last_error = "delivery_retry"
            result = "retry"

        db.flush()
        return result

    message.status = "sent"
    message.sent_at = now
    message.locked_at = None
    message.last_error = None
    message.token_ciphertext = None
    db.flush()
    return "sent"