import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_list_observations_endpoint():
    response = client.get("/api/observations?limit=8")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "observations" in data
    assert "disclaimer" in data
    assert len(data["observations"]) > 0

    first_obs = data["observations"][0]
    assert "species_name" in first_obs
    assert "broad_location" in first_obs
    assert first_obs["coordinates_obscured"] is True
