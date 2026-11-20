import logging
import os
import signal
import time
from datetime import datetime, timedelta, timezone

from cryptography.fernet import InvalidToken
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from database import engine
from models import (
    EmailOutbox,
    EmailVerificationToken,
    PasswordResetOutbox,
    PasswordResetToken,
)
from outbox_cipher_loader import load_outbox_cipher
from email_service import (
    EmailDeliveryError,
    send_password_reset_email,
    send_verification_email,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("outbox_worker")

POLL_SECONDS = 5
MAX_ATTEMPTS = 5
STALE_LOCK = timedelta(minutes=5)

running = True


def _stop(*_):
    global running
    running = False


def _frontend_base_url() -> str:
    return os.getenv(
        "FRONTEND_BASE_URL",
        "http://localhost:5173",
    ).rstrip("/")


def claim_next_verification(db: Session):
    now = datetime.now(timezone.utc)

    with db.begin():
        row = db.scalar(
            select(EmailOutbox)
            .where(
                or_(
                    and_(
                        EmailOutbox.status == "pending",
                        EmailOutbox.available_at <= now,
                    ),
                    and_(
                        EmailOutbox.status == "processing",
                        EmailOutbox.locked_at < now - STALE_LOCK,
                    ),
                )
            )
            .order_by(EmailOutbox.available_at)
            .limit(1)
            .with_for_update(skip_locked=True)
        )

        if row is None:
            return None

        row.status = "processing"
        row.locked_at = now

        return (
            row.id,
            row.recipient,
            row.token_ciphertext,
            row.verification_token_id,
        )


def claim_next_password_reset(db: Session):
    now = datetime.now(timezone.utc)

    with db.begin():
        row = db.scalar(
            select(PasswordResetOutbox)
            .where(
                or_(
                    and_(
                        PasswordResetOutbox.status == "pending",
                        PasswordResetOutbox.available_at <= now,
                    ),
                    and_(
                        PasswordResetOutbox.status == "processing",
                        PasswordResetOutbox.locked_at < now - STALE_LOCK,
                    ),
                )
            )
            .order_by(PasswordResetOutbox.available_at)
            .limit(1)
            .with_for_update(skip_locked=True)
        )

        if row is None:
            return None

        row.status = "processing"
        row.locked_at = now

        return (
            row.id,
            row.recipient,
            row.token_ciphertext,
            row.password_reset_token_id,
        )


def finish_verification(outbox_id, error, permanent):
    now = datetime.now(timezone.utc)

    with Session(engine) as db, db.begin():
        row = db.get(
            EmailOutbox,
            outbox_id,
            with_for_update=True,
        )

        if row is None:
            return

        row.locked_at = None

        if error is None:
            row.status = "sent"
            row.sent_at = now
            row.last_error = None
            row.token_ciphertext = None
            return

        row.attempts += 1
        row.last_error = error[:200]

        if permanent or row.attempts >= MAX_ATTEMPTS:
            row.status = "failed"
            row.token_ciphertext = None
        else:
            row.status = "pending"
            row.available_at = now + timedelta(
                seconds=30 * 2 ** (row.attempts - 1)
            )


def finish_password_reset(outbox_id, error, permanent):
    now = datetime.now(timezone.utc)

    with Session(engine) as db, db.begin():
        row = db.get(
            PasswordResetOutbox,
            outbox_id,
            with_for_update=True,
        )

        if row is None:
            return

        row.locked_at = None

        if error is None:
            row.status = "sent"
            row.sent_at = now
            row.last_error = None
            row.token_ciphertext = ""
            return

        row.attempts += 1
        row.last_error = error[:200]

        if permanent or row.attempts >= MAX_ATTEMPTS:
            row.status = "failed"
            row.token_ciphertext = ""
        else:
            row.status = "pending"
            row.available_at = now + timedelta(
                seconds=30 * 2 ** (row.attempts - 1)
            )


def process_verification(cipher) -> bool:
    with Session(engine) as db:
        claimed = claim_next_verification(db)

    if claimed is None:
        return False

    outbox_id, recipient, ciphertext, token_id = claimed
    error = None
    permanent = False

    try:
        with Session(engine) as db:
            token = db.get(
                EmailVerificationToken,
                token_id,
            )
            now = datetime.now(timezone.utc)

            if (
                token is None
                or token.used_at is not None
                or token.expires_at <= now
            ):
                error = "Código vencido o ya utilizado"
                permanent = True

        if error is None:
            code = cipher.decrypt_token(ciphertext)
            send_verification_email(recipient, code)

    except InvalidToken:
        error = "No se pudo descifrar el código"
        permanent = True
    except EmailDeliveryError as exc:
        error = str(exc)
    except Exception:
        logger.exception(
            "Error inesperado en verificación %s",
            outbox_id,
        )
        error = "Error inesperado"

    finish_verification(outbox_id, error, permanent)

    if error is None:
        logger.info(
            "Correo de verificación enviado (%s)",
            outbox_id,
        )
    else:
        logger.warning(
            "Fallo en verificación %s: %s",
            outbox_id,
            error,
        )

    return True


def process_password_reset(cipher) -> bool:
    with Session(engine) as db:
        claimed = claim_next_password_reset(db)

    if claimed is None:
        return False

    outbox_id, recipient, ciphertext, token_id = claimed
    error = None
    permanent = False

    try:
        with Session(engine) as db:
            token = db.get(
                PasswordResetToken,
                token_id,
            )
            now = datetime.now(timezone.utc)

            if (
                token is None
                or token.used_at is not None
                or token.expires_at <= now
            ):
                error = "Enlace vencido o ya utilizado"
                permanent = True

        if error is None:
            raw_token = cipher.decrypt_token(ciphertext)
            send_password_reset_email(
                recipient=recipient,
                token=raw_token,
                frontend_base_url=_frontend_base_url(),
            )

    except InvalidToken:
        error = "No se pudo descifrar el enlace"
        permanent = True
    except EmailDeliveryError as exc:
        error = str(exc)
    except Exception:
        logger.exception(
            "Error inesperado en recuperación %s",
            outbox_id,
        )
        error = "Error inesperado"

    finish_password_reset(outbox_id, error, permanent)

    if error is None:
        logger.info(
            "Correo de recuperación enviado (%s)",
            outbox_id,
        )
    else:
        logger.warning(
            "Fallo en recuperación %s: %s",
            outbox_id,
            error,
        )

    return True


def main() -> None:
    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)

    cipher = load_outbox_cipher()
    logger.info("Worker de correos iniciado")

    while running:
        try:
            handled = process_verification(cipher)

            if not handled:
                handled = process_password_reset(cipher)

        except Exception:
            logger.exception("Error en el ciclo del worker")
            handled = False

        if not handled:
            time.sleep(POLL_SECONDS)

    logger.info("Worker detenido")


if __name__ == "__main__":
    main()