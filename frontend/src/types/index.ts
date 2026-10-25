export type IdentificationStatus =
  | 'high_confidence'
  | 'moderate_confidence'
  | 'uncertain'
  | 'non_felid_detected'
  | 'unsupported_image'
  | 'model_error';

export type TaxonCategory =
  | 'wild_species'
  | 'domestic_species'
  | 'domestic_breed'
  | 'hybrid';

export interface CandidatePrediction {
  species_id: string;
  common_name: string;
  scientific_name: string;
  confidence_score: number;
  score_percentage: number;
  is_wild: boolean;
  conservation_status: string;
  thumbnail_url: string;
  category?: TaxonCategory;
  rationale?: string;
}

export interface IdentificationResult {
  status: IdentificationStatus;
  top_candidate?: CandidatePrediction;
  candidates: CandidatePrediction[];
  score_semantics: string;
  entropy: number;
  is_mock: boolean;
  uncertainty_note?: string;
  processing_time_ms: number;
  image_metadata: Record<string, any>;
  disclaimer: string;
}

export interface SimilarSpeciesItem {
  slug: string;
  common_name: string;
  differentiator: string;
}

export interface SpeciesSummary {
  id: string;
  common_name: string;
  scientific_name: string;
  subfamily: string;
  lineage: string;
  genus: string;
  conservation_status: string;
  conservation_title: string;
  is_wild: boolean;
  thumbnail_url: string;
  image_url: string;
  discovery_rarity: string;
  xp_reward: number;
  habitats: string[];
  size_and_weight?: string;
  geographic_range?: string;
  category: 'wild_species' | 'domestic_species';
  rank: string;
  parent_id?: string | null;
  taxonomy_source?: string;
}

export interface SpeciesDetail extends SpeciesSummary {
  description: string;
  distinguishing_characteristics: string[];
  diet: string;
  behavior: string;
  image_attribution: string;
  similar_species: SimilarSpeciesItem[];
  inaturalist_taxon_id?: number;
  gbif_taxon_key?: number;
  provenance?: Record<string, any>;
}

export interface SpeciesListResponse {
  total: number;
  page: number;
  page_size: number;
  items: SpeciesSummary[];
}

export interface BreedSummary {
  id: string;
  common_name: string;
  scientific_name: string;
  category: 'domestic_breed';
  rank: string;
  parent_id?: string | null;
  registry: string;
  registry_url: string;
  origin?: string;
  body_type?: string;
  coat_length?: string;
  coat_pattern?: string;
  description?: string;
  thumbnail_url?: string;
  image_url?: string;
  image_attribution?: string;
  registry_verified?: string;
}

export interface BreedDetail extends BreedSummary {
  development?: string;
  provenance?: Record<string, any>;
}

export interface BreedListResponse {
  total: number;
  page: number;
  page_size: number;
  items: BreedSummary[];
}

export interface HybridSummary {
  id: string;
  common_name: string;
  scientific_name: string;
  category: 'hybrid';
  rank: string;
  parents: string[];
  parent_names: string[];
  description: string;
  note: string;
  thumbnail_url?: string;
  image_url?: string;
  image_attribution?: string;
}

export interface HybridDetail extends HybridSummary {
  provenance?: Record<string, any>;
}

export interface HybridListResponse {
  total: number;
  items: HybridSummary[];
}

export interface BreedRegistryInfo {
  name: string;
  url: string;
  verification?: string;
  note?: string;
}

export interface CatalogMeta {
  authority: string;
  reference: string;
  year: number;
  url: string;
  taxonomy_note: string;
  breed_note: string;
  hybrid_note: string;
  updated: string;
  wild_species_count: number;
  domestic_species_count: number;
  species_count: number;
  breed_count: number;
  hybrid_count: number;
  lineage_count: number;
  breed_registry: BreedRegistryInfo;
}

export type TaxonDetail = SpeciesDetail | BreedDetail | HybridDetail;

export interface ObservationItem {
  id: string;
  species_name: string;
  scientific_name: string;
  observed_on?: string;
  broad_location: string;
  image_url?: string;
  quality_grade: string;
  source: string;
  source_url: string;
  coordinates_obscured: boolean;
}

export interface ObservationListResponse {
  total: number;
  observations: ObservationItem[];
  disclaimer: string;
}

export interface CollectionSpeciesItem {
  id: string;
  common_name: string;
  scientific_name: string;
  subfamily: string;
  lineage: string;
  genus: string;
  rarity: string;
  xp_reward: number;
  thumbnail_url: string;
  is_wild: boolean;
  category: TaxonCategory;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  required_count: number;
  category: string;
}

export interface RankTier {
  rank: number;
  title: string;
  min_xp: number;
  badge_icon: string;
  description: string;
}

export interface CollectionMetaResponse {
  species: CollectionSpeciesItem[];
  badges: Badge[];
  ranks: RankTier[];
}

export interface DiscoveryRecord {
  species_id: string;
  discovered_at: string;
  confidence_score: number;
  image_preview?: string;
  xp_earned: number;
}

export type ActivePage =
  | 'home'
  | 'identify'
  | 'species'
  | 'species-detail'
  | 'collection'
  | 'observations'
  | 'methodology';
