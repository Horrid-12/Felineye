import io
import pytest
from PIL import Image
from fastapi import HTTPException
from backend.app.services.image_validator import validate_and_process_image

def _create_test_image(size=(120, 120), color=(180, 140, 80), format="JPEG") -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()

def test_validate_valid_jpeg():
    raw = _create_test_image(size=(100, 100), format="JPEG")
    img, meta = validate_and_process_image(raw)
    assert img.size == (100, 100)
    assert meta["width"] == 100
    assert meta["original_format"] == "JPEG"

def test_validate_valid_png():
    raw = _create_test_image(size=(150, 120), format="PNG")
    img, meta = validate_and_process_image(raw)
    assert img.size == (150, 120)
    assert meta["aspect_ratio"] == 1.25

def test_validate_rejects_empty_payload():
    with pytest.raises(HTTPException) as exc_info:
        validate_and_process_image(b"")
    assert exc_info.value.status_code == 400

def test_validate_rejects_corrupted_bytes():
    with pytest.raises(HTTPException) as exc_info:
        validate_and_process_image(b"NOT_A_VALID_IMAGE_STREAM_GARBAGE")
    assert exc_info.value.status_code == 400

def test_validate_rejects_undersized_image():
    raw = _create_test_image(size=(20, 20), format="PNG")
    with pytest.raises(HTTPException) as exc_info:
        validate_and_process_image(raw)
    assert exc_info.value.status_code == 422
    assert "too low" in exc_info.value.detail
