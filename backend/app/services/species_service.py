import json
import random
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any, Union

from ..models.species import (
    BreedDetail,
    BreedListResponse,
    BreedRegistryInfo,
    BreedSummary,
    HybridDetail,
    HybridSummary,
    SimilarSpeciesItem,
    SpeciesDetail,
    SpeciesSummary,
    TaxonomyMetaResponse,
)
from ..models.collection import CollectionSpeciesItem, Badge, RankTier, CollectionMetaResponse

CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "species_catalog.json"


class SpeciesService:
    def __init__(self, catalog_path: Path = CATALOG_PATH):
        self.catalog_path = catalog_path
        self._taxonomy: Dict[str, Any] = {}
        self._species_map: Dict[str, Dict[str, Any]] = {}
        self._species_list: List[Dict[str, Any]] = []
        self._breed_map: Dict[str, Dict[str, Any]] = {}
        self._breed_list: List[Dict[str, Any]] = []
        self._hybrid_map: Dict[str, Dict[str, Any]] = {}
        self._hybrid_list: List[Dict[str, Any]] = []
        self._inat_id_map: Dict[int, str] = {}
        self._load_catalog()

    def _load_catalog(self):
        if not self.catalog_path.exists():
            raise FileNotFoundError(f"Species catalog not found at {self.catalog_path}")
        with open(self.catalog_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Accept both the pre-2026 flat list and the current object-shaped catalog.
        if isinstance(data, list):
            species_raw: List[Dict[str, Any]] = data
            breed_raw: List[Dict[str, Any]] = []
            hybrid_raw: List[Dict[str, Any]] = []
            self._taxonomy = {}
        else:
            species_raw = data.get("species", [])
            breed_raw = data.get("breeds", [])
            hybrid_raw = data.get("hybrids", [])
            self._taxonomy = data.get("taxonomy", {})

        self._species_list = species_raw
        self._species_map = {item["id"]: item for item in species_raw}
        self._breed_list = breed_raw
        self._breed_map = {item["id"]: item for item in breed_raw}
        self._hybrid_list = hybrid_raw
        self._hybrid_map = {item["id"]: item for item in hybrid_raw}

        for item in species_raw:
            inat_id = item.get("inaturalist_taxon_id")
            if inat_id:
                self._inat_id_map[inat_id] = item["id"]

    # ------------------------------------------------------------------
    # Mapping helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _summary_kwargs(item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": item["id"],
            "common_name": item["common_name"],
            "scientific_name": item["scientific_name"],
            "subfamily": item.get("subfamily", "Felinae"),
            "lineage": item.get("lineage", item.get("subfamily", "Felinae")),
            "genus": item.get("genus", "Felis"),
            "conservation_status": item.get("conservation_status", "NE"),
            "conservation_title": item.get("conservation_title", "Not evaluated"),
            "is_wild": item.get("is_wild", True),
            "thumbnail_url": item.get("thumbnail_url") or item.get("image_url") or "",
            "image_url": item.get("image_url") or "",
            "discovery_rarity": item.get("discovery_rarity", "Uncommon"),
            "xp_reward": item.get("xp_reward", 100),
            "habitats": item.get("habitats", []),
            "size_and_weight": item.get("size_and_weight"),
            "geographic_range": item.get("geographic_range"),
            "category": item.get("category", "wild_species"),
            "rank": item.get("rank", "species"),
            "parent_id": item.get("parent_id"),
            "taxonomy_source": item.get("taxonomy_source"),
        }

    @classmethod
    def _to_summary(cls, item: Dict[str, Any]) -> SpeciesSummary:
        return SpeciesSummary(**cls._summary_kwargs(item))

    @classmethod
    def _to_detail(cls, item: Dict[str, Any]) -> SpeciesDetail:
        return SpeciesDetail(
            **cls._summary_kwargs(item),
            description=item.get("description", ""),
            distinguishing_characteristics=item.get("distinguishing_characteristics", []),
            diet=item.get("diet", ""),
            behavior=item.get("behavior", ""),
            image_attribution=item.get("image_attribution", "Curated Felidae Archive"),
            similar_species=[SimilarSpeciesItem(**s) for s in item.get("similar_species", [])],
            inaturalist_taxon_id=item.get("inaturalist_taxon_id"),
            gbif_taxon_key=item.get("gbif_taxon_key"),
            provenance=item.get("provenance", {}),
        )

    @staticmethod
    def _to_breed_summary(item: Dict[str, Any]) -> BreedSummary:
        provenance = item.get("provenance", {})
        return BreedSummary(
            id=item["id"],
            common_name=item["common_name"],
            scientific_name=item.get("scientific_name", "Felis catus"),
            category=item.get("category", "domestic_breed"),
            rank=item.get("rank", "breed"),
            parent_id=item.get("parent_id", "felis-catus"),
            registry=item.get("registry", ""),
            registry_url=item.get("registry_url", ""),
            origin=item.get("origin"),
            body_type=item.get("body_type"),
            coat_length=item.get("coat_length"),
            coat_pattern=item.get("coat_pattern"),
            description=item.get("description"),
            thumbnail_url=item.get("thumbnail_url"),
            image_url=item.get("image_url"),
            image_attribution=item.get("image_attribution"),
            registry_verified=provenance.get("registry_verified"),
        )

    @classmethod
    def _to_breed_detail(cls, item: Dict[str, Any]) -> BreedDetail:
        base = cls._to_breed_summary(item).model_dump()
        return BreedDetail(
            **base,
            development=item.get("development"),
            provenance=item.get("provenance", {}),
        )

    @staticmethod
    def _to_hybrid_summary(item: Dict[str, Any]) -> HybridSummary:
        return HybridSummary(
            id=item["id"],
            common_name=item["common_name"],
            scientific_name=item["scientific_name"],
            category=item.get("category", "hybrid"),
            rank=item.get("rank", "hybrid"),
            parents=item.get("parents", []),
            parent_names=item.get("parent_names", []),
            description=item.get("description", ""),
            note=item.get("note", ""),
            thumbnail_url=item.get("thumbnail_url"),
            image_url=item.get("image_url"),
            image_attribution=item.get("image_attribution"),
        )

    @classmethod
    def _to_hybrid_detail(cls, item: Dict[str, Any]) -> HybridDetail:
        return HybridDetail(
            **cls._to_hybrid_summary(item).model_dump(),
            provenance=item.get("provenance", {}),
        )

    # ------------------------------------------------------------------
    # Species queries
    # ------------------------------------------------------------------
    def get_all(
        self,
        search: Optional[str] = None,
        subfamily: Optional[str] = None,
        lineage: Optional[str] = None,
        conservation_status: Optional[str] = None,
        is_wild: Optional[bool] = None,
        habitat: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 24,
    ) -> Tuple[List[SpeciesSummary], int]:
        filtered = self._species_list

        if search:
            query = search.strip().lower()
            filtered = [
                s for s in filtered
                if query in s["common_name"].lower()
                or query in s["scientific_name"].lower()
                or query in s.get("genus", "").lower()
                or query in s.get("lineage", "").lower()
            ]

        if category:
            filtered = [s for s in filtered if s.get("category", "wild_species") == category]

        if subfamily:
            filtered = [s for s in filtered if s["subfamily"].lower() == subfamily.strip().lower()]

        if lineage:
            filtered = [s for s in filtered if s.get("lineage", "").lower() == lineage.strip().lower()]

        if conservation_status:
            status_upper = conservation_status.strip().upper()
            filtered = [s for s in filtered if s["conservation_status"].upper() == status_upper]

        if is_wild is not None:
            filtered = [s for s in filtered if s["is_wild"] == is_wild]

        if habitat:
            hab_lower = habitat.strip().lower()
            filtered = [
                s for s in filtered
                if any(hab_lower in h.lower() for h in s.get("habitats", []))
            ]

        total = len(filtered)
        start = (page - 1) * page_size
        paged = filtered[start:start + page_size]
        return [self._to_summary(item) for item in paged], total

    def get_by_slug(self, slug: str) -> Optional[SpeciesDetail]:
        item = self._species_map.get(slug)
        return self._to_detail(item) if item else None

    def get_featured(self) -> SpeciesDetail:
        iconic_slugs = ["panthera-uncia", "panthera-onca", "panthera-tigris", "acinonyx-jubatus", "caracal-caracal"]
        chosen_slug = random.choice(iconic_slugs)
        detail = self.get_by_slug(chosen_slug)
        if detail:
            return detail
        return self.get_by_slug("panthera-leo")

    # ------------------------------------------------------------------
    # Breed queries
    # ------------------------------------------------------------------
    def get_breeds(
        self,
        search: Optional[str] = None,
        registry: Optional[str] = None,
        page: int = 1,
        page_size: int = 40,
    ) -> Tuple[List[BreedSummary], int]:
        filtered = self._breed_list
        if search:
            query = search.strip().lower()
            filtered = [
                b for b in filtered
                if query in b["common_name"].lower()
                or query in b.get("origin", "").lower()
                or query in b.get("coat_length", "").lower()
                or query in b.get("coat_pattern", "").lower()
                or query in b.get("body_type", "").lower()
            ]
        if registry:
            registry_lower = registry.strip().lower()
            filtered = [b for b in filtered if registry_lower in b.get("registry", "").lower()]

        total = len(filtered)
        start = (page - 1) * page_size
        paged = filtered[start:start + page_size]
        return [self._to_breed_summary(item) for item in paged], total

    def get_breed_by_slug(self, slug: str) -> Optional[BreedDetail]:
        item = self._breed_map.get(slug)
        return self._to_breed_detail(item) if item else None

    # ------------------------------------------------------------------
    # Hybrid queries
    # ------------------------------------------------------------------
    def get_hybrids(self) -> List[HybridSummary]:
        return [self._to_hybrid_summary(item) for item in self._hybrid_list]

    def get_hybrid_by_slug(self, slug: str) -> Optional[HybridDetail]:
        item = self._hybrid_map.get(slug)
        return self._to_hybrid_detail(item) if item else None

    # ------------------------------------------------------------------
    # Unified taxon access
    # ------------------------------------------------------------------
    def get_taxon_record(self, slug: str) -> Optional[Dict[str, Any]]:
        for collection in (self._species_map, self._breed_map, self._hybrid_map):
            if slug in collection:
                return collection[slug]
        return None

    def get_taxon(self, slug: str) -> Optional[Union[SpeciesDetail, BreedDetail, HybridDetail]]:
        if slug in self._species_map:
            return self._to_detail(self._species_map[slug])
        if slug in self._breed_map:
            return self._to_breed_detail(self._breed_map[slug])
        if slug in self._hybrid_map:
            return self._to_hybrid_detail(self._hybrid_map[slug])
        return None

    def get_catalog_meta(self) -> TaxonomyMetaResponse:
        meta = self._taxonomy
        registry = meta.get("breed_registry", {})
        return TaxonomyMetaResponse(
            authority=meta.get("authority", "IUCN/SSC Cat Specialist Group"),
            reference=meta.get("reference", ""),
            year=meta.get("year", 2017),
            url=meta.get("url", "https://www.catsg.org/"),
            taxonomy_note=meta.get("taxonomy_note", ""),
            breed_note=meta.get("breed_note", ""),
            hybrid_note=meta.get("hybrid_note", ""),
            updated=meta.get("updated", ""),
            wild_species_count=len([s for s in self._species_list if s.get("category") == "wild_species"]),
            domestic_species_count=len([s for s in self._species_list if s.get("category") == "domestic_species"]),
            species_count=len(self._species_list),
            breed_count=len(self._breed_list),
            hybrid_count=len(self._hybrid_list),
            lineage_count=len({s.get("lineage") for s in self._species_list}),
            breed_registry=BreedRegistryInfo(
                name=registry.get("name", ""),
                url=registry.get("url", ""),
                verification=registry.get("verification"),
                note=registry.get("note"),
            ),
        )

    # ------------------------------------------------------------------
    # Collection
    # ------------------------------------------------------------------
    def get_collection_meta(self) -> CollectionMetaResponse:
        species_items = [
            CollectionSpeciesItem(
                id=item["id"],
                common_name=item["common_name"],
                scientific_name=item["scientific_name"],
                subfamily=item["subfamily"],
                lineage=item.get("lineage", item["subfamily"]),
                genus=item["genus"],
                rarity=item["discovery_rarity"],
                xp_reward=item["xp_reward"],
                thumbnail_url=item["thumbnail_url"],
                is_wild=item["is_wild"],
                category=item.get("category", "wild_species"),
            )
            for item in self._species_list
        ]

        badges = [
            Badge(
                id="first_contact",
                title="First Glimpse",
                description="Make your very first feline discovery.",
                icon="Compass",
                required_count=1,
                category="discovery"
            ),
            Badge(
                id="panthera_master",
                title="Roar of the Ancients",
                description="Discover all 5 Panthera apex big cats (Lion, Tiger, Jaguar, Leopard, Snow Leopard).",
                icon="Crown",
                required_count=5,
                category="big_cats"
            ),
            Badge(
                id="lynx_tracker",
                title="Shadows of the North",
                description="Discover all 4 lynx species across Europe, America, and Iberia.",
                icon="Snowflake",
                required_count=4,
                category="lineage"
            ),
            Badge(
                id="high_altitude",
                title="Crown of the World",
                description="Discover high-elevation felids: Snow Leopard, Pallas's Cat, and Andean Mountain Cat.",
                icon="Mountain",
                required_count=3,
                category="expedition"
            ),
            Badge(
                id="water_master",
                title="Aqua Felid",
                description="Identify the swimming specialists: Fishing Cat and Flat-headed Cat.",
                icon="Waves",
                required_count=2,
                category="expedition"
            ),
            Badge(
                id="conservation_champion",
                title="Guardian of the Wild",
                description="Discover 6 species listed as Endangered or Vulnerable by the IUCN.",
                icon="ShieldCheck",
                required_count=6,
                category="endangered"
            ),
            Badge(
                id="grand_naturalist",
                title="Master Naturalist",
                description="Discover 20 distinct feline species in your expedition journal.",
                icon="Award",
                required_count=20,
                category="discovery"
            )
        ]

        ranks = [
            RankTier(
                rank=1,
                title="Kitten Scout",
                min_xp=0,
                badge_icon="Eye",
                description="Beginning your journey into the world of cats."
            ),
            RankTier(
                rank=2,
                title="Curious Prowler",
                min_xp=300,
                badge_icon="Footprints",
                description="Skilled at identifying common and domestic felids."
            ),
            RankTier(
                rank=3,
                title="Cat Whisperer",
                min_xp=800,
                badge_icon="Compass",
                description="Recognizing wild lineages and specialized feline habitats."
            ),
            RankTier(
                rank=4,
                title="Velvet Stalker",
                min_xp=1600,
                badge_icon="Sunrise",
                description="Mastering wild cats of the open biomes and forests."
            ),
            RankTier(
                rank=5,
                title="Panthera Master",
                min_xp=2800,
                badge_icon="Flame",
                description="Tracking apex big cats and elusive predators."
            ),
            RankTier(
                rank=6,
                title="Supreme Felid Sovereign",
                min_xp=4500,
                badge_icon="Crown",
                description="Master of the Felidae kingdom, having documented the rarest cats on Earth."
            )
        ]

        return CollectionMetaResponse(
            species=species_items,
            badges=badges,
            ranks=ranks
        )


# Global singleton instance
species_service = SpeciesService()
