import io
from typing import Tuple, Dict, Any
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import HTTPException, status
from ..config import settings

ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP", "BMP"}
MAX_BYTES = settings.max_image_size_mb * 1024 * 1024

def validate_and_process_image(raw_bytes: bytes) -> Tuple[Image.Image, Dict[str, Any]]:
    """
    Validates uploaded raw image bytes:
    1. Checks payload size against configured limit.
    2. Validates image decodability and catches corrupted data using Pillow.
    3. Enforces allowable MIME/container formats.
    4. Validates dimension boundaries.
    5. Normalizes EXIF orientation and strips raw metadata for safety.
    6. Converts to standard RGB space.
    """
    if not raw_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty image payload received."
        )

    if len(raw_bytes) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds the maximum allowed upload size of {settings.max_image_size_mb} MB."
        )

    stream = io.BytesIO(raw_bytes)

    try:
        with Image.open(stream) as probe:
            probe_format = probe.format
            if not probe_format or probe_format.upper() not in ALLOWED_FORMATS:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"Unsupported image format: '{probe_format}'. Allowed formats are JPEG, PNG, and WebP."
                )
            # Verify file integrity
            probe.verify()
    except (UnidentifiedImageError, OSError, SyntaxError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupt or unreadable image file: {str(e)}"
        )

    # Re-open stream for actual processing (verify closes/invalidates the image object)
    stream.seek(0)
    try:
        img = Image.open(stream)
        # Transpose based on EXIF orientation if present
        img = ImageOps.exif_transpose(img)
    except Exception:
        stream.seek(0)
        img = Image.open(stream)

    width, height = img.size

    if width < 48 or height < 48:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Image resolution too low ({width}x{height}px). Minimum supported resolution is 48x48px."
        )

    if width > 10000 or height > 10000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Image resolution exceeds maximum supported dimensions ({width}x{height}px)."
        )

    # Convert to clean RGB (strips any alpha/paletted quirks)
    if img.mode != "RGB":
        img = img.convert("RGB")

    metadata = {
        "width": width,
        "height": height,
        "aspect_ratio": round(width / max(height, 1), 2),
        "original_format": probe_format,
        "file_size_kb": round(len(raw_bytes) / 1024, 1)
    }

    return img, metadata
