from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class CollectionSpeciesItem(BaseModel):
    id: str
    common_name: str
    scientific_name: str
    subfamily: str
    lineage: str
    genus: str
    rarity: str
    xp_reward: int
    thumbnail_url: str
    is_wild: bool

class Badge(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    required_count: int
    category: str  # "discovery", "big_cats", "endangered", "lineage", "expedition"

class RankTier(BaseModel):
    rank: int
    title: str
    min_xp: int
    badge_icon: str
    description: str

class CollectionMetaResponse(BaseModel):
    species: List[CollectionSpeciesItem]
    badges: List[Badge]
    ranks: List[RankTier]
