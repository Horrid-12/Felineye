from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from PIL import Image
from pydantic import BaseModel, Field


class RawPrediction(BaseModel):
    """One provider class candidate.

    ``species_id`` is set only when the provider can map a class to a catalog
    taxon unambiguously. ``label`` always carries the provider's own label.
    """

    species_id: Optional[str] = None
    label: str
    score: float
    is_felid: bool = False
    rationale: Optional[str] = None
    model_label: Optional[str] = None


class RawInferenceResult(BaseModel):
    predictions: List[RawPrediction] = Field(default_factory=list)
    feline_detected: bool = False
    #: Best feline score minus best non-feline score (provider-specific units).
    feline_evidence: float = 0.0
    non_feline_label: Optional[str] = None
    non_feline_score: float = 0.0
    #: True when the primary model and the independent gate disagree about
    #: whether the image contains a feline. The pipeline abstains.
    content_conflict: bool = False
    score_semantics: str = "unknown"
    is_mock: bool = False
    model_name: str = "unknown"
    model_version: str = ""
    model_license: str = ""
    notes: List[str] = Field(default_factory=list)
    diagnostics: Dict[str, Any] = Field(default_factory=dict)


class BaseClassifier(ABC):
    """Replaceable identification-provider interface."""

    @property
    def is_available(self) -> bool:
        return True

    @property
    def model_info(self) -> Dict[str, Any]:
        return {
            "name": getattr(self, "model_name", "unknown"),
            "version": getattr(self, "model_version", ""),
            "license": getattr(self, "model_license", ""),
        }

    @abstractmethod
    async def predict(self, image: Image.Image) -> RawInferenceResult:
        """Run inference on a validated PIL RGB image."""
