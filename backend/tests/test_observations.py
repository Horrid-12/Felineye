import asyncio
import time
import httpx
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.inaturalist_service import inaturalist_service

client = TestClient(app)

FORBIDDEN_COORDINATE_FIELDS = {
    "latitude",
    "longitude",
    "lat",
    "lng",
    "lon",
    "exact_coordinates",
    "coordinates",
    "geojson",
}


@pytest.fixture(autouse=True)
def clear_service_cache():
    inaturalist_service.clear_cache()
    yield
    inaturalist_service.clear_cache()


def test_list_observations_endpoint_with_mocked_inaturalist_success(monkeypatch):
    """Ensure iNaturalist success response is parsed correctly without network dependency."""
    mock_raw_inat_response = {
        "results": [
            {
                "id": 999001,
                "taxon": {
                    "name": "Panthera leo",
                    "preferred_common_name": "Lion",
                },
                "photos": [
                    {"url": "https://inaturalist-open-data.s3.amazonaws.com/photos/1/square.jpg"}
                ],
                "observed_on": "2026-09-01",
                "place_guess": "Serengeti National Park, Tanzania",
                "quality_grade": "research",
                # iNaturalist raw data might include coordinates; our model must never expose them
                "latitude": -2.3333,
                "longitude": 34.8333,
                "geojson": {"type": "Point", "coordinates": [34.8333, -2.3333]},
            }
        ]
    }

    class MockResponse:
        status_code = 200

        def json(self):
            return mock_raw_inat_response

    async def mock_get(self, url, params=None):
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    response = client.get("/api/observations?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["observations"]) == 1

    obs = data["observations"][0]
    assert obs["id"] == "inat-999001"
    assert obs["species_name"] == "Lion"
    assert obs["scientific_name"] == "Panthera leo"
    assert obs["broad_location"] == "Serengeti National Park, Tanzania"
    assert obs["coordinates_obscured"] is True
    assert "medium.jpg" in obs["image_url"]


def test_list_observations_fallback_on_network_failure(monkeypatch):
    """Ensure graceful degradation to curated fallback records when iNaturalist is down/unreachable."""
    async def mock_get_fail(self, url, params=None):
        raise httpx.ConnectTimeout("iNaturalist connection timed out")

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get_fail)

    response = client.get("/api/observations?limit=4")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 4
    assert len(data["observations"]) == 4

    # Verify fallback entries
    for obs in data["observations"]:
        assert obs["coordinates_obscured"] is True
        assert obs["source"] == "iNaturalist Network"
        assert obs["quality_grade"] == "research"


def test_regression_no_precise_coordinates_exposed(monkeypatch):
    """Strict conservation requirement: ensure no observation ever exposes latitude/longitude fields."""
    mock_leak_attempt = {
        "results": [
            {
                "id": 888002,
                "taxon": {"name": "Acinonyx jubatus", "preferred_common_name": "Cheetah"},
                "photos": [],
                "observed_on": "2026-08-10",
                "place_guess": "Kgalagadi Transfrontier Park",
                "latitude": -25.5,
                "longitude": 20.5,
                "lat": -25.5,
                "lng": 20.5,
                "coordinates": [-25.5, 20.5],
            }
        ]
    }

    class MockResponse:
        status_code = 200

        def json(self):
            return mock_leak_attempt

    async def mock_get(self, url, params=None):
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    response = client.get("/api/observations?limit=10")
    assert response.status_code == 200
    data = response.json()

    # Check mocked live records
    for obs in data["observations"]:
        keys = set(obs.keys())
        overlap = keys.intersection(FORBIDDEN_COORDINATE_FIELDS)
        assert not overlap, f"Security/Conservation violation: exposed forbidden coordinate fields {overlap}"
        assert obs["coordinates_obscured"] is True

    # Also check curated fallback records
    inaturalist_service.clear_cache()

    async def mock_fail(self, url, params=None):
        raise httpx.RequestError("Network down")

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_fail)

    fallback_resp = client.get("/api/observations?limit=10")
    assert fallback_resp.status_code == 200
    for obs in fallback_resp.json()["observations"]:
        keys = set(obs.keys())
        overlap = keys.intersection(FORBIDDEN_COORDINATE_FIELDS)
        assert not overlap, f"Forbidden fields in fallback data: {overlap}"
        assert obs["coordinates_obscured"] is True


def test_observations_cache_ttl_tracked_per_query_key(monkeypatch):
    """Ensure cache TTL is tracked independently per query key rather than a global timestamp."""
    call_counts = {"taxon_1": 0, "taxon_2": 0}

    async def mock_get(self, url, params=None):
        taxon_id = params.get("taxon_id")
        if taxon_id == 1111:
            call_counts["taxon_1"] += 1
            name = "Felis chaus"
        else:
            call_counts["taxon_2"] += 1
            name = "Leopardus geoffroyi"

        class Resp:
            status_code = 200

            def json(self):
                return {
                    "results": [
                        {
                            "id": 1,
                            "taxon": {"name": name, "preferred_common_name": name},
                            "photos": [],
                            "observed_on": "2026-01-01",
                            "place_guess": "Location",
                            "quality_grade": "research",
                        }
                    ]
                }

        return Resp()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    current_time = 1000.0
    monkeypatch.setattr(time, "time", lambda: current_time)

    # 1. Fetch taxon_1 at t=1000.
    res1 = asyncio.run(inaturalist_service.get_feline_observations(taxon_id=1111))
    assert call_counts["taxon_1"] == 1
    assert res1.observations[0].species_name == "Felis chaus"

    # 2. Advance time to t=1300 (300s later, well within 600s TTL). Fetch taxon_2.
    current_time = 1300.0
    res2 = asyncio.run(inaturalist_service.get_feline_observations(taxon_id=2222))
    assert call_counts["taxon_2"] == 1
    assert res2.observations[0].species_name == "Leopardus geoffroyi"

    # 3. Advance time to t=1700 (700s since taxon_1 was cached, so taxon_1 is expired (>600s),
    # but taxon_2 was cached at t=1300, so age=400s < 600s and taxon_2 should still be CACHED).
    current_time = 1700.0

    # taxon_2 should hit cache (no new HTTP call)
    res2_cached = asyncio.run(inaturalist_service.get_feline_observations(taxon_id=2222))
    assert call_counts["taxon_2"] == 1

    # taxon_1 should have expired and make a new HTTP call
    res1_fresh = asyncio.run(inaturalist_service.get_feline_observations(taxon_id=1111))
    assert call_counts["taxon_1"] == 2
