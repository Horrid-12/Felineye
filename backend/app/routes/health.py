from fastapi import APIRouter
from ..services.identification.pipeline import pipeline
from ..services.species_service import species_service

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "FelidLens Identification Engine",
        "version": "1.0.0",
        "provider": pipeline.active_provider_name,
        "is_mock": pipeline.is_mock_active,
        "indexed_species_count": len(species_service._species_list)
    }
