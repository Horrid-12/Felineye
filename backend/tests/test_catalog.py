import io

import pytest
from PIL import Image
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

EXPECTED_WILD_SPECIES = 40
EXPECTED_DOMESTIC_SPECIES = 1
EXPECTED_BREEDS = 22
EXPECTED_HYBRIDS = 4


def _generate_image_bytes(color=(150, 110, 80), size=(200, 200)) -> bytes:
    image = Image.new("RGB", size, color=color)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_catalog_meta_reports_separate_counts():
    response = client.get("/api/catalog/meta")
    assert response.status_code == 200
    data = response.json()

    assert data["wild_species_count"] == EXPECTED_WILD_SPECIES
    assert data["domestic_species_count"] == EXPECTED_DOMESTIC_SPECIES
    assert data["species_count"] == EXPECTED_WILD_SPECIES + EXPECTED_DOMESTIC_SPECIES
    assert data["breed_count"] == EXPECTED_BREEDS
    assert data["hybrid_count"] == EXPECTED_HYBRIDS
    assert data["lineage_count"] == 8

    # Breeds must never be folded into the species total.
    assert data["species_count"] == data["wild_species_count"] + data["domestic_species_count"]

    assert "IUCN/SSC Cat Specialist Group" in data["authority"]
    assert data["year"] == 2017
    assert "Kitchener" in data["reference"]
    assert "Cat Fanciers" in data["breed_registry"]["name"]
    assert data["breed_registry"]["url"].startswith("https://cfa.org/")


def test_species_category_filter():
    wild = client.get("/api/species", params={"category": "wild_species", "page_size": 100}).json()
    domestic = client.get(
        "/api/species", params={"category": "domestic_species", "page_size": 100}
    ).json()

    assert wild["total"] == EXPECTED_WILD_SPECIES
    assert all(item["category"] == "wild_species" for item in wild["items"])
    assert all(item["is_wild"] is True for item in wild["items"])

    assert domestic["total"] == EXPECTED_DOMESTIC_SPECIES
    assert [item["id"] for item in domestic["items"]] == ["felis-catus"]
    assert domestic["items"][0]["category"] == "domestic_species"

    every = client.get("/api/species", params={"page_size": 100}).json()
    assert every["total"] == EXPECTED_WILD_SPECIES + EXPECTED_DOMESTIC_SPECIES
    assert {item["category"] for item in every["items"]} == {
        "wild_species",
        "domestic_species",
    }


def test_breeds_are_listed_separately_from_species():
    response = client.get("/api/breeds", params={"page_size": 100})
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == EXPECTED_BREEDS
    assert len(data["items"]) == EXPECTED_BREEDS
    for breed in data["items"]:
        assert breed["category"] == "domestic_breed"
        assert breed["scientific_name"] == "Felis catus"
        assert breed["parent_id"] == "felis-catus"
        assert breed["registry_url"].startswith("https://cfa.org/breed/")

    # The species endpoint must not leak breed records into the species count.
    species_total = client.get("/api/species", params={"page_size": 100}).json()["total"]
    assert species_total == EXPECTED_WILD_SPECIES + EXPECTED_DOMESTIC_SPECIES


