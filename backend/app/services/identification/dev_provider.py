import hashlib
from typing import List

from PIL import Image

from .base import BaseClassifier, RawInferenceResult, RawPrediction


class DevelopmentMockClassifier(BaseClassifier):
    """Explicitly selected development-only simulation provider.

    This is NOT AI inference. It hashes a 16x16 grayscale thumbnail to choose
    deterministic candidate species, then synthesises a rank distribution. It is
    useful only for exercising the pipeline/UI without real weights. Every result
    is marked ``is_mock=True`` and the pipeline never awards discovery XP for it.

    Set ``CLASSIFIER_PROVIDER=dev_mock`` to use it. ``auto`` never falls back to
    this provider.
    """

    model_name = "Development Simulation Provider (NON-PRODUCTION)"
    model_version = "dev-mock-v2"
    model_license = "N/A"
    score_semantics = "simulated_rank_distribution"

    def __init__(self, species_ids: List[str]):
        self.species_ids = species_ids

    @property
    def is_available(self) -> bool:
        return bool(self.species_ids)

    @property
    def model_info(self):
        return {
            "name": self.model_name,
            "version": self.model_version,
            "license": self.model_license,
            "available": self.is_available,
            "is_mock": True,
            "warning": "Non-production simulation. Never awards discovery XP.",
        }

    async def predict(self, image: Image.Image) -> RawInferenceResult:
        thumb = image.resize((16, 16)).convert("L")
        pixels = list(thumb.tobytes())
        hash_val = int(hashlib.md5(bytes(pixels)).hexdigest()[:8], 16)

        primary_idx = hash_val % len(self.species_ids)
        secondary_idx = (primary_idx + 3) % len(self.species_ids)
        tertiary_idx = (primary_idx + 7) % len(self.species_ids)

        variance = (hash_val % 100) / 100.0
        avg_pixel = sum(pixels) / len(pixels)

        if avg_pixel < 12 or avg_pixel > 248:
            return RawInferenceResult(
                predictions=[],
                feline_detected=False,
                feline_evidence=0.0,
                non_feline_label="extreme low-contrast image",
                non_feline_score=0.92,
                score_semantics=self.score_semantics,
                is_mock=True,
                model_name=self.model_name,
                model_version=self.model_version,
                model_license=self.model_license,
                notes=[
                    "Development simulation only. The low-contrast branch is a fixed "
                    "test fixture, not a real content detector."
                ],
                diagnostics={"simulation": True},
            )

        if variance > 0.65:
            score1 = 0.72 + (variance * 0.15)
            score2 = (1.0 - score1) * 0.65
            score3 = 1.0 - score1 - score2
        elif variance > 0.25:
            score1 = 0.44 + (variance * 0.15)
            score2 = 0.32
            score3 = round(1.0 - score1 - score2, 3)
        else:
            score1 = 0.29
            score2 = 0.26
            score3 = 0.22

        predictions = [
            RawPrediction(
                species_id=self.species_ids[primary_idx],
                label="Simulated candidate",
                score=round(score1, 3),
                is_felid=True,
                model_label="simulation",
                rationale="Simulated rank from a pixel hash. Not AI inference.",
            ),
            RawPrediction(
                species_id=self.species_ids[secondary_idx],
                label="Simulated candidate",
                score=round(score2, 3),
                is_felid=True,
                model_label="simulation",
                rationale="Simulated rank from a pixel hash. Not AI inference.",
            ),
            RawPrediction(
                species_id=self.species_ids[tertiary_idx],
                label="Simulated candidate",
                score=round(max(score3, 0.05), 3),
                is_felid=True,
                model_label="simulation",
                rationale="Simulated rank from a pixel hash. Not AI inference.",
            ),
        ]

        return RawInferenceResult(
            predictions=predictions,
            feline_detected=True,
            feline_evidence=0.0,
            non_feline_label=None,
            non_feline_score=0.0,
            score_semantics=self.score_semantics,
            is_mock=True,
            model_name=self.model_name,
            model_version=self.model_version,
            model_license=self.model_license,
            notes=[
                "DEVELOPMENT SIMULATION: deterministic pixel hash, not a trained "
                "vision model. Results are isolated from production and award no XP."
            ],
            diagnostics={"simulation": True},
        )
