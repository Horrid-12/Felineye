from fastapi import APIRouter

from ..services.identification.pipeline import pipeline
from ..services.species_service import species_service

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy" if pipeline.is_ready else "degraded",
        "service": "FelidLens Identification Engine",
        "version": "2.0.0",
        "provider": pipeline.active_provider_name,
        "provider_kind": pipeline.provider_kind,
        "is_mock": pipeline.is_mock_active,
        "model_available": pipeline.is_ready,
        "model": pipeline.model_info,
        "capabilities": pipeline.capabilities,
        "indexed_species_count": len(species_service._species_list),
    }
