from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from ..models.species import BreedDetail, BreedListResponse
from ..services.species_service import species_service

router = APIRouter(prefix="/api/breeds", tags=["Breeds"])


@router.get("", response_model=BreedListResponse)
async def list_breeds(
    search: Optional[str] = Query(None, description="Search breed name, origin, body type, or coat"),
    registry: Optional[str] = Query(None, description="Filter by breed registry name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(40, ge=1, le=100, description="Items per page"),
):
    items, total = species_service.get_breeds(
        search=search, registry=registry, page=page, page_size=page_size
    )
    return BreedListResponse(total=total, page=page, page_size=page_size, items=items)


@router.get("/{slug}", response_model=BreedDetail)
async def get_breed_detail(slug: str):
    breed = species_service.get_breed_by_slug(slug)
    if not breed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domestic cat breed with identifier '{slug}' was not found in the curated breed catalog.",
        )
    return breed
