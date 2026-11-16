import os
import re
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Header,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from authorization import require_permission
from database import get_db
from models import TbogEntry, User


router = APIRouter(prefix="/tbog", tags=["TBOG"])

UPLOAD_DIR = Path(
    os.getenv("TBOG_UPLOAD_DIR", "/app/uploads/tbog")
)

MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000


class TbogPayload(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    content_type: Literal["recognition", "gallery"] = "recognition"
    student_name: str | None = Field(default=None, max_length=200)
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=20000)
    category: Literal[
        "semilleros",
        "saber-pro",
        "proyectos",
        "excelencia",
    ] = "excelencia"
    period: str = Field(default="", max_length=120)
    image_alt: str = Field(default="", max_length=300)
    image_position: Literal["center", "top", "bottom"] = "center"
    featured: bool = False
    status: Literal["draft", "published", "archived"] = "draft"
    publication_authorized: bool = False


def require_write_header(
    x_requested_with: str | None = Header(default=None),
):
    # El frontend deberá enviar este encabezado al modificar contenido.
    if x_requested_with != "XMLHttpRequest":
        raise HTTPException(
            status_code=403,
            detail="Falta el encabezado de seguridad de la solicitud.",
        )


def get_entry(entry_id: UUID, db: Session) -> TbogEntry:
    entry = db.get(TbogEntry, entry_id)

    if entry is None:
        raise HTTPException(
            status_code=404,
            detail="Contenido de TBOG no encontrado.",
        )

    return entry


def serialize_entry(entry: TbogEntry, admin: bool = False):
    image_url = None

    if entry.image_key:
        prefix = "/tbog/admin" if admin else "/tbog"
        image_url = (
            f"{prefix}/entries/{entry.id}/image"
            f"?v={entry.image_key}"
        )

    result = {
        "id": str(entry.id),
        "content_type": entry.content_type,
        "student_name": entry.student_name,
        "title": entry.title,
        "description": entry.description,
        "category": entry.category,
        "period": entry.period,
        "image_url": image_url,
        "image_alt": entry.image_alt,
        "image_position": entry.image_position,
        "featured": entry.featured,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }

    if admin:
        result.update(
            status=entry.status,
            publication_authorized=entry.publication_authorized,
        )

    return result


def commit_entry(db: Session, entry: TbogEntry):
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise

    db.refresh(entry)


def apply_payload(
    entry: TbogEntry,
    payload: TbogPayload,
    current_user: User,
):
    if payload.status == "published":
        if not entry.image_key:
            raise HTTPException(
                status_code=400,
                detail="Sube una fotografía antes de publicar.",
            )

        if not payload.publication_authorized:
            raise HTTPException(
                status_code=400,
                detail="Confirma la verificación y autorización.",
            )

        if not payload.image_alt:
            raise HTTPException(
                status_code=400,
                detail="Escribe el texto alternativo de la fotografía.",
            )

    for field, value in payload.model_dump().items():
        setattr(entry, field, value)

    # Cada guardado registra quién confirmó el contenido actual.
    entry.verified_by_id = (
        current_user.id if payload.publication_authorized else None
    )
    entry.verified_at = (
        datetime.now(timezone.utc)
        if payload.publication_authorized
        else None
    )
    entry.updated_by_id = current_user.id


