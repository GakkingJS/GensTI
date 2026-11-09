import re
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from email_verification import create_verification_token
from models import User
from passwords import hash_password


INSTITUTIONAL_EMAIL = re.compile(
    r"^[^@\s]+@campusucc\.edu\.co$",
    re.ASCII,
)


class InvalidRegistrationEmail(ValueError):
    pass


class EmailAlreadyRegistered(ValueError):
    pass


@dataclass(frozen=True)
class PendingRegistration:
    user_id: object
    verification_token: str


def register_user(
    db: Session,
    email: str,
    password: str,
) -> PendingRegistration:
    """Crea una cuenta pendiente; el llamador controla commit/rollback."""
    if not isinstance(email, str):
        raise InvalidRegistrationEmail("Correo institucional inválido")

    normalized_email = email.strip().lower()

    if (
        len(normalized_email) > 254
        or not INSTITUTIONAL_EMAIL.fullmatch(normalized_email)
    ):
        raise InvalidRegistrationEmail("Correo institucional inválido")

    if db.scalar(select(User.id).where(User.email == normalized_email)):
        raise EmailAlreadyRegistered("El correo ya está registrado")

    password_digest = hash_password(password)

    user = User(
        email=normalized_email,
        password_hash=password_digest,
        email_verified_at=None,
        is_active=False,
    )

    db.add(user)
    db.flush()

    token = create_verification_token(db, user)

    return PendingRegistration(
        user_id=user.id,
        verification_token=token,
    )