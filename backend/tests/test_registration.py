from hashlib import sha256
from uuid import uuid4

import pytest
from sqlalchemy import select

from models import EmailVerificationToken, User
from passwords import verify_password
from registration import (
    EmailAlreadyRegistered,
    InvalidRegistrationEmail,
    register_user,
)
from test_authorization import db, test_engine  # noqa: F401


def test_registration_creates_inactive_user_and_hashed_token(db):
    email = f"{uuid4().hex}@campusucc.edu.co"
    password = "Una-frase-larga-y-unica-2026"

    result = register_user(db, email.upper(), password)
    user = db.get(User, result.user_id)
    record = db.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.user_id == user.id
        )
    )

    assert user.email == email
    assert user.is_active is False
    assert user.email_verified_at is None
    assert user.password_hash != password
    assert verify_password(password, user.password_hash) is True
    assert record.token_hash == sha256(
        result.verification_token.encode("utf-8")
    ).hexdigest()
    assert result.verification_token != record.token_hash
    assert record.used_at is None


def test_duplicate_email_is_rejected(db):
    email = f"{uuid4().hex}@campusucc.edu.co"
    register_user(db, email, "Una-frase-larga-y-unica-2026")

    with pytest.raises(EmailAlreadyRegistered):
        register_user(db, email.upper(), "Otra-frase-larga-y-unica-2026")

    assert len(db.scalars(select(User).where(User.email == email)).all()) == 1


@pytest.mark.parametrize(
    "email",
    [
        "persona@gmail.com",
        "persona@campusucc.edu.co.ejemplo.com",
        "persona@@campusucc.edu.co",
        "persona @campusucc.edu.co",
        "",
    ],
)
def test_invalid_email_is_rejected(db, email):
    with pytest.raises(InvalidRegistrationEmail):
        register_user(db, email, "Una-frase-larga-y-unica-2026")