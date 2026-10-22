export type IdentificationStatus =
  | 'high_confidence'
  | 'moderate_confidence'
  | 'uncertain'
  | 'non_felid_detected'
  | 'unsupported_image'
  | 'model_error';

export interface CandidatePrediction {
  species_id: string;
  common_name: string;
  scientific_name: string;
  confidence_score: number;
  score_percentage: number;
  is_wild: boolean;
  conservation_status: string;
  thumbnail_url: string;
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
}

export interface SpeciesListResponse {
  total: number;
  page: number;
  page_size: number;
  items: SpeciesSummary[];
}

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
