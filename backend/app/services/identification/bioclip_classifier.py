"""BioCLIP ViT-B/16 species ranker.

BioCLIP (imageomics/bioclip) is a CLIP model trained on TreeOfLife-10M for
general organismal biology. It is MIT licensed. The vision encoder is exported
to ONNX; the 41 catalog species plus non-feline prompts are pre-encoded into a
small text-embedding table so the runtime needs only onnxruntime/numpy/pillow.

The output is a cosine similarity ranking, NOT a calibrated probability. The
pipeline applies conservative abstention thresholds and an independent
ImageNet gate before accepting a species.
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from PIL import Image

from ...config import settings
from .base import BaseClassifier, RawInferenceResult, RawPrediction
from .imagenet_gate import ImageNetFelineGate

logger = logging.getLogger(__name__)

_CLIP_MEAN = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
_CLIP_STD = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)

MODEL_SETUP_HINT = (
    "Install the identification weights with: "
    "backend\\.venv\\Scripts\\python.exe backend\\scripts\\setup_identification_models.py --all. "
    "See Documentation/Identification-Model.md."
)


class BioClipClassifier(BaseClassifier):
    model_name = "BioCLIP ViT-B/16"
    model_version = "imageomics/bioclip"
    model_license = "MIT"
    score_semantics = "bioclip_image_text_cosine_similarity"

    def __init__(
        self,
        model_path: str,
        embeddings_path: str,
        gate: Optional[ImageNetFelineGate] = None,
    ):
        self.model_path = Path(model_path)
        self.embeddings_path = Path(embeddings_path)
        self.gate = gate
        self.session = None
        self.input_name = ""
        self.output_name = ""
        self.embeddings: Optional[np.ndarray] = None
        self.labels: List[str] = []
        self.common_names: List[str] = []
        self.scientific_names: List[str] = []
        self.non_feline: Optional[np.ndarray] = None
        self._load_error: Optional[str] = None
        self._initialize()

    def _initialize(self) -> None:
        if not self.model_path.exists():
            self._load_error = f"BioCLIP ONNX weights not found at {self.model_path}"
            logger.info(self._load_error)
            return
        if not self.embeddings_path.exists():
            self._load_error = f"BioCLIP text embeddings not found at {self.embeddings_path}"
            logger.info(self._load_error)
            return
        try:
            import onnxruntime as ort

            self.session = ort.InferenceSession(
                str(self.model_path), providers=["CPUExecutionProvider"]
            )
            self.input_name = self.session.get_inputs()[0].name
            self.output_name = self.session.get_outputs()[0].name

            with np.load(self.embeddings_path, allow_pickle=True) as data:
                embeddings = np.asarray(data["embeddings"], dtype=np.float32)
                labels = [str(value) for value in data["labels"]]
                common_names = [str(value) for value in data["common_names"]]
                scientific_names = [str(value) for value in data["scientific_names"]]
                non_feline = np.asarray(data["non_feline"], dtype=bool)

            if embeddings.ndim != 2 or embeddings.shape[0] != len(labels):
                raise ValueError(
                    f"Invalid BioCLIP embeddings shape {embeddings.shape} for {len(labels)} labels"
                )
            if not np.allclose(np.linalg.norm(embeddings, axis=1), 1.0, atol=1e-3):
                embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)

            self.embeddings = embeddings
            self.labels = labels
            self.common_names = common_names
            self.scientific_names = scientific_names
            self.non_feline = non_feline
            logger.info(
                "BioCLIP species ranker loaded (%d prompts, %d species) from %s",
                len(labels),
                int((~non_feline).sum()),
                self.model_path,
            )
        except Exception as exc:  # pragma: no cover - environment dependent
            self.session = None
            self.embeddings = None
            self._load_error = f"Failed to initialise BioCLIP: {exc}"
            logger.error(self._load_error, exc_info=True)

    @property
    def is_available(self) -> bool:
        return self.session is not None and self.embeddings is not None

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
            "embeddings_path": str(self.embeddings_path),
            "error": self._load_error,
            "supported_species": int((~self.non_feline).sum()) if self.non_feline is not None else 0,
            "score_semantics": self.score_semantics,
            "gate": self.gate.model_info if self.gate else None,
        }

    @staticmethod
    def _preprocess(image: Image.Image) -> np.ndarray:
        width, height = image.size
        scale = 224.0 / min(width, height)
        resized = image.resize(
            (max(224, round(width * scale)), max(224, round(height * scale))),
            Image.Resampling.BICUBIC,
        )
        width, height = resized.size
        left = (width - 224) // 2
        top = (height - 224) // 2
        cropped = resized.crop((left, top, left + 224, top + 224))
        arr = np.asarray(cropped, dtype=np.float32) / 255.0
        arr = (arr - _CLIP_MEAN) / _CLIP_STD
        return np.transpose(arr, (2, 0, 1))[None, ...]

    def predict_sync(self, image: Image.Image) -> RawInferenceResult:
        if not self.is_available:
            raise RuntimeError(self._load_error or "BioCLIP is unavailable")

        tensor = self._preprocess(image)
        image_embedding = self.session.run(
            [self.output_name], {self.input_name: tensor}
        )[0][0]
        norm = float(np.linalg.norm(image_embedding))
        if norm <= 0:
            raise RuntimeError("BioCLIP produced an empty image embedding")
        image_embedding = image_embedding / norm

        similarities = self.embeddings @ image_embedding  # type: ignore[operator]
        cat_mask = ~self.non_feline  # type: ignore[operator]
        cat_indices = np.flatnonzero(cat_mask)
        non_cat_indices = np.flatnonzero(~cat_mask)

        cat_order = cat_indices[np.argsort(similarities[cat_indices])[::-1]]
        non_cat_order = non_cat_indices[np.argsort(similarities[non_cat_indices])[::-1]]

        top_cat_idx = int(cat_order[0])
        top_non_cat_idx = int(non_cat_order[0])
        top_cat_score = float(similarities[top_cat_idx])
        top_non_cat_score = float(similarities[top_non_cat_idx])
        feline_evidence = top_cat_score - top_non_cat_score

        feline_detected = feline_evidence >= settings.feline_margin_threshold

        predictions: List[RawPrediction] = []
        for idx in cat_order[:8]:
            idx = int(idx)
            predictions.append(
                RawPrediction(
                    species_id=self.labels[idx],
                    label=self.common_names[idx],
                    score=round(float(similarities[idx]), 6),
                    is_felid=True,
                    model_label=self.scientific_names[idx],
                    rationale=(
                        f"BioCLIP image-text similarity for {self.scientific_names[idx]} "
                        f"({self.common_names[idx]}). Similarity is not a calibrated probability."
                    ),
                )
            )

        diagnostics: Dict[str, Any] = {
            "embedding_dim": int(self.embeddings.shape[1]),  # type: ignore[union-attr]
            "top_non_feline": {
                "label": self.common_names[top_non_cat_idx],
                "scientific_name": self.scientific_names[top_non_cat_idx],
                "score": round(top_non_cat_score, 6),
            },
            "cat_candidates": [
                {
                    "species_id": self.labels[int(idx)],
                    "score": round(float(similarities[int(idx)]), 6),
                }
                for idx in cat_order[:8]
            ],
        }

        notes = [
            "BioCLIP scores are cosine similarities, not calibrated probabilities.",
            "Domestic-cat classes are reported at species level; breed identity is never asserted.",
            "Hybrid taxa are excluded from identification.",
        ]

        if self.gate is not None and self.gate.is_available:
            gate_result = self.gate.predict_sync(image)
            diagnostics["imagenet_gate"] = gate_result.model_dump()
            if feline_detected and gate_result.feline_detected:
                feline_detected = True
            elif not feline_detected and not gate_result.feline_detected:
                feline_detected = False
            else:
                feline_detected = False
                notes.append(
                    "BioCLIP and the independent ImageNet gate disagree about whether the "
                    "image contains a feline; the result is abstained rather than forced."
                )
                diagnostics["content_conflict"] = True
            notes.extend(gate_result.notes)
        elif self.gate is not None:
            diagnostics["imagenet_gate"] = {
                "available": False,
                "error": self.gate.load_error,
            }
            notes.append(
                "The independent ImageNet gate is not installed; BioCLIP's non-feline "
                "prompt margin was used as the content check."
            )

        return RawInferenceResult(
            predictions=predictions,
            feline_detected=feline_detected,
            feline_evidence=round(feline_evidence, 6),
            non_feline_label=self.common_names[top_non_cat_idx],
            non_feline_score=round(top_non_cat_score, 6),
            content_conflict=bool(diagnostics.get("content_conflict", False)),
            score_semantics=self.score_semantics,
            is_mock=False,
            model_name=self.model_name,
            model_version=self.model_version,
            model_license=self.model_license,
            notes=notes,
            diagnostics=diagnostics,
        )

    async def predict(self, image: Image.Image) -> RawInferenceResult:
        return await asyncio.to_thread(self.predict_sync, image)
