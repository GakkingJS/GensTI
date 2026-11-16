import os
import re
import uuid
from io import BytesIO
from pathlib import Path

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

from authorization import require_permission
from sessions import get_current_user


router = APIRouter(
    prefix="/event-images",
    tags=["Event Images"],
)

UPLOAD_DIR = Path(
    os.getenv("EVENT_UPLOAD_DIR", "/app/uploads/events")
)

MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000


def require_write_header(
    x_requested_with: str | None = Header(default=None),
):
    if x_requested_with != "XMLHttpRequest":
        raise HTTPException(
            status_code=403,
            detail="Falta el encabezado de seguridad de la solicitud.",
        )


@router.post(
    "/upload",
    dependencies=[Depends(require_write_header)],
)
def upload_event_image(
    file: UploadFile = File(...),
    current_user=Depends(
        require_permission("events.create")
    ),
):
    try:
        raw = file.file.read(MAX_FILE_BYTES + 1)
    finally:
        file.file.close()

    if not raw:
        raise HTTPException(
            status_code=400,
            detail="La imagen está vacía.",
        )

    if len(raw) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="La imagen no puede superar 5 MB.",
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
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Imagen inválida. Usa JPEG, PNG o WebP, "
                "con un máximo de 20 megapíxeles."
            ),
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    key = f"{uuid.uuid4().hex}.webp"
    path = UPLOAD_DIR / key

    try:
        path.write_bytes(output.getvalue())
    except OSError:
        path.unlink(missing_ok=True)
        raise

    return {
        "image_url": f"/event-images/{key}",
    }


@router.get("/{image_key}")
def get_event_image(image_key: str):
    if not re.fullmatch(r"[0-9a-f]{32}\.webp", image_key):
        raise HTTPException(
            status_code=404,
            detail="Imagen no encontrada.",
        )

    path = UPLOAD_DIR / image_key

    if not path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Imagen no encontrada.",
        )

    return FileResponse(
        path,
        media_type="image/webp",
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        },
    )