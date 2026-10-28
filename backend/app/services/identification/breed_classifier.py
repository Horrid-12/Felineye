"""Dedicated domestic-cat breed estimator.

This is deliberately separate from the BioCLIP species ranker. It only runs
after the species pipeline has already accepted a domestic cat, and its output
is a *visual breed estimate* -- never a pedigree claim, never a species
override, and never a discovery reward.

Model: ``dima806/cat_breed_image_detection`` (ViT-B/16 fine-tuned on 48 cat
classes, Apache-2.0). The class map in ``cat_breed_labels.json`` decides which
model classes are catalogue breeds, generic coat/type classes, or breeds outside
the curated CFA catalogue. Generic and unmapped classes are abstention classes,
not nearest-neighbour fallbacks.
"""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from PIL import Image
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

#: ImageNet-style ViT preprocessing used by the source model.
_MEAN = np.array([0.5, 0.5, 0.5], dtype=np.float32)
_STD = np.array([0.5, 0.5, 0.5], dtype=np.float32)
_INPUT_SIZE = 224

MODEL_SETUP_HINT = (
    "Install the breed classifier with: "
    "backend\\.venv\\Scripts\\python.exe backend\\scripts\\setup_identification_models.py --breed. "
    "See Documentation/Identification-Model.md."
)


class BreedScore(BaseModel):
    """One breed-classifier output, before catalogue enrichment."""

    label: str
    score: float = Field(..., ge=0.0, le=1.0)
    breed_id: Optional[str] = None
    #: breed | generic | unmapped
    kind: str = "unmapped"


class BreedInferenceResult(BaseModel):
    scores: List[BreedScore] = Field(default_factory=list)
    model_name: str = "Cat-breed classifier"
    model_version: str = ""
    model_license: str = ""
    score_semantics: str = "breed_classifier_softmax"
    diagnostics: Dict[str, Any] = Field(default_factory=dict)


class BreedClassifier:
    model_name = "ViT-B/16 cat-breed classifier"
    model_version = "dima806/cat_breed_image_detection"
    model_license = "Apache-2.0"
    score_semantics = "breed_classifier_softmax"

    def __init__(self, model_path: str, labels_path: str):
        self.model_path = Path(model_path)
        self.labels_path = Path(labels_path)
        self.session = None
        self.input_name = ""
        self.output_name = ""
        self.labels: List[Dict[str, Any]] = []
        self._load_error: Optional[str] = None
        self._initialize()

    def _initialize(self) -> None:
        if not self.model_path.exists():
            self._load_error = f"Breed classifier ONNX weights not found at {self.model_path}"
            logger.info(self._load_error)
            return
        if not self.labels_path.exists():
            self._load_error = f"Breed classifier labels not found at {self.labels_path}"
            logger.info(self._load_error)
            return

        try:
            import onnxruntime as ort

            self.session = ort.InferenceSession(
                str(self.model_path), providers=["CPUExecutionProvider"]
            )
            self.input_name = self.session.get_inputs()[0].name
            self.output_name = self.session.get_outputs()[0].name

            payload = json.loads(self.labels_path.read_text(encoding="utf-8"))
            labels = payload.get("labels", [])
            if not isinstance(labels, list) or not labels:
                raise ValueError("Breed label file contains no labels")

            ordered = sorted(labels, key=lambda item: int(item["index"]))
            expected = list(range(len(ordered)))
            if [int(item["index"]) for item in ordered] != expected:
                raise ValueError("Breed label indices are not contiguous from zero")

            for item in ordered:
                if item.get("kind") not in {"breed", "generic", "unmapped"}:
                    raise ValueError(f"Invalid breed label kind: {item.get('kind')!r}")
                if item["kind"] == "breed" and not item.get("breed_id"):
                    raise ValueError(f"Breed class {item.get('label')!r} has no breed_id")

            self.labels = ordered
            logger.info(
                "Cat-breed classifier loaded (%d classes, %d catalogue breeds) from %s",
                len(ordered),
                sum(1 for item in ordered if item["kind"] == "breed"),
                self.model_path,
            )
        except Exception as exc:  # pragma: no cover - environment dependent
            self.session = None
            self.labels = []
            self._load_error = f"Failed to initialise the breed classifier: {exc}"
            logger.error(self._load_error, exc_info=True)

    @property
    def is_available(self) -> bool:
        return self.session is not None and bool(self.labels)

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    @property
    def supported_breeds(self) -> List[str]:
        return sorted(
            {item["breed_id"] for item in self.labels if item["kind"] == "breed"}
        )

    @property
    def model_info(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "version": self.model_version,
            "license": self.model_license,
            "available": self.is_available,
            "path": str(self.model_path),
            "labels_path": str(self.labels_path),
            "error": self._load_error,
            "supported_breeds": len(self.supported_breeds),
            "score_semantics": self.score_semantics,
            "limitations": (
                "Breed output is a visual estimate, not pedigree verification. "
                "Generic coat/type classes and breeds outside the curated catalogue "
                "are abstention classes."
            ),
        }

    @staticmethod
    def _preprocess(image: Image.Image) -> np.ndarray:
        resized = image.resize((_INPUT_SIZE, _INPUT_SIZE), Image.Resampling.BICUBIC)
        arr = np.asarray(resized, dtype=np.float32) / 255.0
        arr = (arr - _MEAN) / _STD
        return np.transpose(arr, (2, 0, 1))[None, ...]

    def predict_sync(self, image: Image.Image) -> BreedInferenceResult:
        if not self.is_available:
            raise RuntimeError(self._load_error or "Breed classifier is unavailable")

        logits = self.session.run(
            [self.output_name], {self.input_name: self._preprocess(image)}
        )[0][0]
        logits = np.asarray(logits, dtype=np.float64)
        shifted = logits - logits.max()
        probabilities = np.exp(shifted)
        probabilities = probabilities / probabilities.sum()

        scores = [
            BreedScore(
                label=item["label"],
                score=round(float(probabilities[int(item["index"])]), 6),
                breed_id=item.get("breed_id"),
                kind=item["kind"],
            )
            for item in self.labels
        ]
        scores.sort(key=lambda item: item.score, reverse=True)

        return BreedInferenceResult(
            scores=scores,
            model_name=self.model_name,
            model_version=self.model_version,
            model_license=self.model_license,
            score_semantics=self.score_semantics,
            diagnostics={
                "classes": len(self.labels),
                "supported_breeds": len(self.supported_breeds),
                "top_label": scores[0].label if scores else None,
                "top_kind": scores[0].kind if scores else None,
            },
        )

    async def predict(self, image: Image.Image) -> BreedInferenceResult:
        return await asyncio.to_thread(self.predict_sync, image)
