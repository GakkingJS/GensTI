import os
import re
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from authorization import (
    get_user_permissions,
    require_permission,
)
from community_posts_schemas import (
    CommunityPostAdmin,
    CommunityPostCreate,
    CommunityPostOwn,
    CommunityPostPublic,
    CommunityPostReview,
)
from database import get_db
from models import CommunityPost, User
from sessions import get_current_user


router = APIRouter(
    prefix="/community-posts",
    tags=["Community Posts"],
)

UPLOAD_DIR = Path(
    os.getenv(
        "COMMUNITY_POSTS_UPLOAD_DIR",
        "/app/uploads/community-posts",
    )
)

MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000

MODERATION_PERMISSION = "community_posts.moderate"


def require_write_header(
    x_requested_with: str | None = Header(default=None),
):
    if x_requested_with != "XMLHttpRequest":
        raise HTTPException(
            status_code=403,
            detail="Falta el encabezado de seguridad de la solicitud.",
        )


def get_post_or_404(
    post_id: uuid.UUID,
    db: Session,
    lock: bool = False,
):
    query = select(CommunityPost).where(
        CommunityPost.id == post_id
    )

    if lock:
        query = query.with_for_update()

    post = db.scalar(query)

    if post is None:
        raise HTTPException(
            status_code=404,
            detail="La publicación no existe.",
        )

    return post


def serialize_post(post, schema, private_image=False):
    result = schema.model_validate(post).model_dump()

    image_url = None

    if post.image_key:
        prefix = (
            "/community-posts/private"
            if private_image
            else "/community-posts"
        )

        image_url = (
            f"{prefix}/{post.id}/image"
            f"?v={post.image_key}"
        )

    result["image_url"] = image_url

    return result


def store_image(file: UploadFile) -> str:
    try:
        raw = file.file.read(MAX_FILE_BYTES + 1)
    finally:
        file.file.close()

    if not raw:
        raise HTTPException(
            status_code=400,
            detail="La fotografía está vacía.",
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
                raise ValueError("Dimensiones demasiado grandes.")

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
                "Imagen inválida. Usa JPEG, PNG o WebP, "
                "con un máximo de 20 megapíxeles."
            ),
        ) from exc

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    key = f"{uuid.uuid4().hex}.webp"
    path = UPLOAD_DIR / key

    try:
        path.write_bytes(output.getvalue())
    except OSError:
        path.unlink(missing_ok=True)
        raise

    return key


def image_response(post: CommunityPost):
    key = post.image_key

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
# CREACIÓN JSON: COMPATIBILIDAD
# ==========================================

@router.post(
    "/",
    response_model=CommunityPostOwn,
    status_code=status.HTTP_201_CREATED,
)
def create_community_post(
    payload: CommunityPostCreate,
    current_user: User = Depends(
        require_permission("community_posts.create")
    ),
    db: Session = Depends(get_db),
):
    post = CommunityPost(
        author_id=current_user.id,
        title=payload.title,
        content=payload.content,
        category=payload.category,
        section=payload.section,
        status="pending",
    )

    db.add(post)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(post)

    return serialize_post(
        post,
        CommunityPostOwn,
        private_image=True,
    )


# ==========================================
# NUEVO FORMULARIO CON FOTOGRAFÍA OPCIONAL
# ==========================================

@router.post(
    "/submit",
    response_model=CommunityPostOwn,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_write_header)],
)
def submit_community_post(
    title: str = Form(..., min_length=5, max_length=180),
    content: str = Form(..., min_length=20, max_length=20000),
    category: str = Form("General", min_length=2, max_length=60),
    section: Literal[
        "community",
        "opportunities",
    ] = Form("community"),
    image_alt: str = Form("", max_length=300),
    image_authorized: bool = Form(False),
    file: UploadFile | None = File(default=None),
    current_user: User = Depends(
        require_permission("community_posts.create")
    ),
    db: Session = Depends(get_db),
):
    try:
        payload = CommunityPostCreate(
            title=title,
            content=content,
            category=category,
            section=section,
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail="Revisa el título, contenido y categoría.",
        ) from exc

    alt = image_alt.strip()
    key = None

    if file is not None:
        if not alt or not image_authorized:
            file.file.close()

            raise HTTPException(
                status_code=400,
                detail=(
                    "Para adjuntar una imagen, escribe el texto "
                    "alternativo y confirma su autorización."
                ),
            )

        key = store_image(file)

    post = CommunityPost(
        author_id=current_user.id,
        title=payload.title,
        content=payload.content,
        category=payload.category,
        section=payload.section,
        status="pending",
        image_key=key,
        image_alt=alt if key else "",
        image_authorized=bool(key and image_authorized),
    )

    db.add(post)

    try:
        db.commit()
    except Exception:
        db.rollback()

        if key:
            (UPLOAD_DIR / key).unlink(missing_ok=True)

        raise

    db.refresh(post)

    return serialize_post(
        post,
        CommunityPostOwn,
        private_image=True,
    )


