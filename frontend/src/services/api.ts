import {
  SpeciesListResponse,
  SpeciesDetail,
  BreedListResponse,
  BreedDetail,
  HybridListResponse,
  CatalogMeta,
  TaxonDetail,
  IdentificationResult,
  ObservationListResponse,
  CollectionMetaResponse,
  DatasetCandidate,
  DatasetReview,
  DatasetStats
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) {
        errorDetail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // Non-JSON response body
    }
    throw new ApiError(errorDetail, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getHealth(): Promise<{
    status: string;
    provider: string;
    provider_kind?: string;
    is_mock: boolean;
    model_available?: boolean;
    indexed_species_count: number;
    capabilities?: Record<string, unknown>;
  }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async identifyImage(file: File): Promise<IdentificationResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/identify`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<IdentificationResult>(res);
  },

  async getSpeciesList(params?: {
    search?: string;
    subfamily?: string;
    lineage?: string;
    conservation_status?: string;
    is_wild?: boolean;
    category?: 'wild_species' | 'domestic_species';
    habitat?: string;
    page?: number;
    page_size?: number;
  }): Promise<SpeciesListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.subfamily) query.set('subfamily', params.subfamily);
    if (params?.lineage) query.set('lineage', params.lineage);
    if (params?.conservation_status) query.set('conservation_status', params.conservation_status);
    if (params?.is_wild !== undefined) query.set('is_wild', String(params.is_wild));
    if (params?.category) query.set('category', params.category);
    if (params?.habitat) query.set('habitat', params.habitat);
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));

    const res = await fetch(`${API_BASE}/species?${query.toString()}`);
    return handleResponse<SpeciesListResponse>(res);
  },

  async getSpeciesDetail(slug: string): Promise<SpeciesDetail> {
    const res = await fetch(`${API_BASE}/species/${encodeURIComponent(slug)}`);
    return handleResponse<SpeciesDetail>(res);
  },

  async getTaxonDetail(slug: string): Promise<TaxonDetail> {
    const res = await fetch(`${API_BASE}/taxa/${encodeURIComponent(slug)}`);
    return handleResponse<TaxonDetail>(res);
  },

  async getFeaturedSpecies(): Promise<SpeciesDetail> {
    const res = await fetch(`${API_BASE}/species/featured/today`);
    return handleResponse<SpeciesDetail>(res);
  },

  async getBreeds(params?: {
    search?: string;
    registry?: string;
    page?: number;
    page_size?: number;
  }): Promise<BreedListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.registry) query.set('registry', params.registry);
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));

    const res = await fetch(`${API_BASE}/breeds?${query.toString()}`);
    return handleResponse<BreedListResponse>(res);
  },

  async getBreedDetail(slug: string): Promise<BreedDetail> {
    const res = await fetch(`${API_BASE}/breeds/${encodeURIComponent(slug)}`);
    return handleResponse<BreedDetail>(res);
  },

  async getCatalogMeta(): Promise<CatalogMeta> {
    const res = await fetch(`${API_BASE}/catalog/meta`);
    return handleResponse<CatalogMeta>(res);
  },

  async getHybrids(): Promise<HybridListResponse> {
    const res = await fetch(`${API_BASE}/catalog/hybrids`);
    return handleResponse<HybridListResponse>(res);
  },

  async getObservations(params?: {
    taxon_id?: number;
    place_id?: number;
    limit?: number;
  }): Promise<ObservationListResponse> {
    const query = new URLSearchParams();
    if (params?.taxon_id) query.set('taxon_id', String(params.taxon_id));
    if (params?.place_id) query.set('place_id', String(params.place_id));
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/observations?${query.toString()}`);
    return handleResponse<ObservationListResponse>(res);
  },

  async getCollectionMeta(): Promise<CollectionMetaResponse> {
    const res = await fetch(`${API_BASE}/collection/species`);
    return handleResponse<CollectionMetaResponse>(res);
  },

  async datasetLogin(reviewer: string): Promise<{ reviewer: string; session: string }> {
    const res = await fetch(`${API_BASE}/dataset-review/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer }),
    });
    return handleResponse(res);
  },

  async getDatasetStats(session: string): Promise<DatasetStats> {
    const res = await fetch(`${API_BASE}/dataset-review/stats`, {
      headers: { Authorization: `Bearer ${session}` },
    });
    return handleResponse(res);
  },

  async getDatasetCandidates(session: string, params?: {
    breed?: string; status?: string; source?: string; page?: number; page_size?: number;
  }): Promise<{ total: number; page: number; page_size: number; items: DatasetCandidate[] }> {
    const query = new URLSearchParams();
    if (params?.breed) query.set('breed', params.breed);
    if (params?.status) query.set('status', params.status);
    if (params?.source) query.set('source', params.source);
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    const res = await fetch(`${API_BASE}/dataset-review/candidates?${query}`, {
      headers: { Authorization: `Bearer ${session}` },
    });
    return handleResponse(res);
  },

  async getDatasetCandidate(session: string, id: string): Promise<{
    candidate: Record<string, any>; status: string; reviews: DatasetReview[]; image_url: string;
  }> {
    const res = await fetch(`${API_BASE}/dataset-review/candidates/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${session}` },
    });
    return handleResponse(res);
  },

  async submitDatasetReview(session: string, id: string, body: {
    decision: 'approved' | 'rejected' | 'ambiguous'; reason?: string; expected_reviews: number;
  }): Promise<{ review: DatasetReview; status: string }> {
    const res = await fetch(`${API_BASE}/dataset-review/candidates/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  }
};
