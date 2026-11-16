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
from models import CommunityHighlight, User


router = APIRouter(
    prefix="/community-highlights",
    tags=["Fotos de la comunidad"],
)

UPLOAD_DIR = Path(
    os.getenv(
        "COMMUNITY_UPLOAD_DIR",
        "/app/uploads/community",
    )
)

MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000


class HighlightPayload(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=20000)
    category: str = Field(min_length=2, max_length=80)
    sort_order: int = Field(default=0, ge=0, le=1_000_000)

    image_alt: str = Field(default="", max_length=300)
    image_position: Literal[
        "center",
        "top",
        "bottom",
    ] = "center"

    status: Literal[
        "draft",
        "published",
        "archived",
    ] = "draft"

    publication_authorized: bool = False


def require_write_header(
    x_requested_with: str | None = Header(default=None),
):
    if x_requested_with != "XMLHttpRequest":
        raise HTTPException(
            status_code=403,
            detail="Falta el encabezado de seguridad de la solicitud.",
        )


def get_highlight(
    highlight_id: UUID,
    db: Session,
) -> CommunityHighlight:
    entry = db.get(CommunityHighlight, highlight_id)

    if entry is None:
        raise HTTPException(
            status_code=404,
            detail="Fotografía de la comunidad no encontrada.",
        )

    return entry


def serialize_highlight(
    entry: CommunityHighlight,
    admin: bool = False,
):
    prefix = (
        "/community-highlights/admin/entries"
        if admin
        else "/community-highlights/entries"
    )

    image_url = (
        f"{prefix}/{entry.id}/image?v={entry.image_key}"
        if entry.image_key
        else None
    )

    result = {
        "id": str(entry.id),
        "title": entry.title,
        "description": entry.description,
        "category": entry.category,
        "sort_order": entry.sort_order,

        # Mantiene el nombre utilizado por el componente público.
        "image": image_url,

        "image_alt": entry.image_alt,
        "image_position": entry.image_position,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }

    if admin:
        result.update(
            status=entry.status,
            publication_authorized=entry.publication_authorized,
        )

    return result


def commit_entry(
    db: Session,
    entry: CommunityHighlight,
):
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise

    db.refresh(entry)


def apply_payload(
    entry: CommunityHighlight,
    payload: HighlightPayload,
    current_user: User,
):
    if payload.status == "published":
        if not entry.image_key:
            raise HTTPException(
                status_code=400,
                detail="Sube una fotografía antes de publicar.",
            )

        if not payload.image_alt:
            raise HTTPException(
                status_code=400,
                detail="Escribe el texto alternativo de la fotografía.",
            )

        if not payload.publication_authorized:
            raise HTTPException(
                status_code=400,
                detail="Confirma la verificación y autorización.",
            )

    for field, value in payload.model_dump().items():
        setattr(entry, field, value)

    entry.updated_by_id = current_user.id

    entry.verified_by_id = (
        current_user.id
        if payload.publication_authorized
        else None
    )

    entry.verified_at = (
        datetime.now(timezone.utc)
        if payload.publication_authorized
        else None
    )


def serve_image(entry: CommunityHighlight):
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

@router.get("")
def public_highlights(
    db: Session = Depends(get_db),
):
    entries = db.scalars(
        select(CommunityHighlight)
        .where(CommunityHighlight.status == "published")
        .order_by(
            CommunityHighlight.sort_order.asc(),
            CommunityHighlight.created_at.desc(),
            CommunityHighlight.id.asc(),
        )
    ).all()

    return [
        serialize_highlight(entry)
        for entry in entries
    ]


@router.get("/entries/{highlight_id}/image")
def public_image(
    highlight_id: UUID,
    db: Session = Depends(get_db),
):
    entry = get_highlight(highlight_id, db)

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
def admin_highlights(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("community_highlights.manage")
    ),
):
    entries = db.scalars(
        select(CommunityHighlight)
        .order_by(
            CommunityHighlight.sort_order.asc(),
            CommunityHighlight.created_at.desc(),
            CommunityHighlight.id.asc(),
        )
    ).all()

    return [
        serialize_highlight(entry, admin=True)
        for entry in entries
    ]


@router.post(
    "/admin/entries",
    status_code=201,
    dependencies=[Depends(require_write_header)],
)
def create_highlight(
    payload: HighlightPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("community_highlights.manage")
    ),
):
    entry = CommunityHighlight(
        created_by_id=current_user.id
    )

    apply_payload(entry, payload, current_user)

    db.add(entry)
    commit_entry(db, entry)

    return serialize_highlight(entry, admin=True)


@router.put(
    "/admin/entries/{highlight_id}",
    dependencies=[Depends(require_write_header)],
)
def update_highlight(
    highlight_id: UUID,
    payload: HighlightPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("community_highlights.manage")
    ),
):
    entry = get_highlight(highlight_id, db)

    apply_payload(entry, payload, current_user)
    commit_entry(db, entry)

    return serialize_highlight(entry, admin=True)


@router.get("/admin/entries/{highlight_id}/image")
def admin_image(
    highlight_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("community_highlights.manage")
    ),
):
    return serve_image(
        get_highlight(highlight_id, db)
    )


@router.post(
    "/admin/entries/{highlight_id}/image",
    dependencies=[Depends(require_write_header)],
)
def upload_image(
    highlight_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("community_highlights.manage")
    ),
):
    entry = get_highlight(highlight_id, db)

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
                raise ValueError("Formato no permitido.")

            if source.width * source.height > MAX_IMAGE_PIXELS:
                raise ValueError("Demasiados megapíxeles.")

            source.seek(0)
            source.load()

            corrected = ImageOps.exif_transpose(source)
            corrected.thumbnail((2400, 2400))

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
            clean.save(
                output,
                format="WEBP",
                quality=85,
            )

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
    ) as exc:
        raise HTTPException(
            status_code=400,
            detail=(
                "Imagen inválida. Usa JPEG, PNG o WebP "
                "con un máximo de 20 megapíxeles."
            ),
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

    return serialize_highlight(entry, admin=True)