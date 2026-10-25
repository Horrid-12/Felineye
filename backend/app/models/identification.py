from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class IdentificationStatus(str, Enum):
    HIGH_CONFIDENCE = "high_confidence"
    MODERATE_CONFIDENCE = "moderate_confidence"
    UNCERTAIN = "uncertain"
    NON_FELID_DETECTED = "non_felid_detected"
    UNSUPPORTED_IMAGE = "unsupported_image"
    MODEL_ERROR = "model_error"

class CandidatePrediction(BaseModel):
    species_id: str
    common_name: str
    scientific_name: str
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

class IdentificationResult(BaseModel):
    status: IdentificationStatus
    top_candidate: Optional[CandidatePrediction] = None
    candidates: List[CandidatePrediction] = Field(default_factory=list)
    score_semantics: str = Field(
        default="softmax_confidence",
        description="Explanation of score mathematical semantics (e.g., normalized softmax distribution, cosine feature match)."
    )
    entropy: float = Field(default=0.0, description="Shannon entropy measuring ambiguity across predictions.")
    is_mock: bool = Field(default=False, description="Flag indicating if inference was produced by dev simulation rather than model.")
    uncertainty_note: Optional[str] = None
    processing_time_ms: float = 0.0
    image_metadata: Dict[str, Any] = Field(default_factory=dict)
    disclaimer: str = (
        "AI identifications are probabilistic estimates based on image features and should not be treated as authoritative scientific verification."
    )
