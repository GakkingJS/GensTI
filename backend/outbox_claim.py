from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import EmailOutbox


def claim_next_email(db: Session) -> UUID | None:
    """Reclama un mensaje disponible; el llamador hace commit/rollback."""
    now = datetime.now(timezone.utc)

    message = db.scalar(
        select(EmailOutbox)
        .where(
            EmailOutbox.status == "pending",
            EmailOutbox.available_at <= now,
        )
        .order_by(EmailOutbox.available_at, EmailOutbox.created_at)
        .limit(1)
        .with_for_update(skip_locked=True)
    )
    if message is None:
        return None

    message.status = "processing"
    message.attempts += 1
    message.locked_at = now
    db.flush()

    return message.id