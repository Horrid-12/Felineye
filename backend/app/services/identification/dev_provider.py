import hashlib
from typing import List
from PIL import Image
from .base import BaseClassifier, RawPrediction, RawInferenceResult

class DevelopmentMockClassifier(BaseClassifier):
    """
    Clearly-marked development-only simulation provider.
    Computes a deterministic perceptual hash of the image content to return consistent,
    ranked feline candidate species without claiming authentic AI identification.
    Always flags is_mock=True in inference results.
    """
    def __init__(self, species_ids: List[str]):
        self.species_ids = species_ids
        self.non_felid_triggers = ["dog", "canine", "landscape", "car", "building"]

    async def predict(self, image: Image.Image) -> RawInferenceResult:
        # Generate perceptual thumb hash for deterministic, reproducible simulation
        thumb = image.resize((16, 16)).convert("L")
        pixels = list(thumb.tobytes())
        hash_val = int(hashlib.md5(bytes(pixels)).hexdigest()[:8], 16)

        # Use hash to select primary and secondary species
        primary_idx = hash_val % len(self.species_ids)
        secondary_idx = (primary_idx + 3) % len(self.species_ids)
        tertiary_idx = (primary_idx + 7) % len(self.species_ids)

        # Variance factor
        variance = (hash_val % 100) / 100.0

        # Simulate out-of-domain condition for specific pixel color patterns (e.g. extremely dark or monochrome)
        avg_pixel = sum(pixels) / len(pixels)
        if avg_pixel < 12 or avg_pixel > 248:
            return RawInferenceResult(
                predictions=[
                    RawPrediction(
                        species_id="out_of_domain",
                        score=0.92,
                        is_felid=False,
                        rationale="Image exhibits extreme low contrast or non-biological feature profile."
                    )
                ],
                score_semantics="simulation_heuristic",
                is_mock=True,
                model_name="DevSimulationProvider-v1.0 (Mock)"
            )

        # Realistic confidence distribution
        if variance > 0.65:
            score1 = 0.72 + (variance * 0.15)
            score2 = (1.0 - score1) * 0.65
            score3 = (1.0 - score1 - score2)
        elif variance > 0.25:
            score1 = 0.44 + (variance * 0.15)
            score2 = 0.32
            score3 = round(1.0 - score1 - score2, 3)
        else:
            # Low confidence / uncertain profile
            score1 = 0.29
            score2 = 0.26
            score3 = 0.22

        predictions = [
            RawPrediction(
                species_id=self.species_ids[primary_idx],
                score=round(score1, 3),
                is_felid=True,
                rationale="Matched primary rosette and skull morphology profile in development simulation."
            ),
            RawPrediction(
                species_id=self.species_ids[secondary_idx],
                score=round(score2, 3),
                is_felid=True,
                rationale="Secondary similarity in coat coloration and habitat silhouette."
            ),
            RawPrediction(
                species_id=self.species_ids[tertiary_idx],
                score=round(max(score3, 0.05), 3),
                is_felid=True,
                rationale="Candidate match under low-light or partial-body occlusion."
            )
        ]

        return RawInferenceResult(
            predictions=predictions,
            score_semantics="simulated_rank_distribution",
            is_mock=True,
            model_name="DevSimulationProvider-v1.0 (Non-Production Mock)"
        )
