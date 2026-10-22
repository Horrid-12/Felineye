from typing import Optional
from fastapi import APIRouter, Query
from ..models.observation import ObservationListResponse
from ..services.inaturalist_service import inaturalist_service

router = APIRouter(prefix="/api/observations", tags=["Observations"])

@router.get("", response_model=ObservationListResponse)
async def list_observations(
    taxon_id: Optional[int] = Query(None, description="iNaturalist taxon identifier"),
    place_id: Optional[int] = Query(None, description="iNaturalist geographical place identifier"),
    limit: int = Query(24, ge=1, le=50, description="Number of observations to retrieve")
):
    """
    Fetches verified feline wildlife observations from iNaturalist Network.
    Raw coordinates are generalized for conservation safety.
    """
    return await inaturalist_service.get_feline_observations(
        taxon_id=taxon_id,
        place_id=place_id,
        limit=limit
    )
