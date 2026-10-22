from typing import List, Optional
from pydantic import BaseModel, Field

class SimilarSpeciesItem(BaseModel):
    slug: str
    common_name: str
    differentiator: str

class SpeciesSummary(BaseModel):
    id: str
    common_name: str
    scientific_name: str
    subfamily: str
    lineage: str
    genus: str
    conservation_status: str
    conservation_title: str
    is_wild: bool
    thumbnail_url: str
    image_url: str
    discovery_rarity: str
    xp_reward: int
    habitats: List[str]
    size_and_weight: Optional[str] = None
    geographic_range: Optional[str] = None

class SpeciesDetail(SpeciesSummary):
    description: str
    distinguishing_characteristics: List[str]
    diet: str
    behavior: str
    image_attribution: str
    similar_species: List[SimilarSpeciesItem] = Field(default_factory=list)
    inaturalist_taxon_id: Optional[int] = None
    gbif_taxon_key: Optional[int] = None

class SpeciesListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[SpeciesSummary]
