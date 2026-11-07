from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import EmailOutbox
from outbox_process import MAX_ATTEMPTS


CLAIM_TIMEOUT = timedelta(minutes=10)


def recover_abandoned_emails(
    db: Session,
    *,
    limit: int = 100,
) -> int:
    """Recupera reclamos vencidos; el llamador hace commit/rollback."""
    if limit < 1 or limit > 100:
        raise ValueError("limit debe estar entre 1 y 100")

    now = datetime.now(timezone.utc)
    cutoff = now - CLAIM_TIMEOUT

    messages = db.scalars(
        select(EmailOutbox)
        .where(
            EmailOutbox.status == "processing",
            EmailOutbox.locked_at.is_not(None),
            EmailOutbox.locked_at <= cutoff,
        )
        .order_by(EmailOutbox.locked_at, EmailOutbox.created_at)
        .limit(limit)
        .with_for_update(skip_locked=True)
    ).all()

    for message in messages:
        message.locked_at = None

        if message.attempts >= MAX_ATTEMPTS:
            message.status = "failed"
            message.last_error = "claim_expired_max_attempts"
            message.token_ciphertext = None
        else:
            message.status = "pending"
            message.available_at = now
            message.last_error = "claim_expired"

    db.flush()
    return len(messages)