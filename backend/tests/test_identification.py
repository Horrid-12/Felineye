import asyncio
import io

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from backend.app.main import app
from backend.app.models.identification import IdentificationStatus
from backend.app.services.identification.base import RawInferenceResult, RawPrediction
from backend.app.services.identification.breed_classifier import (
    BreedInferenceResult,
    BreedScore,
)
from backend.app.services.identification.dev_provider import DevelopmentMockClassifier
from backend.app.services.identification.pipeline import (
    IdentificationPipeline,
    UnavailableClassifier,
)

client = TestClient(app)


def _generate_image_bytes(color=(160, 120, 70), size=(180, 180)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _textured_image(size=(160, 160)) -> Image.Image:
    rng = np.random.default_rng(11)
    array = rng.integers(0, 256, size=(size[1], size[0], 3), dtype=np.uint8)
    return Image.fromarray(array, mode="RGB")


class StubBreedClassifier:
    """Deterministic breed estimator injected into the pipeline."""

    is_available = True
    model_info = {
        "name": "stub-breed",
        "version": "test",
        "license": "test",
        "available": True,
    }

    def __init__(self, scores, *, fail=False):
        self.scores = scores
        self.fail = fail

    async def predict(self, image):
        if self.fail:
            raise RuntimeError("stub breed classifier failure")
        return BreedInferenceResult(
            scores=sorted(self.scores, key=lambda item: item.score, reverse=True),
            model_name="stub-breed",
            model_version="test",
            model_license="test",
        )


class StubClassifier:
    """Deterministic provider that lets tests exercise pipeline decisions."""

    def __init__(self, predictions, *, feline_detected=True, content_conflict=False, is_mock=False):
        self.predictions = predictions
        self.feline_detected = feline_detected
        self.content_conflict = content_conflict
        self.is_mock = is_mock

    @property
    def is_available(self):
        return True

    @property
    def model_info(self):
        return {
            "name": "stub",
            "version": "test",
            "license": "test",
            "available": True,
        }

    async def predict(self, image):
        return RawInferenceResult(
            predictions=self.predictions,
            feline_detected=self.feline_detected,
            feline_evidence=0.12,
            content_conflict=self.content_conflict,
            score_semantics="test_similarity",
            is_mock=self.is_mock,
            model_name="stub",
            model_version="test",
            model_license="test",
        )


def _run(
    predictions,
    *,
    image=None,
    feline_detected=True,
    content_conflict=False,
    is_mock=False,
    breed_classifier=None,
):
    pipe = IdentificationPipeline(
        classifier=StubClassifier(
            predictions,
            feline_detected=feline_detected,
            content_conflict=content_conflict,
            is_mock=is_mock,
        ),
        breed_classifier=breed_classifier,
    )
    return asyncio.run(
        pipe.identify(
            image or _textured_image(),
            {"image_fingerprint": "a" * 64, "filename": "fixture.jpg"},
        )
    )


def _pred(species_id, score, label=None):
    return RawPrediction(
        species_id=species_id,
        label=label or species_id,
        score=score,
        is_felid=True,
    )


# 1. Chihuahua with a crocodilian in the background must not become a serval.
def test_chihuahua_and_crocodile_are_not_classified_as_serval():
    result = _run(
        [
            RawPrediction(label="Chihuahua", score=0.35, is_felid=False),
            RawPrediction(label="Crocodile", score=0.30, is_felid=False),
        ],
        feline_detected=False,
    )

    assert result.status == IdentificationStatus.NON_FELINE_DETECTED
    assert result.top_candidate is None
    assert result.candidates == []
    assert result.is_discovery_eligible is False
    assert result.xp_reward == 0
    assert all(
        candidate.species_id != "leptailurus-serval" for candidate in result.candidates
    )


# 2. A Ragdoll must not become a margay.
def test_ragdoll_is_domestic_cat_not_margay():
    result = _run(
        [
            _pred("felis-catus", 0.36, "Domestic Cat"),
            _pred("leopardus-wiedii", 0.24, "Margay"),
        ]
    )

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "felis-catus"
    assert result.top_candidate.category == "domestic_species"
    assert all(candidate.species_id != "leopardus-wiedii" for candidate in result.candidates[:1])
    assert result.is_discovery_eligible is True


# 3. A tiger must return a tiger candidate when the real model supports it.
def test_tiger_returns_tiger_candidate():
    result = _run(
        [
            _pred("panthera-tigris", 0.365, "Tiger"),
            _pred("felis-chaus", 0.27, "Jungle Cat"),
        ]
    )

    assert result.status == IdentificationStatus.IDENTIFIED_WILD_SPECIES
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "panthera-tigris"
    assert result.top_candidate.category == "wild_species"
    assert result.is_discovery_eligible is True
    assert result.xp_reward == 350


# 4. A domestic cat with uncertain breed may resolve to the domestic species but
#    must not force a breed.
def test_domestic_cat_uncertain_breed_does_not_force_breed():
    result = _run(
        [
            _pred("ragdoll", 0.40, "Ragdoll"),
            _pred("persian", 0.20, "Persian"),
            _pred("panthera-leo", 0.10, "Lion"),
        ]
    )

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "felis-catus"
    assert result.top_candidate.category == "domestic_species"
    assert all(candidate.category != "domestic_breed" for candidate in result.candidates)
    assert "breed" in (result.uncertainty_note or "").lower()


def test_domestic_cat_close_to_small_wildcat_abstains():
    result = _run(
        [
            _pred("felis-catus", 0.34, "Domestic Cat"),
            _pred("felis-nigripes", 0.335, "Black-footed Cat"),
        ]
    )

    assert result.status == IdentificationStatus.UNABLE_TO_IDENTIFY
    assert result.top_candidate is None
    assert result.is_discovery_eligible is False


# 5. A non-feline image must not unlock a feline discovery.
def test_non_feline_image_never_unlocks_discovery():
    result = _run(
        [RawPrediction(label="Landscape", score=0.8, is_felid=False)],
        feline_detected=False,
    )

    assert result.status == IdentificationStatus.NON_FELINE_DETECTED
    assert result.is_discovery_eligible is False
    assert result.xp_reward == 0
    assert result.candidates == []


# 6. Invalid, corrupted, or unsupported images are rejected before inference.
def test_invalid_image_is_rejected():
    response = client.post(
        "/api/identify",
        files={"file": ("corrupt.jpg", b"this is not an image", "image/jpeg")},
    )
    assert response.status_code == 400
    assert "corrupt" in response.json()["detail"].lower()


def test_non_image_mimetype_is_rejected():
    response = client.post(
        "/api/identify",
        files={"file": ("notes.txt", b"plain text", "text/plain")},
    )
    assert response.status_code == 415


# 7. A low-quality or ambiguous feline image is allowed to abstain.
def test_low_quality_feline_image_abstains():
    pipe = IdentificationPipeline(
        classifier=StubClassifier([_pred("panthera-tigris", 0.365, "Tiger")])
    )
    solid = Image.new("RGB", (180, 180), color=(120, 120, 120))
    result = asyncio.run(
        pipe.identify(solid, {"image_fingerprint": "b" * 64, "filename": "blur.jpg"})
    )

    assert result.status == IdentificationStatus.UNABLE_TO_IDENTIFY
    assert result.top_candidate is None
    assert result.is_discovery_eligible is False
    assert result.quality["low_quality"] is True


def test_ambiguous_top_two_candidates_abstain():
    result = _run(
        [
            _pred("panthera-pardus", 0.34, "Leopard"),
            _pred("panthera-onca", 0.338, "Jaguar"),
        ]
    )

    assert result.status == IdentificationStatus.UNABLE_TO_IDENTIFY
    assert result.top_candidate is None
    assert len(result.candidates) >= 2


# 8. An unavailable model must not trigger fake predictions or XP.
def test_unavailable_model_returns_explicit_state_without_predictions():
    pipe = IdentificationPipeline(classifier=UnavailableClassifier("model weights missing"))
    result = asyncio.run(
        pipe.identify(_textured_image(), {"image_fingerprint": "c" * 64})
    )

    assert result.status == IdentificationStatus.MODEL_UNAVAILABLE
    assert result.top_candidate is None
    assert result.candidates == []
    assert result.is_mock is False
    assert result.is_discovery_eligible is False
    assert result.xp_reward == 0
    assert "weights missing" in (result.uncertainty_note or "")


# 9. Repeated submissions must not duplicate discovery rewards.
def test_repeated_submission_is_not_eligible_twice_on_the_server_contract():
    result_one = _run([_pred("panthera-tigris", 0.365, "Tiger")])
    result_two = _run([_pred("panthera-tigris", 0.365, "Tiger")])

    assert result_one.image_fingerprint == result_two.image_fingerprint
    assert result_one.is_discovery_eligible is True
    # The server describes eligibility; the client store is idempotent by species
    # and image fingerprint (covered by the frontend storage test).
    assert result_two.xp_reward == result_one.xp_reward


# 10. Simulated development predictions are labelled and isolated.
def test_development_simulation_is_labeled_and_never_eligible():
    mock = DevelopmentMockClassifier(
        species_ids=["panthera-tigris", "felis-catus", "panthera-leo"]
    )
    pipe = IdentificationPipeline(classifier=mock)
    result = asyncio.run(
        pipe.identify(_textured_image(), {"image_fingerprint": "d" * 64})
    )

    assert result.status == IdentificationStatus.DEVELOPMENT_SIMULATION
    assert result.is_mock is True
    assert result.is_discovery_eligible is False
    assert result.xp_reward == 0
    assert "simulation" in result.model_name.lower()


def test_content_conflict_abstains_instead_of_forcing_species():
    result = _run(
        [_pred("panthera-tigris", 0.365, "Tiger")],
        content_conflict=True,
    )

    assert result.status == IdentificationStatus.UNABLE_TO_IDENTIFY
    assert result.top_candidate is None
    assert result.is_discovery_eligible is False
    assert "disagree" in (result.uncertainty_note or "").lower()


# ---------------------------------------------------------------------------
# Breed estimate stage
#
# Breed estimation is a separate, optional stage that runs only after a
# domestic cat has been accepted at species level. These tests pin the honesty
# rules: no nearest-neighbour fallback, no species override, no XP change.
# ---------------------------------------------------------------------------

DOMESTIC_PREDICTIONS = [
    _pred("felis-catus", 0.36, "Domestic Cat"),
    _pred("leopardus-wiedii", 0.24, "Margay"),
]


def _breed(label, score, breed_id, kind="breed"):
    return BreedScore(label=label, score=score, breed_id=breed_id, kind=kind)


def test_confident_catalogue_breed_is_reported_as_an_estimate():
    result = _run(
        DOMESTIC_PREDICTIONS,
        breed_classifier=StubBreedClassifier(
            [
                _breed("Ragdoll", 0.78, "ragdoll"),
                _breed("Birman", 0.15, "birman"),
                _breed("Siamese", 0.03, "siamese"),
            ]
        ),
    )

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.breed is not None
    assert result.breed.breed_id == "ragdoll"
    assert result.breed.category == "domestic_breed"
    assert result.breed.is_estimate is True
    assert result.breed.score_percentage == 78
    assert [candidate.breed_id for candidate in result.breed_candidates][:2] == [
        "ragdoll",
        "birman",
    ]
    assert "not pedigree verification" in (result.breed_note or "").lower()


def test_british_shorthair_is_reported_when_confident():
    result = _run(
        DOMESTIC_PREDICTIONS,
        breed_classifier=StubBreedClassifier(
            [
                _breed("British Shorthair", 0.97, "british-shorthair"),
                _breed("Russian Blue", 0.01, "russian-blue"),
            ]
        ),
    )

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.breed is not None
    assert result.breed.breed_id == "british-shorthair"
    assert result.breed.common_name == "British Shorthair"
    assert result.xp_reward == 50
    assert result.is_discovery_eligible is True


def test_low_confidence_breed_is_not_asserted():
    result = _run(
        DOMESTIC_PREDICTIONS,
        breed_classifier=StubBreedClassifier(
            [
                _breed("Ragdoll", 0.20, "ragdoll"),
                _breed("Birman", 0.05, "birman"),
            ]
        ),
    )

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.breed is None
    assert "threshold" in (result.breed_note or "").lower()
    # The domestic-cat species result and its XP are unaffected.
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "felis-catus"
    assert result.xp_reward == 50
    assert result.is_discovery_eligible is True


def test_close_breed_margin_is_not_asserted():
    result = _run(
        DOMESTIC_PREDICTIONS,
        breed_classifier=StubBreedClassifier(
            [
                _breed("Ragdoll", 0.50, "ragdoll"),
                _breed("Birman", 0.47, "birman"),
            ]
        ),
    )

    assert result.breed is None
    assert "too close" in (result.breed_note or "").lower()


def test_generic_coat_class_abstains_instead_of_nearest_breed():
    result = _run(
        DOMESTIC_PREDICTIONS,
        breed_classifier=StubBreedClassifier(
            [
                _breed("Calico", 0.90, None, kind="generic"),
                _breed("Manx", 0.05, "manx"),
            ]
        ),
    )

    assert result.breed is None
    assert "general domestic-cat class" in (result.breed_note or "").lower()


def test_breed_outside_catalogue_abstains_instead_of_nearest_breed():
    result = _run(
        DOMESTIC_PREDICTIONS,
        breed_classifier=StubBreedClassifier(
            [
                _breed("Exotic Shorthair", 0.90, None, kind="unmapped"),
                _breed("Persian", 0.05, "persian"),
            ]
        ),
    )

    assert result.breed is None
    assert "not in the curated" in (result.breed_note or "").lower()


def test_wild_species_never_receives_a_breed_estimate():
    result = _run(
        [
            _pred("panthera-tigris", 0.365, "Tiger"),
            _pred("felis-chaus", 0.27, "Jungle Cat"),
        ],
        breed_classifier=StubBreedClassifier(
            [_breed("Ragdoll", 0.99, "ragdoll")]
        ),
    )

    assert result.status == IdentificationStatus.IDENTIFIED_WILD_SPECIES
    assert result.breed is None
    assert result.breed_candidates == []
    assert result.breed_note is None
    assert result.xp_reward == 350


def test_breed_estimate_never_changes_xp_or_eligibility():
    without_breed = _run(DOMESTIC_PREDICTIONS)
    with_breed = _run(
        DOMESTIC_PREDICTIONS,
        breed_classifier=StubBreedClassifier(
            [_breed("Ragdoll", 0.78, "ragdoll")]
        ),
    )

    assert with_breed.breed is not None
    assert without_breed.breed is None
    assert with_breed.status == without_breed.status
    assert with_breed.xp_reward == without_breed.xp_reward == 50
    assert (
        with_breed.is_discovery_eligible == without_breed.is_discovery_eligible is True
    )


def test_missing_breed_classifier_keeps_domestic_result_and_explains():
    result = _run(DOMESTIC_PREDICTIONS, breed_classifier=None)

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.breed is None
    assert "not installed" in (result.breed_note or "").lower()
    assert result.xp_reward == 50


def test_breed_classifier_failure_never_breaks_species_result():
    result = _run(
        DOMESTIC_PREDICTIONS,
        breed_classifier=StubBreedClassifier([], fail=True),
    )

    assert result.status == IdentificationStatus.IDENTIFIED_DOMESTIC_CAT
    assert result.top_candidate is not None
    assert result.top_candidate.species_id == "felis-catus"
    assert result.breed is None
    assert "failed" in (result.breed_note or "").lower()
    assert result.xp_reward == 50
    assert result.is_discovery_eligible is True