@pytest.mark.parametrize(
    "breed_id",
    [
        "ragdoll",
        "persian",
        "siamese",
        "maine-coon",
        "bengal",
        "sphynx",
        "british-shorthair",
        "scottish-fold",
    ],
)
def test_required_breeds_present(breed_id):
    response = client.get(f"/api/breeds/{breed_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == breed_id
    assert data["category"] == "domestic_breed"
    assert data["provenance"]["breed_registry"]


def test_breed_search_and_detail():
    search = client.get("/api/breeds", params={"search": "ragdoll"}).json()
    assert search["total"] >= 1
    assert any(item["id"] == "ragdoll" for item in search["items"])

    detail = client.get("/api/breeds/ragdoll").json()
    assert detail["common_name"] == "Ragdoll"
    assert detail["registry_verified"]
    assert detail["development"]
    assert detail["image_url"]


def test_breed_slug_not_found():
    response = client.get("/api/breeds/not-a-real-breed")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_taxa_endpoint_unions_all_categories():
    cases = {
        "panthera-leo": "wild_species",
        "felis-catus": "domestic_species",
        "persian": "domestic_breed",
        "liger": "hybrid",
    }
    for slug, category in cases.items():
        response = client.get(f"/api/taxa/{slug}")
        assert response.status_code == 200, slug
        assert response.json()["category"] == category

    missing = client.get("/api/taxa/not-a-real-taxon")
    assert missing.status_code == 404


def test_hybrids_are_separate_from_species_and_breeds():
    response = client.get("/api/catalog/hybrids")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == EXPECTED_HYBRIDS
    ids = {item["id"] for item in data["items"]}
    assert ids == {"liger", "tigon", "leopon", "pumapard"}
    for item in data["items"]:
        assert item["category"] == "hybrid"
        assert item["parents"]
        assert all(parent.startswith(("panthera-", "puma-")) for parent in item["parents"])


def test_collection_roster_is_species_only():
    response = client.get("/api/collection/species")
    assert response.status_code == 200
    data = response.json()

    assert len(data["species"]) == EXPECTED_WILD_SPECIES + EXPECTED_DOMESTIC_SPECIES
    assert {item["category"] for item in data["species"]} == {
        "wild_species",
        "domestic_species",
    }
    assert all(item["id"] != "ragdoll" for item in data["species"])


def test_identification_never_returns_breeds_or_hybrids():
    files = {"file": ("cat.jpg", _generate_image_bytes(), "image/jpeg")}
    response = client.post("/api/identify", files=files)
    assert response.status_code == 200
    data = response.json()

    for candidate in data["candidates"]:
        assert candidate["category"] in ("wild_species", "domestic_species")

    if data["status"].startswith("identified_"):
        assert data["top_candidate"]["category"] in ("wild_species", "domestic_species")


class _StubClassifier:
    """Deterministic provider used to exercise taxonomy handling in the pipeline."""

    def __init__(self, predictions):
        self._predictions = predictions

    @property
    def is_available(self):
        return True

    @property
    def model_info(self):
        return {"name": "stub", "version": "test", "license": "test", "available": True}

    async def predict(self, image):
        from backend.app.services.identification.base import RawInferenceResult

        return RawInferenceResult(
            predictions=self._predictions,
            feline_detected=True,
            feline_evidence=0.5,
            score_semantics="test_similarity",
            is_mock=False,
            model_name="stub",
        )


def _textured_image():
    """Deterministic high-detail image so the quality gate does not abstain."""
    import numpy as np
    from PIL import Image

    rng = np.random.default_rng(7)
    array = rng.integers(0, 256, size=(128, 128, 3), dtype=np.uint8)
    return Image.fromarray(array, mode="RGB")


def _run_pipeline(predictions):
    import asyncio

    from backend.app.services.identification.pipeline import IdentificationPipeline

    pipe = IdentificationPipeline(classifier=_StubClassifier(predictions))
    return asyncio.run(pipe.identify(_textured_image(), {"image_fingerprint": "stub-fixture"}))


def test_breed_prediction_is_downgraded_to_domestic_cat_without_breed_claim():
    from backend.app.models.identification import IdentificationStatus
    from backend.app.services.identification.base import RawPrediction

    result = _run_pipeline(
        [
            RawPrediction(label="Ragdoll", species_id="ragdoll", score=0.81),
            RawPrediction(label="Persian", species_id="persian", score=0.12),
            RawPrediction(label="Lion", species_id="panthera-leo", score=0.07),
        ]
    )

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "felis-catus"
    assert result.top_candidate.category == "domestic_species"
    assert "breed" in (result.uncertainty_note or "").lower()
    assert all(candidate.category != "domestic_breed" for candidate in result.candidates)


def test_domestic_species_result_notes_undetermined_breed():
    from backend.app.models.identification import IdentificationStatus
    from backend.app.services.identification.base import RawPrediction

    result = _run_pipeline(
        [
            RawPrediction(label="Domestic Cat", species_id="felis-catus", score=0.92),
            RawPrediction(label="Lion", species_id="panthera-leo", score=0.03),
        ]
    )

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.top_candidate.category == "domestic_species"
    assert "breed" in (result.uncertainty_note or "").lower()


def test_hybrid_prediction_is_dropped_and_never_classified():
    from backend.app.models.identification import IdentificationStatus
    from backend.app.services.identification.base import RawPrediction

    result = _run_pipeline([RawPrediction(label="Liger", species_id="liger", score=0.95)])

    assert result.status == IdentificationStatus.UNABLE_TO_IDENTIFY
    assert result.top_candidate is None
    assert result.candidates == []
    assert "taxonomy" in (result.uncertainty_note or "").lower()
