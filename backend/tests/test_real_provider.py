"""Regression tests that exercise the *real* configured providers.

These tests load the actual BioCLIP ONNX vision encoder and the MobileNetV2
ImageNet gate from ``backend/models``. They are skipped when the (gitignored)
weights are absent so the default test run still works on a fresh clone.

Run the setup script first to reproduce the weights:

    backend\\.venv\\Scripts\\python.exe backend\\scripts\\setup_identification_models.py --all

The fixtures in ``backend/tests/fixtures`` are real photographs (see the README
there for provenance and licences). They are used only for regression testing.
"""

from __future__ import annotations

import asyncio
from pathlib import Path

import pytest
from PIL import Image

from backend.app.config import settings
from backend.app.models.identification import IdentificationStatus
from backend.app.services.identification.bioclip_classifier import BioClipClassifier
from backend.app.services.identification.breed_classifier import BreedClassifier
from backend.app.services.identification.imagenet_gate import ImageNetFelineGate
from backend.app.services.identification.pipeline import IdentificationPipeline

FIXTURES = Path(__file__).parent / "fixtures"

MODEL_PATHS = {
    "bioclip": Path(settings.bioclip_model_path),
    "embeddings": Path(settings.bioclip_text_embeddings_path),
    "imagenet": Path(settings.imagenet_model_path),
    "labels": Path(settings.imagenet_labels_path),
}

BREED_PATHS = {
    "breed_model": Path(settings.breed_model_path),
    "breed_labels": Path(settings.breed_labels_path),
}

missing_models = [name for name, path in MODEL_PATHS.items() if not path.exists()]
missing_breed = [name for name, path in BREED_PATHS.items() if not path.exists()]

pytestmark = pytest.mark.skipif(
    bool(missing_models),
    reason=(
        "Real identification weights are not installed (missing: "
        + ", ".join(missing_models)
        + "). Run backend/scripts/setup_identification_models.py --all."
    ),
)

requires_breed_model = pytest.mark.skipif(
    bool(missing_breed),
    reason=(
        "Real breed weights are not installed (missing: "
        + ", ".join(missing_breed)
        + "). Run backend/scripts/setup_identification_models.py --breed."
    ),
)


@pytest.fixture(scope="module")
def real_pipeline() -> IdentificationPipeline:
    gate = ImageNetFelineGate(settings.imagenet_model_path, settings.imagenet_labels_path)
    assert gate.is_available, gate.load_error
    classifier = BioClipClassifier(
        settings.bioclip_model_path,
        settings.bioclip_text_embeddings_path,
        gate=gate,
    )
    assert classifier.is_available, classifier.load_error
    return IdentificationPipeline(classifier=classifier)


@pytest.fixture(scope="module")
def real_breed_pipeline() -> IdentificationPipeline:
    """Real species pipeline *plus* the real dedicated breed classifier."""
    gate = ImageNetFelineGate(settings.imagenet_model_path, settings.imagenet_labels_path)
    assert gate.is_available, gate.load_error
    classifier = BioClipClassifier(
        settings.bioclip_model_path,
        settings.bioclip_text_embeddings_path,
        gate=gate,
    )
    assert classifier.is_available, classifier.load_error
    breed = BreedClassifier(settings.breed_model_path, settings.breed_labels_path)
    assert breed.is_available, breed.load_error
    return IdentificationPipeline(classifier=classifier, breed_classifier=breed)


def _identify(pipe: IdentificationPipeline, fixture_name: str):
    path = FIXTURES / f"{fixture_name}.jpg"
    assert path.exists(), f"missing fixture {path}"
    image = Image.open(path).convert("RGB")
    return asyncio.run(
        pipe.identify(image, {"image_fingerprint": fixture_name, "filename": path.name})
    )


def test_real_provider_reports_its_identity(real_pipeline: IdentificationPipeline):
    info = real_pipeline.model_info
    assert info["name"] == "BioCLIP ViT-B/16"
    assert info["license"] == "MIT"
    assert info["gate"]["name"].startswith("MobileNetV2")
    assert info["gate"]["license"] == "Apache-2.0"
    assert real_pipeline.is_mock_active is False
    assert real_pipeline.capabilities["non_feline_gate"] == "imagenet"


def test_real_tiger_is_identified_as_tiger(real_pipeline: IdentificationPipeline):
    result = _identify(real_pipeline, "tiger")

    assert result.status == IdentificationStatus.IDENTIFIED_WILD_SPECIES
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "panthera-tigris"
    assert result.top_candidate.category == "wild_species"
    assert result.is_discovery_eligible is True
    assert result.xp_reward == 350
    assert result.is_mock is False
    assert result.is_calibrated is False
    assert result.score_semantics == "bioclip_image_text_cosine_similarity"
    # The independent gate must have seen a cat, not just BioCLIP.
    assert result.feline_gate is not None
    assert result.feline_gate["top_label"] == "tiger"