def serve_image(entry: TbogEntry):
    key = entry.image_key

    if not key or not re.fullmatch(r"[0-9a-f]{32}\.webp", key):
        raise HTTPException(
            status_code=404,
            detail="Fotografía no encontrada.",
        )

    path = UPLOAD_DIR / key

    if not path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Fotografía no encontrada.",
        )

    return FileResponse(
        path,
        media_type="image/webp",
        headers={
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


# ==========================================
# CONSULTAS PÚBLICAS
# ==========================================

@router.get("/entries")
def public_entries(
    db: Session = Depends(get_db),
):
    entries = db.scalars(
        select(TbogEntry)
        .where(TbogEntry.status == "published")
        .order_by(TbogEntry.created_at.desc())
    ).all()

    return [serialize_entry(entry) for entry in entries]


@router.get("/entries/{entry_id}/image")
def public_image(
    entry_id: UUID,
    db: Session = Depends(get_db),
):
    entry = get_entry(entry_id, db)

    if entry.status != "published":
        raise HTTPException(
            status_code=404,
            detail="Fotografía no encontrada.",
        )

    return serve_image(entry)


# ==========================================
# ADMINISTRACIÓN
# ==========================================

@router.get("/admin/entries")
def admin_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("tbog.manage")),
):
    entries = db.scalars(
        select(TbogEntry)
        .order_by(TbogEntry.created_at.desc())
    ).all()

    return [
        serialize_entry(entry, admin=True)
        for entry in entries
    ]


@router.post(
    "/admin/entries",
    status_code=201,
    dependencies=[Depends(require_write_header)],
)
def create_entry(
    payload: TbogPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("tbog.manage")),
):
    entry = TbogEntry(created_by_id=current_user.id)

    apply_payload(entry, payload, current_user)

    db.add(entry)
    commit_entry(db, entry)

    return serialize_entry(entry, admin=True)


@router.put(
    "/admin/entries/{entry_id}",
    dependencies=[Depends(require_write_header)],
)
def update_entry(
    entry_id: UUID,
    payload: TbogPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("tbog.manage")),
):
    entry = get_entry(entry_id, db)

    apply_payload(entry, payload, current_user)
    commit_entry(db, entry)

    return serialize_entry(entry, admin=True)


@router.get("/admin/entries/{entry_id}/image")
def admin_image(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("tbog.manage")),
):
    return serve_image(get_entry(entry_id, db))


@router.post(
    "/admin/entries/{entry_id}/image",
    dependencies=[Depends(require_write_header)],
)
def upload_image(
    entry_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("tbog.manage")),
):
    entry = get_entry(entry_id, db)

    try:
        raw = file.file.read(MAX_FILE_BYTES + 1)
    finally:
        file.file.close()

    if not raw:
        raise HTTPException(
            status_code=400,
            detail="El archivo está vacío.",
        )

    if len(raw) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="La fotografía no puede superar 5 MB.",
        )

    try:
        with Image.open(BytesIO(raw)) as source:
            if source.format not in {"JPEG", "PNG", "WEBP"}:
                raise ValueError(
                    "Solo se permiten imágenes JPEG, PNG y WebP."
                )

            if source.width * source.height > MAX_IMAGE_PIXELS:
                raise ValueError(
                    "La fotografía supera el límite de 20 megapíxeles."
                )

            source.seek(0)
            source.load()

            corrected = ImageOps.exif_transpose(source)
            corrected.thumbnail((2400, 2400))

            # Crea una imagen nueva sin conservar los metadatos originales.
            mode = (
                "RGBA"
                if corrected.mode in {"RGBA", "LA"}
                or "transparency" in corrected.info
                else "RGB"
            )
            converted = corrected.convert(mode)
            clean = Image.new(mode, converted.size)
            clean.paste(converted)

            output = BytesIO()
            clean.save(output, format="WEBP", quality=85)

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
    ) as exc:
        raise HTTPException(
            status_code=400,
            detail="Imagen inválida, dañada o con dimensiones no permitidas.",
        ) from exc

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    key = f"{uuid4().hex}.webp"
    path = UPLOAD_DIR / key

    try:
        path.write_bytes(output.getvalue())

        entry.image_key = key
        entry.status = "draft"
        entry.publication_authorized = False
        entry.verified_by_id = None
        entry.verified_at = None
        entry.updated_by_id = current_user.id

        commit_entry(db, entry)

    except Exception:
        db.rollback()
        path.unlink(missing_ok=True)
        raise

    return serialize_entry(entry, admin=True)