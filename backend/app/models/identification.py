from typing import Any, Dict, List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class IdentificationStatus(str, Enum):
    """Explicit, mutually exclusive outcomes of the identification pipeline."""

    IDENTIFIED_WILD_SPECIES = "identified_wild_species"
    IDENTIFIED_DOMESTIC_CAT = "identified_domestic_cat"
    IDENTIFIED_DOMESTIC_BREED = "identified_domestic_breed"
    NON_FELINE_DETECTED = "non_feline_detected"
    UNABLE_TO_IDENTIFY = "unable_to_identify"
    MODEL_UNAVAILABLE = "model_unavailable"
    PROCESSING_ERROR = "processing_error"
    DEVELOPMENT_SIMULATION = "development_simulation"


class CandidatePrediction(BaseModel):
    species_id: str
    common_name: str
    scientific_name: str
    #: Provider score. For BioCLIP this is a cosine similarity, not a probability.
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    score_percentage: int = Field(..., ge=0, le=100)
    is_wild: bool
    conservation_status: str
    thumbnail_url: str
    category: str = Field(
        default="wild_species",
        description="wild_species, domestic_species, or domestic_breed. Hybrids are not classifiable.",
    )
    rationale: Optional[str] = None
    #: Catalog reward, only paid when the whole result is discovery-eligible.
    xp_reward: int = Field(default=0, ge=0)
    #: Human-readable description of what confidence_score means.
    score_semantics: str = "model_score_not_calibrated"
    #: Raw provider class/label, kept for diagnostics.
    model_label: Optional[str] = None


class BreedPrediction(BaseModel):
    """A *visual breed estimate* for an already-identified domestic cat.

    This is intentionally not a species prediction: the breed classifier can
    never change the species status, and breeds never award discovery XP.
    """

    breed_id: str
    common_name: str
    scientific_name: str = "Felis catus"
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    score_percentage: int = Field(..., ge=0, le=100)
    category: str = "domestic_breed"
    thumbnail_url: str = ""
    rationale: Optional[str] = None
    score_semantics: str = "breed_classifier_softmax"
    model_label: Optional[str] = None
    is_estimate: bool = True


class IdentificationResult(BaseModel):
    status: IdentificationStatus
    top_candidate: Optional[CandidatePrediction] = None
    candidates: List[CandidatePrediction] = Field(default_factory=list)
    breed: Optional[BreedPrediction] = Field(
        default=None,
        description=(
            "Visual breed estimate for a domestic cat. Null unless the dedicated "
            "breed classifier is confident and the top class is a curated breed."
        ),
    )
    breed_candidates: List[BreedPrediction] = Field(
        default_factory=list,
        description="Closest curated breed classes, shown for transparency.",
    )
    breed_note: Optional[str] = Field(
        default=None,
        description="Why a breed was or was not asserted. Never a pedigree claim.",
    )
    score_semantics: str = Field(
        default="model_score_not_calibrated",
        description=(
            "Mathematical meaning of the scores. BioCLIP returns image-text cosine "
            "similarity; it is not a calibrated probability."
        ),
    )
    is_mock: bool = Field(
        default=False,
        description="True only for the explicitly selected development simulation provider.",
    )
    is_calibrated: bool = Field(
        default=False,
        description="Always false unless a provider has been calibrated on representative validation data.",
    )
    is_discovery_eligible: bool = Field(
        default=False,
        description=(
            "Server-authoritative eligibility. True only for a real, successful "
            "wild-species or domestic-cat identification. Mock, uncertain, non-feline, "
            "breed, failed, and unavailable results are never eligible."
        ),
    )
    xp_reward: int = Field(
        default=0,
        description="XP to award for this result. Zero unless is_discovery_eligible is true.",
    )
    image_fingerprint: Optional[str] = Field(
        default=None,
        description="SHA-256 of the uploaded bytes, used by the client to make rewards idempotent.",
    )
    model_name: str = Field(default="unavailable")
    model_version: str = Field(default="")
    model_license: str = Field(default="")
    model_setup_hint: Optional[str] = None
    feline_evidence: Optional[float] = Field(
        default=None,
        description="Best feline similarity minus best non-feline similarity.",
    )
    feline_gate: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Independent ImageNet gate diagnostics, when the gate is installed.",
    )
    entropy: Optional[float] = Field(
        default=None,
        description="Only populated for providers that return a genuine probability distribution.",
    )
    uncertainty_note: Optional[str] = None
    processing_time_ms: float = 0.0
    image_metadata: Dict[str, Any] = Field(default_factory=dict)
    quality: Dict[str, Any] = Field(default_factory=dict)
    disclaimer: str = (
        "Model output is a ranked visual-similarity estimate, not a calibrated probability "
        "and not human verification. Do not use it as an authoritative scientific record."
    )
