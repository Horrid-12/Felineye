from fastapi import APIRouter
from ..models.collection import CollectionMetaResponse
from ..services.species_service import species_service

router = APIRouter(prefix="/api/collection", tags=["Collection"])

@router.get("/species", response_model=CollectionMetaResponse)
async def get_collection_metadata():
    """
    Returns the complete checklist of discoverable felid species,
    discovery badges, rarity tiers, and progression ranks for the user's field journal.
    """
    return species_service.get_collection_meta()
