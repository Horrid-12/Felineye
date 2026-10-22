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
    
    # Model & Inference Settings
    classifier_provider: str = os.getenv("CLASSIFIER_PROVIDER", "auto")
    model_path: str = os.getenv("MODEL_PATH", str(BASE_DIR / "models" / "felidae_classifier.onnx"))
    confidence_threshold: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.28"))
    uncertainty_entropy_threshold: float = float(os.getenv("UNCERTAINTY_ENTROPY_THRESHOLD", "2.10"))
    max_image_size_mb: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "15"))
    
    # External Wildlife APIs
    inaturalist_api_base: str = os.getenv("INATURALIST_API_BASE", "https://api.inaturalist.org/v1")
    gbif_api_base: str = os.getenv("GBIF_API_BASE", "https://api.gbif.org/v1")
    request_timeout_seconds: float = 8.0

settings = Settings()
