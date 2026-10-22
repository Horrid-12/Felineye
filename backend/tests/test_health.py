import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check_returns_200():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "provider" in data
    assert data["indexed_species_count"] > 30

def test_root_index_returns_docs_links():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "documentation" in data
