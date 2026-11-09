import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import confetti from 'canvas-confetti';
import { IdentifyPage } from '../pages/IdentifyPage';
import { api } from '../services/api';
import { resetCollectionStoreCache } from '../store/useCollectionStore';
import { STORAGE_KEY } from '../store/collectionStorage';
import {
  BreedPrediction,
  CandidatePrediction,
  IdentificationResult,
} from '../types';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../services/api', () => ({
  api: { identifyImage: vi.fn() },
}));

const mockIdentify = vi.mocked(api.identifyImage);
const mockConfetti = vi.mocked(confetti);

// Node 22+ exposes a partial global `localStorage` that lacks `clear()`.
// Use a tiny in-memory implementation so the collection store behaves exactly
// like it does in a browser.
const memoryStorage = new Map<string, string>();
const localStorageMock: Storage = {
  getItem: (key) => memoryStorage.get(key) ?? null,
  setItem: (key, value) => {
    memoryStorage.set(key, String(value));
  },
  removeItem: (key) => {
    memoryStorage.delete(key);
  },
  clear: () => {
    memoryStorage.clear();
  },
  key: (index) => Array.from(memoryStorage.keys())[index] ?? null,
  get length() {
    return memoryStorage.size;
  },
};

const domesticCandidate: CandidatePrediction = {
  species_id: 'felis-catus',
  common_name: 'Domestic Cat',
  scientific_name: 'Felis catus',
  confidence_score: 0.36,
  score_percentage: 36,
  is_wild: false,
  conservation_status: 'LC',
  thumbnail_url: 'https://example.com/domestic-cat.jpg',
  category: 'domestic_species',
  rationale: 'BioCLIP image-text similarity for Felis catus.',
  xp_reward: 50,
  score_semantics: 'bioclip_image_text_cosine_similarity',
};

const wildCandidate: CandidatePrediction = {
  ...domesticCandidate,
  species_id: 'leopardus-wiedii',
  common_name: 'Margay',
  scientific_name: 'Leopardus wiedii',
  confidence_score: 0.31,
  score_percentage: 31,
  is_wild: true,
  conservation_status: 'NT',
  category: 'wild_species',
  xp_reward: 180,
};

const britishShorthair: BreedPrediction = {
  breed_id: 'british-shorthair',
  common_name: 'British Shorthair',
  scientific_name: 'Felis catus',
  confidence_score: 0.97,
  score_percentage: 97,
  category: 'domestic_breed',
  thumbnail_url: 'https://example.com/british-shorthair.jpg',
  rationale: 'Breed-classifier softmax score for British Shorthair.',
  score_semantics: 'breed_classifier_softmax',
  model_label: 'British Shorthair',
  is_estimate: true,
};

function makeResult(overrides: Partial<IdentificationResult> = {}): IdentificationResult {
  return {
    status: 'identified_domestic_cat',
    top_candidate: domesticCandidate,
    candidates: [domesticCandidate],
    breed: null,
    breed_candidates: [],
    breed_note: null,
    score_semantics: 'bioclip_image_text_cosine_similarity',
    is_calibrated: false,
    is_mock: false,
    is_discovery_eligible: true,
    xp_reward: 50,
    image_fingerprint: 'fp-new',
    model_name: 'BioCLIP ViT-B/16',
    model_license: 'MIT',
    processing_time_ms: 123,
    image_metadata: {},
    disclaimer: 'Model scores are similarities, not calibrated probabilities.',
    ...overrides,
  };
}

function seedDiscovery(fingerprints: string[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      discoveries: {
        'felis-catus': {
          species_id: 'felis-catus',
          discovered_at: '2026-01-01T00:00:00.000Z',
          confidence_score: 0.4,
          xp_earned: 50,
          image_fingerprints: fingerprints,
          photo_count: fingerprints.length,
          last_seen_at: '2026-01-01T00:00:00.000Z',
        },
      },
      totalXp: 50,
    })
  );
}

