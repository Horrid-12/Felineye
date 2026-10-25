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
from backend.app.services.identification.imagenet_gate import ImageNetFelineGate
from backend.app.services.identification.pipeline import IdentificationPipeline

FIXTURES = Path(__file__).parent / "fixtures"

MODEL_PATHS = {
    "bioclip": Path(settings.bioclip_model_path),
    "embeddings": Path(settings.bioclip_text_embeddings_path),
    "imagenet": Path(settings.imagenet_model_path),
    "labels": Path(settings.imagenet_labels_path),
}

missing_models = [name for name, path in MODEL_PATHS.items() if not path.exists()]

pytestmark = pytest.mark.skipif(
    bool(missing_models),
    reason=(
        "Real identification weights are not installed (missing: "
        + ", ".join(missing_models)
        + "). Run backend/scripts/setup_identification_models.py --all."
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
