import json
import random
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
from ..models.species import SpeciesSummary, SpeciesDetail, SimilarSpeciesItem
from ..models.collection import CollectionSpeciesItem, Badge, RankTier, CollectionMetaResponse

CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "species_catalog.json"

class SpeciesService:
    def __init__(self, catalog_path: Path = CATALOG_PATH):
        self.catalog_path = catalog_path
        self._species_map: Dict[str, Dict[str, Any]] = {}
        self._species_list: List[Dict[str, Any]] = []
        self._inat_id_map: Dict[int, str] = {}
        self._load_catalog()

    def _load_catalog(self):
        if not self.catalog_path.exists():
            raise FileNotFoundError(f"Species catalog not found at {self.catalog_path}")
        with open(self.catalog_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self._species_list = data
            self._species_map = {item["id"]: item for item in data}
            for item in data:
                inat_id = item.get("inaturalist_taxon_id")
                if inat_id:
                    self._inat_id_map[inat_id] = item["id"]

    def get_all(
        self,
        search: Optional[str] = None,
        subfamily: Optional[str] = None,
        lineage: Optional[str] = None,
        conservation_status: Optional[str] = None,
        is_wild: Optional[bool] = None,
        habitat: Optional[str] = None,
        page: int = 1,
        page_size: int = 24
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
        end = start + page_size
        paged = filtered[start:end]

        summaries = [
            SpeciesSummary(
                id=item["id"],
                common_name=item["common_name"],
                scientific_name=item["scientific_name"],
                subfamily=item["subfamily"],
                lineage=item.get("lineage", item["subfamily"]),
                genus=item["genus"],
                conservation_status=item["conservation_status"],
                conservation_title=item["conservation_title"],
                is_wild=item["is_wild"],
                thumbnail_url=item["thumbnail_url"],
                image_url=item["image_url"],
                discovery_rarity=item["discovery_rarity"],
                xp_reward=item["xp_reward"],
                habitats=item["habitats"],
                size_and_weight=item.get("size_and_weight"),
                geographic_range=item.get("geographic_range")
            )
            for item in paged
        ]
        return summaries, total

    def get_by_slug(self, slug: str) -> Optional[SpeciesDetail]:
        item = self._species_map.get(slug)
        if not item:
            return None
        
        similar_items = [
            SimilarSpeciesItem(**s) for s in item.get("similar_species", [])
        ]
        
        return SpeciesDetail(
            id=item["id"],
            common_name=item["common_name"],
            scientific_name=item["scientific_name"],
            subfamily=item["subfamily"],
            lineage=item.get("lineage", item["subfamily"]),
            genus=item["genus"],
            conservation_status=item["conservation_status"],
            conservation_title=item["conservation_title"],
            is_wild=item["is_wild"],
            thumbnail_url=item["thumbnail_url"],
            image_url=item["image_url"],
            discovery_rarity=item["discovery_rarity"],
            xp_reward=item["xp_reward"],
            habitats=item["habitats"],
            size_and_weight=item.get("size_and_weight"),
            geographic_range=item.get("geographic_range"),
            description=item["description"],
            distinguishing_characteristics=item["distinguishing_characteristics"],
            diet=item["diet"],
            behavior=item["behavior"],
            image_attribution=item.get("image_attribution", "Curated Felidae Archive"),
            similar_species=similar_items,
            inaturalist_taxon_id=item.get("inaturalist_taxon_id"),
            gbif_taxon_key=item.get("gbif_taxon_key")
        )

    def get_featured(self) -> SpeciesDetail:
        # Pick an iconic wild felid for featured presentation
        iconic_slugs = ["panthera-uncia", "panthera-onca", "panthera-tigris", "acinonyx-jubatus", "caracal-caracal"]
        chosen_slug = random.choice(iconic_slugs)
        detail = self.get_by_slug(chosen_slug)
        if detail:
            return detail
        return self.get_by_slug("panthera-leo") # fallback

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
                is_wild=item["is_wild"]
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
