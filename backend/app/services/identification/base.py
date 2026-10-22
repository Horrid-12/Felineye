from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel
from PIL import Image

class RawPrediction(BaseModel):
    species_id: str
    score: float
    is_felid: bool = True
    rationale: Optional[str] = None

class RawInferenceResult(BaseModel):
    predictions: List[RawPrediction]
    score_semantics: str = "softmax_distribution"
    is_mock: bool = False
    model_name: str = "unknown"

class BaseClassifier(ABC):
    @abstractmethod
    async def predict(self, image: Image.Image) -> RawInferenceResult:
        """
        Takes a validated PIL RGB image and returns ranked raw predictions.
        """
        pass
