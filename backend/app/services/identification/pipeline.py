from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional

from PIL import Image

from ...config import settings
from ...models.identification import (
    CandidatePrediction,
    IdentificationResult,
    IdentificationStatus,
)
from ..species_service import species_service
from .base import BaseClassifier, RawInferenceResult, RawPrediction
from .bioclip_classifier import MODEL_SETUP_HINT, BioClipClassifier
from .dev_provider import DevelopmentMockClassifier
from .imagenet_gate import ImageNetFelineGate
from .policy import (
    DOMESTIC_SPECIES_ID,
    LYNX_SPECIES_IDS,
    decide_status,
)
from .quality import assess_image_quality

logger = logging.getLogger(__name__)


class UnavailableClassifier(BaseClassifier):
    """Explicit unavailable state. Never fabricates predictions."""

    model_name = "No real identification model installed"
    model_version = "unavailable"
    model_license = ""

    def __init__(self, reason: str):
        self.reason = reason

    @property
    def is_available(self) -> bool:
        return False

    @property
    def model_info(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "version": self.model_version,
            "license": self.model_license,
            "available": False,
            "error": self.reason,
        }

    async def predict(self, image: Image.Image) -> RawInferenceResult:
        raise RuntimeError(self.reason)


class ImageNetOnlyClassifier(BaseClassifier):
    """Fallback real provider with the small ImageNet gate.

    It can recognise domestic cats and the big cats present in ImageNet, and it
    is honest about the rest. BioCLIP is preferred whenever installed.
    """

    def __init__(self, gate: ImageNetFelineGate):
        self.gate = gate
        self.model_name = "MobileNetV2-12 ImageNet classifier"
        self.model_version = gate.model_version
        self.model_license = gate.model_license

    @property
    def is_available(self) -> bool:
        return self.gate.is_available

    @property
    def model_info(self) -> Dict[str, Any]:
        info = self.gate.model_info
        info["fallback"] = True
        info["limitations"] = (
            "ImageNet only covers domestic cats and a small set of big cats; "
            "small wildcats are not supported."
        )
        return info

    async def predict(self, image: Image.Image) -> RawInferenceResult:
        gate_result = await self.gate.predict(image)
        predictions: List[RawPrediction] = []
        for prediction in gate_result.predictions:
            if prediction.model_label == "lynx":
                # ImageNet's lynx class is genus-level. Expand it to the catalog
                # species so the policy can abstain transparently.
                for species_id in sorted(LYNX_SPECIES_IDS):
                    predictions.append(
                        RawPrediction(
                            species_id=species_id,
                            label="Lynx species complex",
                            score=prediction.score,
                            is_felid=True,
                            model_label="lynx",
                            rationale=(
                                "ImageNet 'lynx' is a genus-level class; it cannot "
                                "separate Eurasian lynx, Canada lynx, Iberian lynx, or bobcat."
                            ),
                        )
                    )
                continue
            if prediction.species_id:
                predictions.append(prediction)

        notes = [
            "ImageNet softmax scores are class probabilities for 1000 generic classes, "
            "not calibrated feline species probabilities.",
            "Only domestic cats and ImageNet big-cat classes are supported by this fallback.",
        ]
        notes.extend(gate_result.notes)
        return RawInferenceResult(
            predictions=sorted(predictions, key=lambda p: p.score, reverse=True),
            feline_detected=gate_result.feline_detected,
            feline_evidence=gate_result.feline_evidence,
            non_feline_label=gate_result.non_feline_label,
            non_feline_score=gate_result.non_feline_probability,
            score_semantics="imagenet_softmax_class_score",
            is_mock=False,
            model_name=self.model_name,
            model_version=self.model_version,
            model_license=self.model_license,
            notes=notes,
            diagnostics={"imagenet_gate": gate_result.model_dump()},
        )


