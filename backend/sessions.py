from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe
from typing import Annotated
from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserSession


DEFAULT_SESSION_EXPIRY = timedelta(hours=8)


def generate_session_id() -> str:
    """Genera un identificador de sesión aleatorio y seguro."""
    return token_urlsafe(32)


def hash_session_id(session_id: str) -> str:
    """Calcula SHA-256 del session_id para almacenarlo."""
    return sha256(session_id.encode("utf-8")).hexdigest()


def create_session(
    db: Session,
    user_id: UUID,
    expires_delta: timedelta = DEFAULT_SESSION_EXPIRY,
) -> str:
    """
    Crea una nueva sesión.

    Devuelve el session_id en claro para enviarlo en la cookie.
    Solo el hash se guarda en la base de datos.
    """
    now = datetime.now(timezone.utc)

    session_id = generate_session_id()
    session_id_hash = hash_session_id(session_id)

    db_session = UserSession(
        user_id=user_id,
        session_id_hash=session_id_hash,
        created_at=now,
        expires_at=now + expires_delta,
        revoked_at=None,
    )

    db.add(db_session)

    return session_id


def get_current_user(
    db: Session = Depends(get_db),
    session_id: Annotated[
        str | None,
        Cookie(alias="session_id")
    ] = None,
) -> User:
    """
    Obtiene el usuario activo asociado a la sesión.

    La sesión debe:
    - existir
    - no estar revocada
    - no estar expirada

    El usuario debe:
    - existir
    - estar activo
    - tener el correo verificado
    """

    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No hay sesión activa",
        )

    session_id_hash = hash_session_id(session_id)
    now = datetime.now(timezone.utc)

    db_session = db.scalar(
        select(UserSession).where(
            UserSession.session_id_hash == session_id_hash
        )
    )

    if db_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión no encontrada",
        )

    if db_session.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión revocada",
        )

    if db_session.expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión expirada",
        )

    user = db.get(User, db_session.user_id)

    if (
        user is None
        or not user.is_active
        or user.email_verified_at is None
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo o no verificado",
        )

    return user


def revoke_session(db: Session, session_id: str) -> None:
    """Marca una sesión como revocada."""

    session_id_hash = hash_session_id(session_id)

    db_session = db.scalar(
        select(UserSession).where(
            UserSession.session_id_hash == session_id_hash
        )
    )

    if db_session is not None:
        db_session.revoked_at = datetime.now(timezone.utc)


def CurrentUser() -> User:
    """Dependencia de FastAPI para obtener el usuario actual."""
    return Depends(get_current_user)