import os
from pathlib import Path

from outbox_cipher import OutboxCipher


def load_outbox_cipher() -> OutboxCipher:
    key_file = os.environ.get("OUTBOX_FERNET_KEY_FILE")
    if not key_file:
        raise RuntimeError("Falta OUTBOX_FERNET_KEY_FILE")

    key = Path(key_file).read_bytes().strip()
    return OutboxCipher(key)