async function selectAndAnalyze(container: HTMLElement): Promise<void> {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['fake-image-bytes'], 'cat.jpg', { type: 'image/jpeg' });
  fireEvent.change(input, { target: { files: [file] } });

  const analyze = await screen.findByText('ANALYZE FELINE MORPHOLOGY');
  await act(async () => {
    fireEvent.click(analyze);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true,
  });
  memoryStorage.clear();
  resetCollectionStoreCache();
  (URL as any).createObjectURL = vi.fn(() => 'blob:mock-preview');
  (URL as any).revokeObjectURL = vi.fn();
});

describe('IdentifyPage integration', () => {
  it('renders a domestic-cat result with a closest breed match and awards XP once', async () => {
    mockIdentify.mockResolvedValue(
      makeResult({
        breed: britishShorthair,
        breed_candidates: [britishShorthair],
        breed_note:
          'Closest visual match: British Shorthair (97% similarity). This is not pedigree verification.',
        uncertainty_note:
          'Domestic cat (Felis catus) identified at species level. The closest visual breed match is shown below as similarity, not pedigree verification.',
      })
    );

    const { container } = render(
      <IdentifyPage setActivePage={vi.fn()} onSelectSpecies={vi.fn()} />
    );
    await selectAndAnalyze(container);

    expect(await screen.findByText('DOMESTIC CAT IDENTIFIED')).toBeDefined();
    expect(screen.getByText('CLOSEST VISUAL MATCH')).toBeDefined();
    expect(screen.getByText('British Shorthair')).toBeDefined();
    expect(screen.getByText('97%')).toBeDefined();
    expect(
      screen.getAllByText(/not pedigree verification/i).length
    ).toBeGreaterThan(0);

    // Reward notice is driven by the server-authoritative fields.
    expect(screen.getByText('NEW SPECIES LOGGED IN FIELD JOURNAL!')).toBeDefined();
    expect(screen.getByText(/Awarded \+50 Discovery XP/)).toBeDefined();
    expect(mockConfetti).toHaveBeenCalledTimes(1);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.totalXp).toBe(50);
    expect(stored.discoveries['felis-catus']).toBeDefined();
    expect(stored.discoveries['felis-catus'].image_fingerprints).toEqual(['fp-new']);
  });

  it('shows an uncertain result as abstained and never awards XP', async () => {
    mockIdentify.mockResolvedValue(
      makeResult({
        status: 'unable_to_identify',
        top_candidate: null,
        candidates: [wildCandidate, domesticCandidate],
        is_discovery_eligible: false,
        xp_reward: 0,
        uncertainty_note:
          'Evidence was insufficient or conflicting. The closest candidates are listed for comparison; no species is asserted.',
      })
    );

    const { container } = render(
      <IdentifyPage setActivePage={vi.fn()} onSelectSpecies={vi.fn()} />
    );
    await selectAndAnalyze(container);

    expect(
      await screen.findByText('UNABLE TO IDENTIFY — RESULT WITHHELD')
    ).toBeDefined();
    expect(screen.getByText(/no species is asserted/i)).toBeDefined();
    expect(
      screen.getByText('CANDIDATES FOR COMPARISON (NOT ASSERTED)')
    ).toBeDefined();
    expect(screen.queryByText('NEW SPECIES LOGGED IN FIELD JOURNAL!')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('shows a non-feline result without a discovery notice', async () => {
    mockIdentify.mockResolvedValue(
      makeResult({
        status: 'non_feline_detected',
        top_candidate: null,
        candidates: [],
        is_discovery_eligible: false,
        xp_reward: 0,
        uncertainty_note:
          'The image was not found to contain a cat or wild felid with sufficient evidence.',
      })
    );

    const { container } = render(
      <IdentifyPage setActivePage={vi.fn()} onSelectSpecies={vi.fn()} />
    );
    await selectAndAnalyze(container);

    expect(await screen.findByText('NO FELINE DETECTED')).toBeDefined();
    expect(
      screen.queryByText('NEW SPECIES LOGGED IN FIELD JOURNAL!')
    ).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('shows the model-unavailable panel with the setup hint', async () => {
    mockIdentify.mockResolvedValue(
      makeResult({
        status: 'model_unavailable',
        top_candidate: null,
        candidates: [],
        is_discovery_eligible: false,
        xp_reward: 0,
        uncertainty_note: 'No real model is available.',
        model_setup_hint:
          'backend\\scripts\\setup_identification_models.py --imagenet --bioclip',
      })
    );

    const { container } = render(
      <IdentifyPage setActivePage={vi.fn()} onSelectSpecies={vi.fn()} />
    );
    await selectAndAnalyze(container);

    expect(
      await screen.findByText('IDENTIFICATION MODEL NOT AVAILABLE')
    ).toBeDefined();
    expect(screen.getByText(/No real model is available/)).toBeDefined();
    expect(screen.getByText(/setup_identification_models\.py/)).toBeDefined();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('surfaces an API error without rendering a result', async () => {
    mockIdentify.mockRejectedValue(
      new Error('Upload rejected: the file is not a decodable image.')
    );

    const { container } = render(
      <IdentifyPage setActivePage={vi.fn()} onSelectSpecies={vi.fn()} />
    );
    await selectAndAnalyze(container);

    expect(
      await screen.findByText('IDENTIFICATION FAILED // REQUEST REJECTED')
    ).toBeDefined();
    expect(
      screen.getByText(/the file is not a decodable image/i)
    ).toBeDefined();
    expect(screen.queryByText('DOMESTIC CAT IDENTIFIED')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('logs a new photo for an already-discovered species without duplicate XP', async () => {
    seedDiscovery(['fp-old']);
    resetCollectionStoreCache();

    mockIdentify.mockResolvedValue(makeResult({ image_fingerprint: 'fp-new' }));

    const { container } = render(
      <IdentifyPage setActivePage={vi.fn()} onSelectSpecies={vi.fn()} />
    );
    await selectAndAnalyze(container);

    expect(
      await screen.findByText('NEW PHOTO LOGGED — SPECIES ALREADY DISCOVERED')
    ).toBeDefined();
    expect(
      screen.getByText(/No duplicate XP for an already-discovered species/i)
    ).toBeDefined();
    expect(mockConfetti).not.toHaveBeenCalled();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.totalXp).toBe(50);
    expect(stored.discoveries['felis-catus'].photo_count).toBe(2);
    expect(stored.discoveries['felis-catus'].image_fingerprints).toEqual([
      'fp-old',
      'fp-new',
    ]);
  });

  it('treats a repeat image fingerprint as a no-op', async () => {
    seedDiscovery(['fp-repeat']);
    resetCollectionStoreCache();

    mockIdentify.mockResolvedValue(makeResult({ image_fingerprint: 'fp-repeat' }));

    const { container } = render(
      <IdentifyPage setActivePage={vi.fn()} onSelectSpecies={vi.fn()} />
    );
    await selectAndAnalyze(container);

    expect(
      await screen.findByText('THIS PHOTO WAS ALREADY ANALYSED')
    ).toBeDefined();
    expect(screen.getByText(/No duplicate XP was awarded/i)).toBeDefined();
    expect(mockConfetti).not.toHaveBeenCalled();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.totalXp).toBe(50);
    expect(stored.discoveries['felis-catus'].photo_count).toBe(1);
  });

  it('resets the scanner after a result', async () => {
    mockIdentify.mockResolvedValue(makeResult());

    const { container } = render(
      <IdentifyPage setActivePage={vi.fn()} onSelectSpecies={vi.fn()} />
    );
    await selectAndAnalyze(container);

    await screen.findByText('DOMESTIC CAT IDENTIFIED');
    fireEvent.click(screen.getByText('Upload Another Cat Photo'));

    await waitFor(() => {
      expect(screen.queryByText('DOMESTIC CAT IDENTIFIED')).toBeNull();
    });
    expect(screen.getByText('DROP FELINE PHOTOGRAPH HERE')).toBeDefined();
  });
});
