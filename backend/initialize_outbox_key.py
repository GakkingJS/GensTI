from database import Session, engine
from outbox_cipher_loader import load_outbox_cipher
from outbox_key_check import initialize_outbox_key_check


def main() -> int:
    cipher = load_outbox_cipher()

    with Session(engine) as db:
        initialize_outbox_key_check(db, cipher)
        db.commit()

    print("La clave de la outbox fue inicializada correctamente.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
