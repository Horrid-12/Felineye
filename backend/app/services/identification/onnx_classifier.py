import logging
import math
from pathlib import Path
from typing import List, Optional, Dict
import numpy as np
from PIL import Image
from .base import BaseClassifier, RawPrediction, RawInferenceResult

logger = logging.getLogger(__name__)

class OnnxClassifier(BaseClassifier):
    """
    ONNX Runtime inference provider for feline classification.
    Performs standard vision preprocessing, model execution, and softmax distribution ranking.
    """
    def __init__(self, model_path: str, species_index_map: Optional[Dict[int, str]] = None):
        self.model_path = Path(model_path)
        self.session = None
        self.species_index_map = species_index_map or {}
        self.input_name = None
        self.output_name = None
        self._initialize_session()

    def _initialize_session(self):
        if not self.model_path.exists():
            logger.info("ONNX model file not found at %s. ONNX provider will be marked unavailable.", self.model_path)
            return

        try:
            import onnxruntime as ort
            self.session = ort.InferenceSession(str(self.model_path), providers=["CPUExecutionProvider"])
            self.input_name = self.session.get_inputs()[0].name
            self.output_name = self.session.get_outputs()[0].name
            logger.info("ONNX InferenceSession loaded successfully from %s", self.model_path)
        except Exception as e:
            logger.error("Failed to initialize ONNX session from %s: %s", self.model_path, e)
            self.session = None

    def is_available(self) -> bool:
        return self.session is not None

    def _preprocess(self, image: Image.Image) -> np.ndarray:
        # Standard Vision pipeline: Resize 224x224, Normalize with ImageNet mean/std
        resized = image.resize((224, 224), Image.Resampling.BILINEAR)
        arr = np.array(resized).astype(np.float32) / 255.0  # HWC, [0, 1]

        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        normalized = (arr - mean) / std

        # Transpose HWC -> CHW and expand to NCHW
        transposed = np.transpose(normalized, (2, 0, 1))
        batched = np.expand_dims(transposed, axis=0)
        return batched

    async def predict(self, image: Image.Image) -> RawInferenceResult:
        if not self.is_available():
            raise RuntimeError("ONNX Classifier called but model session is not initialized.")

        tensor = self._preprocess(image)
        outputs = self.session.run([self.output_name], {self.input_name: tensor})
        logits = outputs[0][0]  # First batch item

        # Compute stable softmax
        exp_logits = np.exp(logits - np.max(logits))
        probabilities = exp_logits / np.sum(exp_logits)

        # Sort top indices
        top_indices = np.argsort(probabilities)[::-1][:5]

        predictions = []
        for idx in top_indices:
            score = float(probabilities[idx])
            mapped_species = self.species_index_map.get(int(idx), f"species_idx_{idx}")
            predictions.append(
                RawPrediction(
                    species_id=mapped_species,
                    score=round(score, 4),
                    is_felid=True,
                    rationale=f"Model output logit activation for class index {idx}."
                )
            )

        return RawInferenceResult(
            predictions=predictions,
            score_semantics="softmax_probability",
            is_mock=False,
            model_name=f"ONNX-{self.model_path.name}"
        )