class IdentificationPipeline:
    def __init__(self, classifier: Optional[BaseClassifier] = None):
        self._classifier: BaseClassifier = UnavailableClassifier("not initialised")
        self._provider_kind = "unavailable"
        self._init_note: Optional[str] = None
        if classifier is not None:
            # Test/integration seam: inject a provider without loading real
            # weights. Production always goes through _initialize_provider().
            self._classifier = classifier
            self._provider_kind = "injected"
        else:
            self._initialize_provider()

    # ------------------------------------------------------------------
    # Provider selection
    # ------------------------------------------------------------------
    def _initialize_provider(self) -> None:
        preference = (settings.classifier_provider or "auto").strip().lower()
        if preference not in {"auto", "bioclip", "imagenet", "consensus", "dev_mock"}:
            self._classifier = UnavailableClassifier(
                f"Unknown CLASSIFIER_PROVIDER='{settings.classifier_provider}'. "
                "Use auto, bioclip, imagenet, consensus, or dev_mock."
            )
            self._provider_kind = "unavailable"
            return

        if preference == "dev_mock":
            species_ids = [record["id"] for record in species_service._species_list]
            self._classifier = DevelopmentMockClassifier(species_ids=species_ids)
            self._provider_kind = "development_mock"
            self._init_note = (
                "Development simulation is explicitly enabled. It is non-production "
                "and can never award discovery XP."
            )
            logger.warning(self._init_note)
            return

        gate: Optional[ImageNetFelineGate] = None
        if settings.feline_gate_enabled:
            gate = ImageNetFelineGate(
                settings.imagenet_model_path, settings.imagenet_labels_path
            )
            if not gate.is_available:
                logger.info("ImageNet feline gate unavailable: %s", gate.load_error)
                gate = None

        if preference in {"auto", "bioclip", "consensus"}:
            bioclip = BioClipClassifier(
                settings.bioclip_model_path,
                settings.bioclip_text_embeddings_path,
                gate=gate,
            )
            if bioclip.is_available:
                self._classifier = bioclip
                self._provider_kind = "bioclip"
                if gate is None and preference == "consensus":
                    # BioCLIP-only consensus is not a consensus. Keep the
                    # provider honest instead of pretending.
                    self._classifier = UnavailableClassifier(
                        "CLASSIFIER_PROVIDER=consensus requires both BioCLIP and the "
                        f"ImageNet gate. {MODEL_SETUP_HINT}"
                    )
                    self._provider_kind = "unavailable"
                return
            if preference in {"bioclip", "consensus"}:
                self._classifier = UnavailableClassifier(
                    f"{bioclip.load_error or 'BioCLIP is unavailable'}. {MODEL_SETUP_HINT}"
                )
                self._provider_kind = "unavailable"
                return
            logger.info("BioCLIP unavailable: %s", bioclip.load_error)

        if preference in {"auto", "imagenet"}:
            if gate is None:
                gate = ImageNetFelineGate(
                    settings.imagenet_model_path, settings.imagenet_labels_path
                )
            if gate.is_available:
                self._classifier = ImageNetOnlyClassifier(gate)
                self._provider_kind = "imagenet"
                logger.warning(
                    "Using ImageNet-only fallback. Small wildcats are not supported."
                )
                return
            if preference == "imagenet":
                self._classifier = UnavailableClassifier(
                    f"{gate.load_error or 'ImageNet model is unavailable'}. {MODEL_SETUP_HINT}"
                )
                self._provider_kind = "unavailable"
                return

        self._classifier = UnavailableClassifier(
            "No real identification model is installed. "
            f"{MODEL_SETUP_HINT}"
        )
        self._provider_kind = "unavailable"

    # ------------------------------------------------------------------
    # Provider diagnostics
    # ------------------------------------------------------------------
    @property
    def active_provider_name(self) -> str:
        return self._classifier.model_name

    @property
    def is_mock_active(self) -> bool:
        return isinstance(self._classifier, DevelopmentMockClassifier)

    @property
    def is_ready(self) -> bool:
        return bool(self._classifier.is_available)

    @property
    def provider_kind(self) -> str:
        return self._provider_kind

    @property
    def model_info(self) -> Dict[str, Any]:
        info = self._classifier.model_info
        info["provider_kind"] = self._provider_kind
        info["init_note"] = self._init_note
        return info

    @property
    def capabilities(self) -> Dict[str, Any]:
        # Derive from the active classifier rather than the selection label so
        # an injected provider (tests, integrations) reports the truth too.
        is_bioclip = isinstance(self._classifier, BioClipClassifier)
        is_imagenet = isinstance(self._classifier, ImageNetOnlyClassifier)
        gate_installed = is_imagenet or bool(
            is_bioclip and getattr(self._classifier, "gate", None) is not None
            and self._classifier.gate.is_available  # type: ignore[union-attr]
        )
        return {
            "supports_wild_species": is_bioclip,
            "supports_domestic_cat": is_bioclip or is_imagenet,
            "supports_domestic_breed": False,
            "supports_hybrids": False,
            "non_feline_gate": "imagenet" if gate_installed else None,
            "discovery_eligible": not self.is_mock_active and self.is_ready,
            "score_semantics": getattr(
                self._classifier, "score_semantics", "model_score_not_calibrated"
            ),
        }

    # ------------------------------------------------------------------
    # Identification
    # ------------------------------------------------------------------
    def _enrich_candidates(
        self, raw_result: RawInferenceResult
    ) -> List[CandidatePrediction]:
        by_species: Dict[str, CandidatePrediction] = {}
        for prediction in raw_result.predictions:
            if not prediction.species_id:
                continue
            record = species_service.get_taxon_record(prediction.species_id)
            if not record:
                continue
            if record.get("category") == "hybrid":
                continue

            raw_category = record.get("category", "wild_species")
            species_id = record["id"]
            category = raw_category
            rationale = prediction.rationale

            # Breed calls are downgraded to the domestic species. A single
            # photograph cannot establish breed ancestry with this model.
            if raw_category == "domestic_breed":
                domestic = species_service.get_by_slug(DOMESTIC_SPECIES_ID)
                if not domestic:
                    continue
                species_id = domestic.id
                category = "domestic_species"
                rationale = (
                    "A breed-level visual cue was noted, but breed identity is not "
                    "asserted from a single photograph. Reported as the domestic cat "
                    "(Felis catus) at species level."
                )
                record = species_service.get_taxon_record(DOMESTIC_SPECIES_ID) or record

            conservation_status = record.get("conservation_status") or (
                "DOMESTIC" if category == "domestic_species" else "UNKNOWN"
            )
            candidate = CandidatePrediction(
                species_id=species_id,
                common_name=record["common_name"],
                scientific_name=record["scientific_name"],
                confidence_score=min(max(float(prediction.score), 0.0), 1.0),
                score_percentage=int(round(min(max(float(prediction.score), 0.0), 1.0) * 100)),
                is_wild=record.get("is_wild", category == "wild_species"),
                conservation_status=conservation_status,
                thumbnail_url=record.get("thumbnail_url") or record.get("image_url") or "",
                category=category,
                rationale=rationale,
                xp_reward=int(record.get("xp_reward", 0)),
                score_semantics=raw_result.score_semantics,
                model_label=prediction.model_label or prediction.label,
            )

            existing = by_species.get(species_id)
            if existing is None or candidate.confidence_score > existing.confidence_score:
                by_species[species_id] = candidate

        return sorted(
            by_species.values(),
            key=lambda candidate: candidate.confidence_score,
            reverse=True,
        )

    @staticmethod
    def _quality_note(quality: Dict[str, Any]) -> str:
        flags = ", ".join(quality.get("flags", [])) or "unspecified degradation"
        return (
            "Image quality is too low for a reliable species call "
            f"({flags}). The model was allowed to abstain instead of guessing."
        )

    async def identify(
        self, image: Image.Image, image_metadata: Dict[str, Any]
    ) -> IdentificationResult:
        start_time = time.perf_counter()
        quality = assess_image_quality(image)
        metadata = dict(image_metadata or {})
        metadata["quality"] = quality

        if not self._classifier.is_available:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            reason = self._classifier.model_info.get("error") or "No real model is available."
            return IdentificationResult(
                status=IdentificationStatus.MODEL_UNAVAILABLE,
                model_name=self._classifier.model_name,
                model_version=self._classifier.model_version,
                model_license=self._classifier.model_license,
                model_setup_hint=MODEL_SETUP_HINT,
                uncertainty_note=reason,
                processing_time_ms=elapsed_ms,
                image_metadata=metadata,
                quality=quality,
                disclaimer=(
                    "No identification was performed. FelidLens does not fall back to fake "
                    "predictions when the real model is unavailable."
                ),
            )

        try:
            raw_result = await self._classifier.predict(image)
        except Exception as exc:
            logger.error("Classifier execution error: %s", exc, exc_info=True)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return IdentificationResult(
                status=IdentificationStatus.PROCESSING_ERROR,
                model_name=self._classifier.model_name,
                model_version=self._classifier.model_version,
                model_license=self._classifier.model_license,
                uncertainty_note=(
                    "The inference provider encountered an unexpected execution error. "
                    "No prediction or discovery XP was produced."
                ),
                processing_time_ms=elapsed_ms,
                image_metadata=metadata,
                quality=quality,
            )

        candidates = self._enrich_candidates(raw_result)
        common = dict(
            score_semantics=raw_result.score_semantics,
            is_mock=raw_result.is_mock,
            model_name=raw_result.model_name,
            model_version=raw_result.model_version,
            model_license=raw_result.model_license,
            feline_evidence=raw_result.feline_evidence,
            feline_gate=raw_result.diagnostics.get("imagenet_gate"),
            is_calibrated=False,
            entropy=None,
            image_metadata=metadata,
            quality=quality,
        )

        # Content conflict or a genuine non-feline result never produces a
        # discovery, even if a low-ranked cat class exists.
        if raw_result.content_conflict:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return IdentificationResult(
                status=IdentificationStatus.UNABLE_TO_IDENTIFY,
                candidates=candidates[:4],
                uncertainty_note=(
                    "The primary species model and the independent feline gate disagree "
                    "about the image content. The result is abstained instead of forcing "
                    "a species prediction."
                ),
                processing_time_ms=elapsed_ms,
                **common,
            )

        if not raw_result.feline_detected:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return IdentificationResult(
                status=IdentificationStatus.NON_FELINE_DETECTED,
                candidates=[],
                uncertainty_note=(
                    "No feline content was detected with sufficient evidence. "
                    "The image was not matched to a species."
                ),
                processing_time_ms=elapsed_ms,
                **common,
            )

        if not candidates:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return IdentificationResult(
                status=IdentificationStatus.UNABLE_TO_IDENTIFY,
                candidates=[],
                uncertainty_note=(
                    "Feline content was detected, but the model's candidate classes could "
                    "not be mapped to recognized Felidae taxonomy records."
                ),
                processing_time_ms=elapsed_ms,
                **common,
            )

        top_candidate = candidates[0]
        second_candidate = candidates[1] if len(candidates) > 1 else None
        status, status_note = decide_status(
            top_candidate, second_candidate, is_mock=raw_result.is_mock
        )

        uncertainty_note = status_note
        if quality.get("low_quality") and status in {
            IdentificationStatus.IDENTIFIED_WILD_SPECIES,
            IdentificationStatus.IDENTIFIED_DOMESTIC_CAT,
            IdentificationStatus.IDENTIFIED_DOMESTIC_BREED,
        }:
            status = IdentificationStatus.UNABLE_TO_IDENTIFY
            uncertainty_note = self._quality_note(quality)

        if status == IdentificationStatus.UNABLE_TO_IDENTIFY and not uncertainty_note:
            uncertainty_note = (
                "Evidence was insufficient or conflicting. The closest candidates are "
                "listed for comparison; no species is asserted."
            )

        is_eligible = status in {
            IdentificationStatus.IDENTIFIED_WILD_SPECIES,
            IdentificationStatus.IDENTIFIED_DOMESTIC_CAT,
        } and not raw_result.is_mock

        xp_reward = top_candidate.xp_reward if is_eligible else 0

        # For an abstention, do not expose a "top" result. Candidates remain
        # visible as alternatives for the user to inspect.
        output_top = (
            top_candidate
            if status
            in {
                IdentificationStatus.IDENTIFIED_WILD_SPECIES,
                IdentificationStatus.IDENTIFIED_DOMESTIC_CAT,
                IdentificationStatus.IDENTIFIED_DOMESTIC_BREED,
                IdentificationStatus.DEVELOPMENT_SIMULATION,
            }
            else None
        )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return IdentificationResult(
            status=status,
            top_candidate=output_top,
            candidates=candidates[:4],
            is_discovery_eligible=is_eligible,
            xp_reward=xp_reward,
            image_fingerprint=metadata.get("image_fingerprint"),
            uncertainty_note=uncertainty_note,
            processing_time_ms=elapsed_ms,
            **common,
        )


# Global singleton pipeline instance
pipeline = IdentificationPipeline()
