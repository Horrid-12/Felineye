import math
import time
import logging
from typing import Dict, Any, Optional
from PIL import Image

from ...config import settings
from ...models.identification import (
    IdentificationResult,
    IdentificationStatus,
    CandidatePrediction
)
from ..species_service import species_service
from .base import BaseClassifier, RawInferenceResult
from .dev_provider import DevelopmentMockClassifier
from .onnx_classifier import OnnxClassifier

logger = logging.getLogger(__name__)

class IdentificationPipeline:
    def __init__(self):
        self._classifier: Optional[BaseClassifier] = None
        self._initialize_provider()

    def _initialize_provider(self):
        # Fetch list of known catalog IDs
        species_list = [s["id"] for s in species_service._species_list]
        
        provider_preference = settings.classifier_provider.lower()
        
        if provider_preference in ("onnx", "auto"):
            onnx_provider = OnnxClassifier(settings.model_path)
            if onnx_provider.is_available():
                self._classifier = onnx_provider
                logger.info("IdentificationPipeline using ONNX classifier provider.")
                return

        # Fallback to clearly marked development simulation provider
        self._classifier = DevelopmentMockClassifier(species_ids=species_list)
        logger.info("IdentificationPipeline initialized with DevelopmentMockClassifier.")

    @property
    def active_provider_name(self) -> str:
        if isinstance(self._classifier, OnnxClassifier) and self._classifier.is_available():
            return f"ONNX ({settings.model_path})"
        return "Development Simulation Provider (Mock)"

    @property
    def is_mock_active(self) -> bool:
        return isinstance(self._classifier, DevelopmentMockClassifier)

    def _calculate_entropy(self, scores: list[float]) -> float:
        """
        Calculates Shannon entropy to quantify model uncertainty/ambiguity.
        Higher entropy = flatter probability distribution = higher ambiguity.
        """
        valid_scores = [s for s in scores if s > 1e-6]
        total = sum(valid_scores)
        if total <= 0:
            return 0.0
        normalized = [s / total for s in valid_scores]
        entropy = -sum(p * math.log(p) for p in normalized)
        return round(entropy, 3)

    async def identify(self, image: Image.Image, image_metadata: Dict[str, Any]) -> IdentificationResult:
        start_time = time.perf_counter()

        try:
            raw_result: RawInferenceResult = await self._classifier.predict(image)
        except Exception as e:
            logger.error("Classifier execution error: %s", e, exc_info=True)
            return IdentificationResult(
                status=IdentificationStatus.MODEL_ERROR,
                uncertainty_note=f"Inference provider encountered an unexpected execution error: {str(e)}",
                is_mock=self.is_mock_active,
                processing_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                image_metadata=image_metadata
            )

        if not raw_result.predictions:
            return IdentificationResult(
                status=IdentificationStatus.UNCERTAIN,
                uncertainty_note="No candidate feline features could be detected in the provided image.",
                is_mock=raw_result.is_mock,
                processing_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                image_metadata=image_metadata
            )

        # Check for explicit out-of-domain / non-felid output
        top_raw = raw_result.predictions[0]
        if not top_raw.is_felid or top_raw.species_id in ("out_of_domain", "non_felid"):
            return IdentificationResult(
                status=IdentificationStatus.NON_FELID_DETECTED,
                top_candidate=None,
                candidates=[],
                score_semantics=raw_result.score_semantics,
                is_mock=raw_result.is_mock,
                uncertainty_note="No characteristic feline anatomy, facial structure, or coat patterns were identified.",
                processing_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                image_metadata=image_metadata
            )

        scores = [p.score for p in raw_result.predictions]
        entropy = self._calculate_entropy(scores)

        # Enrich predictions with curated species details
        enriched_candidates = []
        for p in raw_result.predictions:
            species_detail = species_service.get_by_slug(p.species_id)
            if not species_detail:
                continue

            percentage = int(round(p.score * 100))
            candidate = CandidatePrediction(
                species_id=species_detail.id,
                common_name=species_detail.common_name,
                scientific_name=species_detail.scientific_name,
                confidence_score=p.score,
                score_percentage=percentage,
                is_wild=species_detail.is_wild,
                conservation_status=species_detail.conservation_status,
                thumbnail_url=species_detail.thumbnail_url,
                rationale=p.rationale
            )
            enriched_candidates.append(candidate)

        if not enriched_candidates:
            return IdentificationResult(
                status=IdentificationStatus.UNCERTAIN,
                uncertainty_note="Predictions could not be matched to recognized Felidae taxonomy records.",
                is_mock=raw_result.is_mock,
                processing_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                image_metadata=image_metadata
            )

        top_candidate = enriched_candidates[0]

        # Determine calibrated status based on top score and entropy
        if top_candidate.confidence_score < settings.confidence_threshold:
            status = IdentificationStatus.UNCERTAIN
            uncertainty_note = (
                f"Candidate confidence ({top_candidate.score_percentage}%) is below the reliable identification threshold "
                f"({int(settings.confidence_threshold * 100)}%). Photographic angle, lighting, or partial obstruction may obscure diagnostic markers."
            )
        elif entropy > settings.uncertainty_entropy_threshold and len(enriched_candidates) > 1:
            status = IdentificationStatus.UNCERTAIN
            second = enriched_candidates[1]
            uncertainty_note = (
                f"High taxonomic ambiguity between {top_candidate.common_name} and {second.common_name}. "
                "The image contains shared morphology typical of closely related species."
            )
        elif top_candidate.confidence_score >= 0.60:
            status = IdentificationStatus.HIGH_CONFIDENCE
            uncertainty_note = None
        else:
            status = IdentificationStatus.MODERATE_CONFIDENCE
            uncertainty_note = "Moderate feature confidence; recommend comparing visual traits with similar species."

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return IdentificationResult(
            status=status,
            top_candidate=top_candidate,
            candidates=enriched_candidates[:4],
            score_semantics=raw_result.score_semantics,
            entropy=entropy,
            is_mock=raw_result.is_mock,
            uncertainty_note=uncertainty_note,
            processing_time_ms=elapsed_ms,
            image_metadata=image_metadata
        )

# Global singleton pipeline instance
pipeline = IdentificationPipeline()
