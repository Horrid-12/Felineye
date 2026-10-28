export type IdentificationStatus =
  | 'identified_wild_species'
  | 'identified_domestic_cat'
  | 'identified_domestic_breed'
  | 'non_feline_detected'
  | 'unable_to_identify'
  | 'model_unavailable'
  | 'processing_error'
  | 'development_simulation';

export type TaxonCategory =
  | 'wild_species'
  | 'domestic_species'
  | 'domestic_breed'
  | 'hybrid';

export interface CandidatePrediction {
  species_id: string;
  common_name: string;
  scientific_name: string;
  /** Provider score. For BioCLIP this is a cosine similarity, not a probability. */
  confidence_score: number;
  score_percentage: number;
  is_wild: boolean;
  conservation_status: string;
  thumbnail_url: string;
  category?: TaxonCategory;
  rationale?: string;
  /** Catalog reward, paid only when the whole result is discovery-eligible. */
  xp_reward?: number;
  /** Human-readable description of what confidence_score means. */
  score_semantics?: string;
  /** Raw provider class/label, kept for diagnostics. */
  model_label?: string;
}

export interface BreedPrediction {
  breed_id: string;
  common_name: string;
  scientific_name: string;
  /** Breed-classifier softmax score. Not a calibrated probability. */
  confidence_score: number;
  score_percentage: number;
  category: 'domestic_breed';
  thumbnail_url: string;
  rationale?: string;
  score_semantics?: string;
  model_label?: string;
  /** Always true: a visual estimate, never pedigree verification. */
  is_estimate?: boolean;
}

export interface FelineGateDiagnostics {
  feline_detected?: boolean;
  feline_probability?: number;
  top_label?: string;
  top_probability?: number;
  non_feline_label?: string;
  non_feline_probability?: number;
  feline_evidence?: number;
  available?: boolean;
  error?: string | null;
  [key: string]: unknown;
}

export interface IdentificationQuality {
  low_quality?: boolean;
  flags?: string[];
  sharpness?: number;
  brightness?: number;
  contrast?: number;
  width?: number;
  height?: number;
}

export interface IdentificationResult {
  status: IdentificationStatus;
  top_candidate?: CandidatePrediction | null;
  candidates: CandidatePrediction[];
  /** Visual breed estimate for a domestic cat; null when not asserted. */
  breed?: BreedPrediction | null;
  /** Closest curated breed classes, shown for transparency. */
  breed_candidates?: BreedPrediction[];
  /** Why a breed was or was not asserted. Never a pedigree claim. */
  breed_note?: string | null;
  /** Mathematical meaning of the scores, e.g. a cosine similarity. */
  score_semantics: string;
  /** Only present when a provider returns a genuine probability distribution. */
  entropy?: number | null;
  is_calibrated?: boolean;
  is_mock: boolean;
  /** Server-authoritative: only real, successful species-level results qualify. */
  is_discovery_eligible?: boolean;
  xp_reward?: number;
  image_fingerprint?: string;
  model_name?: string;
  model_version?: string;
  model_license?: string;
  model_setup_hint?: string;
  feline_evidence?: number | null;
  feline_gate?: FelineGateDiagnostics | null;
  uncertainty_note?: string;
  processing_time_ms: number;
  image_metadata: Record<string, any>;
  quality?: IdentificationQuality;
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
  /** Highest model score observed for this species, not a calibrated probability. */
  confidence_score: number;
  image_preview?: string;
  xp_earned: number;
  /** Image fingerprints already accepted for this species (idempotency). */
  image_fingerprints?: string[];
  /** Number of distinct photos logged for this species. */
  photo_count?: number;
  last_seen_at?: string;
}

export type ActivePage =
  | 'home'
  | 'identify'
  | 'species'
  | 'species-detail'
  | 'collection'
  | 'observations'
  | 'methodology';
