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

        # Enrich predictions with curated taxon details. Hybrids are never classifiable targets.
        enriched_candidates = []
        for p in raw_result.predictions:
            record = species_service.get_taxon_record(p.species_id)
            if not record or record.get("category") == "hybrid":
                continue

            category = record.get("category", "wild_species")
            conservation_status = record.get("conservation_status") or (
                "DOMESTIC" if category == "domestic_breed" else "UNKNOWN"
            )
            candidate = CandidatePrediction(
                species_id=record["id"],
                common_name=record["common_name"],
                scientific_name=record["scientific_name"],
                confidence_score=p.score,
                score_percentage=int(round(p.score * 100)),
                is_wild=record.get("is_wild", category == "wild_species"),
                conservation_status=conservation_status,
                thumbnail_url=record.get("thumbnail_url") or record.get("image_url") or "",
                category=category,
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

        # Breed-level identification is never asserted from a single photo. If a provider ever
        # returns a breed, report the domestic cat species instead and keep the result uncertain.
        if top_candidate.category == "domestic_breed":
            domestic = species_service.get_by_slug("felis-catus")
            breed_names = [c.common_name for c in enriched_candidates if c.category == "domestic_breed"]
            if domestic:
                enriched_candidates = [
                    CandidatePrediction(
                        species_id=domestic.id,
                        common_name=domestic.common_name,
                        scientific_name=domestic.scientific_name,
                        confidence_score=top_candidate.confidence_score,
                        score_percentage=top_candidate.score_percentage,
                        is_wild=False,
                        conservation_status=domestic.conservation_status,
                        thumbnail_url=domestic.thumbnail_url,
                        category="domestic_species",
                        rationale=(
                            "Domestic cat detected. Breed-level features were noted but are not reliable "
                            "enough to assert a breed from this image."
                        ),
                    )
                ] + [c for c in enriched_candidates if c.category != "domestic_breed"]
                top_candidate = enriched_candidates[0]
            status = IdentificationStatus.UNCERTAIN
            uncertainty_note = (
                "Domestic cat (Felis catus) detected at species level. A single photograph is not sufficient "
                "to identify a breed"
                + (f"; possible breed cues included {', '.join(breed_names)}" if breed_names else "")
                + ". FelidLens does not assert breed identity from visual evidence alone."
            )
        # Determine calibrated status based on top score and entropy
        elif top_candidate.confidence_score < settings.confidence_threshold:
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

        # A species-level domestic cat result is valid, but breed ancestry remains unresolved.
        if top_candidate.category == "domestic_species" and status in (
            IdentificationStatus.HIGH_CONFIDENCE,
            IdentificationStatus.MODERATE_CONFIDENCE,
        ):
            uncertainty_note = (
                "Domestic cat (Felis catus) identified at species level. Breed or mixed-breed ancestry "
                "cannot be determined reliably from this image."
            )

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
