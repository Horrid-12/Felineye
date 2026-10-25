from typing import Union

from fastapi import APIRouter, HTTPException, status

from ..models.species import BreedDetail, HybridDetail, SpeciesDetail
from ..services.species_service import species_service

router = APIRouter(prefix="/api/taxa", tags=["Taxa"])


@router.get("/{slug}", response_model=Union[SpeciesDetail, BreedDetail, HybridDetail])
async def get_taxon_detail(slug: str):
    """Unified detail lookup for wild species, the domestic cat species, breeds, and hybrids."""
    taxon = species_service.get_taxon(slug)
    if not taxon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Taxon with identifier '{slug}' was not found in the curated catalog.",
        )
    return taxon
