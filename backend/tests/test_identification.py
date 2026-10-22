import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def _generate_test_image_bytes(color=(160, 120, 70), size=(180, 180)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_identify_valid_image():
    image_bytes = _generate_test_image_bytes()
    files = {"file": ("test_feline.jpg", image_bytes, "image/jpeg")}
    response = client.post("/api/identify", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "candidates" in data
    assert "score_semantics" in data
    assert "is_mock" in data
    assert "processing_time_ms" in data
    assert "disclaimer" in data

    if data["status"] in ("high_confidence", "moderate_confidence"):
        assert data["top_candidate"] is not None
        assert data["top_candidate"]["confidence_score"] > 0
        assert data["top_candidate"]["common_name"] != ""

def test_identify_rejects_non_image_mimetype():
    files = {"file": ("notes.txt", b"plain text data", "text/plain")}
    response = client.post("/api/identify", files=files)
    assert response.status_code == 415

def test_collection_metadata_endpoint():
    response = client.get("/api/collection/species")
    assert response.status_code == 200
    data = response.json()
    assert "species" in data
    assert "badges" in data
    assert "ranks" in data
    assert len(data["species"]) > 30
    assert len(data["badges"]) >= 5
    assert len(data["ranks"]) >= 5
