import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import Cookie, Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import engine, get_db
from models import EmailVerificationToken, User
from authorization import (
    get_user_permissions,
    get_user_roles,
    require_permission,
)
from outbox_cipher_loader import load_outbox_cipher
from passwords import verify_password
from registration import (
    EmailAlreadyRegistered,
    InvalidRegistrationEmail,
)
from registration_outbox import register_with_outbox
from sessions import (
    DEFAULT_SESSION_EXPIRY,
    create_session,
    get_current_user,
    revoke_session,
)
from email_verification import (
    create_verification_token,
    queue_verification_email,
    verify_email_code,
)

from news_routes import router as news_router
from calendar_routes import router as calendar_router
from pqrs_routes import router as pqrs_router
from event_routes import router as event_router
from community_posts_routes import router as community_posts_router
from faq_routes import router as faq_router

logger = logging.getLogger(__name__)

app = FastAPI(title="GENSTI API")

app.include_router(news_router)
app.include_router(calendar_router)
app.include_router(pqrs_router)
app.include_router(event_router)
app.include_router(community_posts_router)
app.include_router(faq_router)

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Requested-With"],
)


class EmailVerificationRequest(BaseModel):
    email: EmailStr
    code: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@app.post("/auth/register", status_code=201)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    if not 12 <= len(payload.password) <= 1024:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener entre 12 y 1024 caracteres",
        )

    try:
        cipher = load_outbox_cipher()

        with db.begin():
            register_with_outbox(
                db=db,
                email=email,
                password=payload.password,
                cipher=cipher,
            )
    except InvalidRegistrationEmail as exc:
        raise HTTPException(
            status_code=400,
            detail="Debes usar un correo institucional @campusucc.edu.co",
        ) from exc
    except EmailAlreadyRegistered as exc:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una cuenta con ese correo",
        ) from exc
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ya existe una cuenta con ese correo",
        ) from exc

    return {
        "status": "pending_verification",
        "message": "Cuenta creada. Revisa tu correo para verificarla.",
    }


@app.post("/auth/verify-email")
def verify_email(
    payload: EmailVerificationRequest,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    with db.begin():
        verified = verify_email_code(db, email, payload.code.strip())

    if not verified:
        raise HTTPException(
            status_code=400,
            detail="Código inválido o vencido",
        )

    return {"status": "ok"}


@app.post("/auth/resend-verification")
def resend_verification(
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    # Respuesta genérica: no revelamos si el correo existe.
    if user is None or user.email_verified_at is not None:
        return {
            "status": "ok",
            "message": "Si el correo está registrado, enviaremos un código nuevo.",
        }

    last_token = db.scalar(
        select(EmailVerificationToken)
        .where(EmailVerificationToken.user_id == user.id)
        .order_by(EmailVerificationToken.created_at.desc())
        .limit(1)
    )

    if (
        last_token
        and last_token.created_at
        and last_token.created_at
        > datetime.now(timezone.utc) - timedelta(minutes=1)
    ):
        raise HTTPException(
            status_code=429,
            detail="Espera un minuto antes de solicitar otro código.",
        )

    cipher = load_outbox_cipher()

    try:
        code = create_verification_token(db, user)
        queue_verification_email(
            db=db,
            user=user,
            raw_token=code,
            cipher=cipher,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No pudimos reenviar el código. Intenta de nuevo.",
        ) from exc

    return {
        "status": "ok",
        "message": "Enviamos un nuevo código de verificación.",
    }

@app.post("/auth/login")
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    # Mismo error para:
    # - usuario inexistente
    # - contraseña incorrecta
    # - cuenta no activa
    # - correo no verificado
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña inválidos",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña inválidos",
        )

    if not user.is_active or user.email_verified_at is None:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña inválidos",
        )

    # La consulta anterior puede haber abierto una transacción
    # implícita en SQLAlchemy. La cerramos antes de crear la sesión.
    db.rollback()

    with db.begin():
        session_id = create_session(db, user.id)

    response.set_cookie(
        key="session_id",
        value=session_id,
        max_age=int(DEFAULT_SESSION_EXPIRY.total_seconds()),
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite=os.getenv("COOKIE_SAMESITE", "lax"),
        path="/",
    )

    return {"status": "ok"}


@app.get("/auth/me")
def me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roles = get_user_roles(
        db=db,
        user_id=user.id,
    )

    permissions = sorted(
        get_user_permissions(
            db=db,
            user_id=user.id,
        )
    )

    return {
        "id": str(user.id),
        "email": user.email,
        "is_active": user.is_active,
        "email_verified": user.email_verified_at is not None,
        "roles": roles,
        "permissions": permissions,
    }


@app.post("/auth/logout")
def logout(
    response: Response,
    session_id: str | None = Cookie(default=None, alias="session_id"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if session_id:
        revoke_session(db, session_id)
        db.commit()

    response.delete_cookie(
        key="session_id",
        path="/",
    )

    return {"status": "ok"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "gensti-api",
    }


@app.get("/health/db")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except (SQLAlchemyError, OSError):
        logger.exception(
            "Fallo la verificación de conexión a la base de datos"
        )
        raise HTTPException(
            status_code=503,
            detail="Base de datos no disponible",
        )

    return {
        "status": "ok",
        "database": "connected",
    }


@app.get("/test/news")
def test_news(
    user=Depends(require_permission("news.view")),
):
    return {
        "message": "Puedes ver noticias",
        "user": user.email,
    }


@app.delete("/test/news")
def test_delete_news(
    user=Depends(require_permission("news.delete")),
):
    return {
        "message": "Puedes eliminar noticias",
        "user": user.email,
    }