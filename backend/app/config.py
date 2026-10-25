import os
from pathlib import Path
from typing import List

from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseModel):
    environment: str = os.getenv("ENVIRONMENT", "development")
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))
    cors_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

    # ------------------------------------------------------------------
    # Identification provider
    # ------------------------------------------------------------------
    #: auto | bioclip | imagenet | consensus | dev_mock
    #: ``auto`` prefers BioCLIP + the ImageNet gate, then ImageNet alone, and
    #: otherwise returns model_unavailable. It never falls back to the mock.
    classifier_provider: str = os.getenv("CLASSIFIER_PROVIDER", "auto")

    bioclip_model_path: str = os.getenv(
        "BIOCLIP_MODEL_PATH", str(BASE_DIR / "models" / "bioclip_vit_b16_vision.onnx")
    )
    bioclip_text_embeddings_path: str = os.getenv(
        "BIOCLIP_TEXT_EMBEDDINGS_PATH",
        str(BASE_DIR / "app" / "data" / "bioclip_text_embeddings.npz"),
    )
    imagenet_model_path: str = os.getenv(
        "IMAGENET_MODEL_PATH", str(BASE_DIR / "models" / "mobilenetv2-12.onnx")
    )
    imagenet_labels_path: str = os.getenv(
        "IMAGENET_LABELS_PATH", str(BASE_DIR / "app" / "data" / "imagenet_classes.txt")
    )
    feline_gate_enabled: bool = os.getenv("FELINE_GATE_ENABLED", "true").lower() in (
        "1",
        "true",
        "yes",
        "on",
    )

    # ------------------------------------------------------------------
    # Decision thresholds
    # ------------------------------------------------------------------
    # These are deliberately conservative. They were selected against the
    # 41 reference images in the curated catalog plus dog/crocodile/object
    # negatives; see Documentation/Identification-Model.md. They are
    # *abstention* thresholds for a cosine-similarity ranker, not calibrated
    # probabilities.
    bioclip_min_wild_similarity: float = float(os.getenv("BIOCLIP_MIN_WILD_SIMILARITY", "0.32"))
    bioclip_min_wild_margin: float = float(os.getenv("BIOCLIP_MIN_WILD_MARGIN", "0.030"))
    bioclip_min_domestic_similarity: float = float(
        os.getenv("BIOCLIP_MIN_DOMESTIC_SIMILARITY", "0.30")
    )
    bioclip_min_domestic_margin: float = float(
        os.getenv("BIOCLIP_MIN_DOMESTIC_MARGIN", "0.015")
    )
    feline_margin_threshold: float = float(os.getenv("FELINE_MARGIN_THRESHOLD", "0.04"))

    # Quality gates. A poor-quality image is allowed to produce an abstention,
    # never a fabricated identification.
    quality_blur_threshold: float = float(os.getenv("QUALITY_BLUR_THRESHOLD", "12.0"))
    quality_brightness_min: float = float(os.getenv("QUALITY_BRIGHTNESS_MIN", "18.0"))
    quality_brightness_max: float = float(os.getenv("QUALITY_BRIGHTNESS_MAX", "238.0"))
    quality_contrast_min: float = float(os.getenv("QUALITY_CONTRAST_MIN", "8.0"))

    max_image_size_mb: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "15"))

    # External Wildlife APIs
    inaturalist_api_base: str = os.getenv("INATURALIST_API_BASE", "https://api.inaturalist.org/v1")
    gbif_api_base: str = os.getenv("GBIF_API_BASE", "https://api.gbif.org/v1")
    request_timeout_seconds: float = 8.0


settings = Settings()
