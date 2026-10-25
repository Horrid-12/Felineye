from fastapi import APIRouter

from ..models.species import HybridListResponse, TaxonomyMetaResponse
from ..services.species_service import species_service

router = APIRouter(prefix="/api/catalog", tags=["Catalog"])


@router.get("/meta", response_model=TaxonomyMetaResponse)
async def get_catalog_meta():
    """Taxonomy authority, registry declaration, and separate category counts."""
    return species_service.get_catalog_meta()


@router.get("/hybrids", response_model=HybridListResponse)
async def list_hybrids():
    """Wild x wild hybrid crosses, kept separate from species and domestic breeds."""
    items = species_service.get_hybrids()
    return HybridListResponse(total=len(items), items=items)
