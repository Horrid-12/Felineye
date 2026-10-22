import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_list_species_default():
    response = client.get("/api/species")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 30
    assert len(data["items"]) > 0

def test_list_species_search():
    response = client.get("/api/species?search=cheetah")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    names = [s["common_name"].lower() for s in data["items"]]
    assert any("cheetah" in name for name in names)

def test_list_species_filter_wild_vs_domestic():
    # Test domestic
    resp_domestic = client.get("/api/species?is_wild=false")
    assert resp_domestic.status_code == 200
    data_domestic = resp_domestic.json()
    assert any(s["id"] == "felis-catus" for s in data_domestic["items"])

    # Test wild
    resp_wild = client.get("/api/species?is_wild=true")
    assert resp_wild.status_code == 200
    data_wild = resp_wild.json()
    assert all(s["is_wild"] is True for s in data_wild["items"])

def test_get_species_by_slug_success():
    response = client.get("/api/species/panthera-leo")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "panthera-leo"
    assert data["common_name"] == "Lion"
    assert data["subfamily"] == "Pantherinae"
    assert len(data["distinguishing_characteristics"]) > 0

def test_get_species_by_slug_not_found():
    response = client.get("/api/species/non-existent-cat-slug")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_featured_species():
    response = client.get("/api/species/featured/today")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "common_name" in data
    assert data["is_wild"] is True
