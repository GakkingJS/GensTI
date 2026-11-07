from dataclasses import dataclass

from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from outbox_claim import claim_next_email
from outbox_cipher import OutboxCipher
from outbox_process import process_claimed_email
from outbox_recovery import recover_abandoned_emails
from verification_mail import VerificationEmailSender

from outbox_key_check import require_outbox_key


@dataclass(frozen=True)
class OutboxRunResult:
    recovered: int
    claimed: int
    sent: int
    retry: int
    failed: int


def run_outbox_once(
    engine: Engine,
    cipher: OutboxCipher,
    sender: VerificationEmailSender,
    *,
    limit: int = 10,
) -> OutboxRunResult:
    """Hace una pasada; cada reclamo se confirma antes de intentar enviarlo."""
    if not 1 <= limit <= 100:
            raise ValueError("limit debe estar entre 1 y 100")

        
    with Session(engine) as session:
        with session.begin():
            require_outbox_key(session, cipher)
                
            recovered = recover_abandoned_emails(session)

    claimed = sent = retry = failed = 0

    for _ in range(limit):
        with Session(engine) as session:
            with session.begin():
                message_id = claim_next_email(session)

        if message_id is None:
            break

        claimed += 1

        with Session(engine) as session:
            with session.begin():
                outcome = process_claimed_email(
                    session, message_id, cipher, sender
                )

        if outcome == "sent":
            sent += 1
        elif outcome == "retry":
            retry += 1
        elif outcome == "failed":
            failed += 1
        else:
            raise RuntimeError(
                "El mensaje reclamado no estaba en processing"
            )

    return OutboxRunResult(
        recovered=recovered,
        claimed=claimed,
        sent=sent,
        retry=retry,
        failed=failed,
    )