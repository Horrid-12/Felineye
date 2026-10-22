from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from ..models.species import SpeciesListResponse, SpeciesDetail
from ..services.species_service import species_service

router = APIRouter(prefix="/api/species", tags=["Species"])

@router.get("", response_model=SpeciesListResponse)
async def list_species(
    search: Optional[str] = Query(None, description="Search term matching common or scientific name"),
    subfamily: Optional[str] = Query(None, description="Filter by subfamily: Pantherinae or Felinae"),
    lineage: Optional[str] = Query(None, description="Filter by feline lineage"),
    conservation_status: Optional[str] = Query(None, description="Filter by IUCN status code: CR, EN, VU, NT, LC, DOMESTIC"),
    is_wild: Optional[bool] = Query(None, description="Filter wild vs domestic felids"),
    habitat: Optional[str] = Query(None, description="Filter by habitat tag"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(24, ge=1, le=100, description="Items per page")
):
    items, total = species_service.get_all(
        search=search,
        subfamily=subfamily,
        lineage=lineage,
        conservation_status=conservation_status,
        is_wild=is_wild,
        habitat=habitat,
        page=page,
        page_size=page_size
    )
    return SpeciesListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )

@router.get("/featured/today", response_model=SpeciesDetail)
async def get_featured_species():
    """
    Returns an iconic featured felid of the day.
    """
    return species_service.get_featured()

@router.get("/{slug}", response_model=SpeciesDetail)
async def get_species_detail(slug: str):
    """
    Retrieves full species profile including anatomy, behavior, range, IUCN status, and related species.
    """
    species = species_service.get_by_slug(slug)
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Felid species with identifier '{slug}' was not found in the curated taxonomy catalog."
        )
    return species