# ==========================================
# PUBLICACIONES DEL AUTOR
# ==========================================

@router.get(
    "/mine",
    response_model=list[CommunityPostOwn],
)
def list_my_community_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = db.scalars(
        select(CommunityPost)
        .where(CommunityPost.author_id == current_user.id)
        .order_by(CommunityPost.created_at.desc())
    ).all()

    return [
        serialize_post(
            post,
            CommunityPostOwn,
            private_image=True,
        )
        for post in posts
    ]


# ==========================================
# FEED PÚBLICO
# ==========================================

@router.get(
    "/feed",
    response_model=list[CommunityPostPublic],
)
def list_published_community_posts(
    section: Literal[
        "community",
        "opportunities",
    ] | None = None,
    db: Session = Depends(get_db),
):
    query = select(CommunityPost).where(
        CommunityPost.status == "published"
    )

    if section is not None:
        query = query.where(
            CommunityPost.section == section
        )

    posts = db.scalars(
        query.order_by(CommunityPost.created_at.desc())
    ).all()

    return [
        serialize_post(post, CommunityPostPublic)
        for post in posts
    ]


# ==========================================
# IMÁGENES PÚBLICAS Y PRIVADAS
# ==========================================

@router.get("/{post_id}/image")
def get_public_image(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    post = get_post_or_404(post_id, db)

    if post.status != "published":
        raise HTTPException(
            status_code=404,
            detail="Fotografía no encontrada.",
        )

    return image_response(post)


@router.get("/private/{post_id}/image")
def get_private_image(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = get_post_or_404(post_id, db)

    if post.author_id != current_user.id:
        permissions = get_user_permissions(
            db=db,
            user_id=current_user.id,
        )

        if MODERATION_PERMISSION not in permissions:
            raise HTTPException(
                status_code=403,
                detail="No tienes acceso a esta fotografía.",
            )

    return image_response(post)


# ==========================================
# MODERACIÓN
# ==========================================

@router.get(
    "/",
    response_model=list[CommunityPostAdmin],
)
def list_all_community_posts(
    status_filter: Literal[
        "pending",
        "published",
        "rejected",
    ] | None = None,
    current_user: User = Depends(
        require_permission(MODERATION_PERMISSION)
    ),
    db: Session = Depends(get_db),
):
    query = select(CommunityPost)

    if status_filter:
        query = query.where(
            CommunityPost.status == status_filter
        )

    posts = db.scalars(
        query.order_by(CommunityPost.created_at.desc())
    ).all()

    return [
        serialize_post(
            post,
            CommunityPostAdmin,
            private_image=True,
        )
        for post in posts
    ]


@router.patch(
    "/{post_id}/review",
    response_model=CommunityPostAdmin,
)
def review_community_post(
    post_id: uuid.UUID,
    payload: CommunityPostReview,
    current_user: User = Depends(
        require_permission(MODERATION_PERMISSION)
    ),
    db: Session = Depends(get_db),
):
    post = get_post_or_404(
        post_id,
        db,
        lock=True,
    )

    if post.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Esta publicación ya fue revisada.",
        )

    if payload.status == "published" and post.image_key:
        if not post.image_authorized or not post.image_alt:
            raise HTTPException(
                status_code=400,
                detail="La fotografía no tiene los datos de autorización.",
            )

        if not (UPLOAD_DIR / post.image_key).is_file():
            raise HTTPException(
                status_code=400,
                detail="No se encuentra el archivo de la fotografía.",
            )

    if payload.section is not None:
        post.section = payload.section

    post.status = payload.status
    post.admin_note = payload.admin_note
    post.reviewed_at = datetime.utcnow()
    post.reviewed_by = current_user.id

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(post)

    return serialize_post(
        post,
        CommunityPostAdmin,
        private_image=True,
    )


# ==========================================
# ELIMINACIÓN
# ==========================================

@router.delete(
    "/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_community_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = get_post_or_404(
        post_id,
        db,
        lock=True,
    )

    permissions = get_user_permissions(
        db=db,
        user_id=current_user.id,
    )

    is_owner = post.author_id == current_user.id
    can_moderate = MODERATION_PERMISSION in permissions

    if not is_owner and not can_moderate:
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para eliminar esta publicación.",
        )

    if is_owner and post.status == "published" and not can_moderate:
        raise HTTPException(
            status_code=403,
            detail="No puedes eliminar una publicación ya publicada.",
        )

    db.delete(post)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
