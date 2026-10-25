"""Independent feline/non-feline gate backed by an ImageNet classifier.

BioCLIP is the primary species ranker. This small MobileNetV2 ImageNet model is
used as an independent content check: a candidate feline result must also look
like a feline to a second, differently trained model. When the gate is not
installed, the pipeline falls back to BioCLIP's own non-feline prompt margin and
says so in the result diagnostics.

Model: MobileNetV2-12 (ONNX Model Zoo), Apache-2.0.
Input: 1x3x224x224 RGB, ImageNet mean/std. Output: 1000 ImageNet logits.
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from PIL import Image
from pydantic import BaseModel, Field

from .base import RawPrediction

logger = logging.getLogger(__name__)

# ImageNet-1k classes that are cats. ``tiger cat`` is a domestic tabby coat
# class, not Panthera tigris; it is mapped to the domestic cat.
FELINE_IMAGENET_LABELS = {
    "tabby",
    "tiger cat",
    "Persian cat",
    "Siamese cat",
    "Egyptian cat",
    "cougar",
    "lynx",
    "leopard",
    "snow leopard",
    "jaguar",
    "lion",
    "tiger",
    "cheetah",
}

DOMESTIC_IMAGENET_LABELS = {
    "tabby",
    "tiger cat",
    "Persian cat",
    "Siamese cat",
    "Egyptian cat",
}

# ImageNet class -> catalog taxon. ``lynx`` is intentionally omitted because
# ImageNet cannot distinguish Eurasian lynx, Canada lynx, Iberian lynx, and
# bobcat; the gate does not make species claims.
IMAGENET_SPECIES_MAP: Dict[str, str] = {
    "tabby": "felis-catus",
    "tiger cat": "felis-catus",
    "Persian cat": "felis-catus",
    "Siamese cat": "felis-catus",
    "Egyptian cat": "felis-catus",
    "cougar": "puma-concolor",
    "leopard": "panthera-pardus",
    "snow leopard": "panthera-uncia",
    "jaguar": "panthera-onca",
    "lion": "panthera-leo",
    "tiger": "panthera-tigris",
    "cheetah": "acinonyx-jubatus",
}

_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class GateResult(BaseModel):
    feline_detected: bool
    feline_probability: float
    top_label: str
    top_probability: float
    non_feline_label: str = ""
    non_feline_probability: float = 0.0
    feline_evidence: float = 0.0
    predictions: List[RawPrediction] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)


class ImageNetFelineGate:
    model_name = "MobileNetV2-12 ImageNet gate"
    model_version = "onnx-model-zoo/mobilenetv2-12"
    model_license = "Apache-2.0"

    def __init__(self, model_path: str, labels_path: str):
        self.model_path = Path(model_path)
        self.labels_path = Path(labels_path)
        self.session = None
        self.labels: List[str] = []
        self._feline_indices: List[int] = []
        self._load_error: Optional[str] = None
        self._initialize()

    def _initialize(self) -> None:
        if not self.model_path.exists():
            self._load_error = f"ImageNet gate weights not found at {self.model_path}"
            logger.info(self._load_error)
            return
        if not self.labels_path.exists():
            self._load_error = f"ImageNet labels not found at {self.labels_path}"
            logger.info(self._load_error)
            return
        try:
            import onnxruntime as ort

            self.session = ort.InferenceSession(
                str(self.model_path), providers=["CPUExecutionProvider"]
            )
            self.labels = [
                line.strip()
                for line in self.labels_path.read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
            if len(self.labels) != 1000:
                raise ValueError(
                    f"Expected 1000 ImageNet labels, found {len(self.labels)} in {self.labels_path}"
                )
            self._feline_indices = [
                idx for idx, label in enumerate(self.labels) if label in FELINE_IMAGENET_LABELS
            ]
            if not self._feline_indices:
                raise ValueError("No feline ImageNet labels matched the installed label file")
            logger.info(
                "ImageNet feline gate loaded (%d feline classes) from %s",
                len(self._feline_indices),
                self.model_path,
            )
        except Exception as exc:  # pragma: no cover - environment dependent
            self.session = None
            self._load_error = f"Failed to initialise ImageNet gate: {exc}"
            logger.error(self._load_error, exc_info=True)

    @property
    def is_available(self) -> bool:
        return self.session is not None

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    @property
    def model_info(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "version": self.model_version,
            "license": self.model_license,
            "available": self.is_available,
            "path": str(self.model_path),
            "error": self._load_error,
        }

    @staticmethod
    def _preprocess(image: Image.Image) -> np.ndarray:
        resized = image.resize((224, 224), Image.Resampling.BILINEAR)
        arr = np.asarray(resized, dtype=np.float32) / 255.0
        arr = (arr - _MEAN) / _STD
        return np.transpose(arr, (2, 0, 1))[None, ...]

    def predict_sync(self, image: Image.Image) -> GateResult:
        if not self.is_available:
            raise RuntimeError(self._load_error or "ImageNet gate is unavailable")

        logits = self.session.run(None, {"input": self._preprocess(image)})[0][0]
        shifted = logits - np.max(logits)
        probabilities = np.exp(shifted) / np.sum(np.exp(shifted))

        top_idx = int(np.argmax(probabilities))
        top_label = self.labels[top_idx]
        top_probability = float(probabilities[top_idx])

        feline_probability = float(np.sum(probabilities[self._feline_indices]))
        non_feline_mask = np.ones(len(probabilities), dtype=bool)
        non_feline_mask[self._feline_indices] = False
        non_feline_idx = int(np.argmax(np.where(non_feline_mask, probabilities, -1.0)))
        non_feline_label = self.labels[non_feline_idx]
        non_feline_probability = float(probabilities[non_feline_idx])

        if top_label in FELINE_IMAGENET_LABELS:
            feline_detected = True
        else:
            # A non-feline top class can still be a cat-like object or an
            # unusual cat photograph. Treat substantial aggregate feline mass
            # as "possibly feline"; the pipeline will abstain on disagreement
            # with BioCLIP rather than claim a species.
            feline_detected = feline_probability >= 0.20

        order = np.argsort(probabilities)[::-1][:8]
        predictions = []
        for idx in order:
            label = self.labels[int(idx)]
            mapped = IMAGENET_SPECIES_MAP.get(label)
            predictions.append(
                RawPrediction(
                    species_id=mapped,
                    label=label,
                    score=round(float(probabilities[int(idx)]), 6),
                    is_felid=label in FELINE_IMAGENET_LABELS,
                    model_label=label,
                )
            )

        notes = []
        if top_label in DOMESTIC_IMAGENET_LABELS:
            notes.append(
                "ImageNet domestic-cat class detected; this is species-level evidence, not a breed call."
            )
        if top_label == "lynx":
            notes.append(
                "ImageNet 'lynx' is a genus-level class and cannot distinguish lynx species."
            )

        return GateResult(
            feline_detected=feline_detected,
            feline_probability=round(feline_probability, 6),
            top_label=top_label,
            top_probability=round(top_probability, 6),
            non_feline_label=non_feline_label,
            non_feline_probability=round(non_feline_probability, 6),
            feline_evidence=round(feline_probability - non_feline_probability, 6),
            predictions=predictions,
            notes=notes,
        )

    async def predict(self, image: Image.Image) -> GateResult:
        return await asyncio.to_thread(self.predict_sync, image)