def test_real_ragdoll_is_domestic_cat_not_a_wildcat(real_pipeline: IdentificationPipeline):
    result = _identify(real_pipeline, "ragdoll")

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "felis-catus"
    assert result.top_candidate.category == "domestic_species"
    assert result.is_discovery_eligible is True
    assert result.xp_reward == 50
    # No breed claim and no wildcat label on the top candidate.
    assert all(
        candidate.category != "domestic_breed" for candidate in result.candidates
    )
    assert result.feline_gate is not None
    assert result.feline_gate["feline_detected"] is True


def test_real_chihuahua_is_not_a_feline(real_pipeline: IdentificationPipeline):
    result = _identify(real_pipeline, "chihuahua")

    assert result.status == IdentificationStatus.NON_FELINE_DETECTED
    assert result.top_candidate is None
    assert result.candidates == []
    assert result.is_discovery_eligible is False
    assert result.xp_reward == 0


def test_real_crocodile_is_not_a_feline(real_pipeline: IdentificationPipeline):
    result = _identify(real_pipeline, "crocodile")

    assert result.status == IdentificationStatus.NON_FELINE_DETECTED
    assert result.top_candidate is None
    assert result.is_discovery_eligible is False
    assert result.xp_reward == 0


def test_real_serval_is_identified_as_a_wild_species(real_pipeline: IdentificationPipeline):
    result = _identify(real_pipeline, "serval")

    assert result.status == IdentificationStatus.IDENTIFIED_WILD_SPECIES
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "leptailurus-serval"
    assert result.is_discovery_eligible is True
    assert result.xp_reward == 230


def test_real_chihuahua_with_crocodile_is_never_a_serval(
    real_pipeline: IdentificationPipeline,
):
    result = _identify(real_pipeline, "chihuahua_with_crocodile")

    # The composite is deliberately adversarial: a non-feline plus a reptile.
    # It may be rejected as non-feline or abstained on, but must never become a
    # wildcat discovery.
    assert result.status in {
        IdentificationStatus.NON_FELINE_DETECTED,
        IdentificationStatus.UNABLE_TO_IDENTIFY,
    }
    assert result.is_discovery_eligible is False
    assert result.xp_reward == 0
    if result.top_candidate is not None:
        assert result.top_candidate.category != "wild_species"
    assert all(
        candidate.species_id != "leptailurus-serval" for candidate in result.candidates
    )


# ---------------------------------------------------------------------------
# Real breed-classifier regressions
# ---------------------------------------------------------------------------


@requires_breed_model
def test_real_british_shorthair_receives_a_breed_estimate(
    real_breed_pipeline: IdentificationPipeline,
):
    result = _identify(real_breed_pipeline, "british-shorthair")

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "felis-catus"
    assert result.breed is not None
    assert result.breed.breed_id == "british-shorthair"
    assert result.breed.category == "domestic_breed"
    assert result.breed.is_estimate is True
    assert result.breed.score_percentage >= 45
    assert "not pedigree verification" in (result.breed_note or "").lower()
    # A breed estimate never changes the species reward.
    assert result.is_discovery_eligible is True
    assert result.xp_reward == 50


@requires_breed_model
def test_real_ragdoll_receives_a_breed_estimate(
    real_breed_pipeline: IdentificationPipeline,
):
    result = _identify(real_breed_pipeline, "ragdoll")

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.breed is not None
    assert result.breed.breed_id == "ragdoll"
    assert result.breed.score_percentage >= 45
    assert result.is_discovery_eligible is True
    assert result.xp_reward == 50


@requires_breed_model
def test_real_generic_domestic_cat_never_forces_a_breed(
    real_breed_pipeline: IdentificationPipeline,
):
    result = _identify(real_breed_pipeline, "domestic-shorthair")

    # The species pipeline may accept or abstain on this generic cat, but the
    # breed stage must never invent a breed for a non-breed image.
    assert result.status in {
        IdentificationStatus.IDENTIFIED_DOMESTIC_CAT,
        IdentificationStatus.UNABLE_TO_IDENTIFY,
    }
    assert result.breed is None
    if result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT:
        assert result.xp_reward == 50
    else:
        assert result.xp_reward == 0
        assert result.is_discovery_eligible is False


@requires_breed_model
def test_real_wild_species_never_receives_a_breed_estimate(
    real_breed_pipeline: IdentificationPipeline,
):
    result = _identify(real_breed_pipeline, "tiger")

    assert result.status == IdentificationStatus.IDENTIFIED_WILD_SPECIES
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "panthera-tigris"
    assert result.breed is None
    assert result.breed_candidates == []
    assert result.breed_note is None
    assert result.xp_reward == 350
