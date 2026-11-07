from sqlalchemy.engine import Engine

from outbox_cipher_loader import load_outbox_cipher
from outbox_run import OutboxRunResult, run_outbox_once
from verification_mail import VerificationEmailSender


def run_outbox_with_configured_key(
    engine: Engine,
    sender: VerificationEmailSender,
    *,
    limit: int = 10,
) -> OutboxRunResult:
    cipher = load_outbox_cipher()
    return run_outbox_once(engine, cipher, sender, limit=limit)