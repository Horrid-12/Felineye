from typing import Any, Dict, List, Optional
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
    category: str = "wild_species"
    rank: str = "species"
    parent_id: Optional[str] = None
    taxonomy_source: Optional[str] = None

class SpeciesDetail(SpeciesSummary):
    description: str
    distinguishing_characteristics: List[str]
    diet: str
    behavior: str
    image_attribution: str
    similar_species: List[SimilarSpeciesItem] = Field(default_factory=list)
    inaturalist_taxon_id: Optional[int] = None
    gbif_taxon_key: Optional[int] = None
    provenance: Dict[str, Any] = Field(default_factory=dict)

class SpeciesListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[SpeciesSummary]

class BreedSummary(BaseModel):
    id: str
    common_name: str
    scientific_name: str = "Felis catus"
    category: str = "domestic_breed"
    rank: str = "breed"
    parent_id: Optional[str] = "felis-catus"
    registry: str
    registry_url: str
    origin: Optional[str] = None
    body_type: Optional[str] = None
    coat_length: Optional[str] = None
    coat_pattern: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    image_url: Optional[str] = None
    image_attribution: Optional[str] = None
    registry_verified: Optional[str] = None

class BreedDetail(BreedSummary):
    development: Optional[str] = None
    provenance: Dict[str, Any] = Field(default_factory=dict)

class BreedListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[BreedSummary]

class HybridSummary(BaseModel):
    id: str
    common_name: str
    scientific_name: str
    category: str = "hybrid"
    rank: str = "hybrid"
    parents: List[str] = Field(default_factory=list)
    parent_names: List[str] = Field(default_factory=list)
    description: str
    note: str
    thumbnail_url: Optional[str] = None
    image_url: Optional[str] = None
    image_attribution: Optional[str] = None

class HybridDetail(HybridSummary):
    provenance: Dict[str, Any] = Field(default_factory=dict)

class HybridListResponse(BaseModel):
    total: int
    items: List[HybridSummary]

class BreedRegistryInfo(BaseModel):
    name: str
    url: str
    verification: Optional[str] = None
    note: Optional[str] = None

class TaxonomyMetaResponse(BaseModel):
    authority: str
    reference: str
    year: int
    url: str
    taxonomy_note: str
    breed_note: str
    hybrid_note: str
    updated: str
    wild_species_count: int
    domestic_species_count: int
    species_count: int
    breed_count: int
    hybrid_count: int
    lineage_count: int
    breed_registry: BreedRegistryInfo
