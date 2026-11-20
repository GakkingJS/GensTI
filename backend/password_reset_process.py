from datetime import datetime, timedelta, timezone
from uuid import UUID

from cryptography.fernet import InvalidToken
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import (
    PasswordResetOutbox,
    PasswordResetToken,
    User,
)
from outbox_cipher import OutboxCipher
from password_reset_mail import (
    PasswordResetEmail,
    PasswordResetEmailSender,
)


MAX_ATTEMPTS = 3
RETRY_DELAY = timedelta(minutes=5)


def process_claimed_password_reset_email(
    db: Session,
    message_id: UUID,
    cipher: OutboxCipher,
    sender: PasswordResetEmailSender,
    frontend_base_url: str,
) -> str:
    now = datetime.now(timezone.utc)

    message = db.scalar(
        select(PasswordResetOutbox)
        .where(PasswordResetOutbox.id == message_id)
        .with_for_update()
    )

    if message is None or message.status != "processing":
        return "not_processing"

    token_record = db.get(
        PasswordResetToken,
        message.password_reset_token_id,
    )
    user = db.get(User, token_record.user_id) if token_record else None

    if (
        token_record is None
        or token_record.used_at is not None
        or token_record.expires_at <= now
        or user is None
        or user.email != message.recipient
    ):
        message.status = "failed"
        message.last_error = "reset_token_unavailable"
        message.locked_at = None
        db.flush()
        return "failed"

    try:
        raw_token = cipher.decrypt_token(
            message.token_ciphertext
        )
    except (
        InvalidToken,
        ValueError,
        UnicodeError,
        TypeError,
    ):
        message.status = "failed"
        message.last_error = "invalid_ciphertext"
        message.locked_at = None
        db.flush()
        return "failed"

    try:
        sender.send_password_reset(
            PasswordResetEmail(
                recipient=message.recipient,
                token=raw_token,
                message_id=message.id,
            )
        )
    except Exception:
        message.locked_at = None

        if message.attempts >= MAX_ATTEMPTS:
            message.status = "failed"
            message.last_error = "delivery_failed"
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
    message.token_ciphertext = ""
    db.flush()
    return "sent"