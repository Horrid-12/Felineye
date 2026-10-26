import { describe, it, expect, vi } from 'vitest';
import {
  awardDiscovery,
  createEmptyCollectionState,
  LEGACY_STORAGE_KEYS,
  loadCollectionState,
  normalizeCollectionState,
  STORAGE_KEY,
} from '../store/collectionStorage';

describe('collectionStorage', () => {
  it('awards XP once for a new species and records its image fingerprint', () => {
    const { state, outcome } = awardDiscovery(createEmptyCollectionState(), {
      speciesId: 'panthera-tigris',
      confidence: 0.36,
      xpReward: 350,
      imageFingerprint: 'fingerprint-a',
      now: '2026-01-01T00:00:00.000Z',
    });

    expect(outcome.kind).toBe('new_species');
    expect(outcome.earnedXp).toBe(350);
    expect(state.totalXp).toBe(350);
    expect(state.discoveries['panthera-tigris'].image_fingerprints).toEqual(['fingerprint-a']);
    expect(state.discoveries['panthera-tigris'].photo_count).toBe(1);
  });

  it('treats a repeated image as a no-op with no duplicate XP', () => {
    const first = awardDiscovery(createEmptyCollectionState(), {
      speciesId: 'panthera-tigris',
      confidence: 0.36,
      xpReward: 350,
      imageFingerprint: 'fingerprint-a',
    });

    const second = awardDiscovery(first.state, {
      speciesId: 'panthera-tigris',
      confidence: 0.36,
      xpReward: 350,
      imageFingerprint: 'fingerprint-a',
    });

    expect(second.outcome.kind).toBe('repeat_image');
    expect(second.outcome.earnedXp).toBe(0);
    expect(second.state).toBe(first.state);
    expect(second.state.totalXp).toBe(350);
  });

  it('logs a different photo of a known species without awarding XP again', () => {
    const first = awardDiscovery(createEmptyCollectionState(), {
      speciesId: 'panthera-tigris',
      confidence: 0.36,
      xpReward: 350,
      imageFingerprint: 'fingerprint-a',
    });

    const second = awardDiscovery(first.state, {
      speciesId: 'panthera-tigris',
      confidence: 0.41,
      xpReward: 350,
      imageFingerprint: 'fingerprint-b',
    });

    expect(second.outcome.kind).toBe('new_photo');
    expect(second.outcome.earnedXp).toBe(0);
    expect(second.outcome.photoCount).toBe(2);
    expect(second.state.totalXp).toBe(350);
    expect(second.state.discoveries['panthera-tigris'].image_fingerprints).toEqual([
      'fingerprint-a',
      'fingerprint-b',
    ]);
    expect(second.state.discoveries['panthera-tigris'].confidence_score).toBe(0.41);
  });

  it('accumulates XP across distinct species only', () => {
    let state = createEmptyCollectionState();
    state = awardDiscovery(state, {
      speciesId: 'panthera-tigris',
      confidence: 0.36,
      xpReward: 350,
      imageFingerprint: 'a',
    }).state;
    state = awardDiscovery(state, {
      speciesId: 'felis-catus',
      confidence: 0.34,
      xpReward: 50,
      imageFingerprint: 'b',
    }).state;
    state = awardDiscovery(state, {
      speciesId: 'panthera-tigris',
      confidence: 0.4,
      xpReward: 350,
      imageFingerprint: 'c',
    }).state;

    expect(state.totalXp).toBe(400);
    expect(Object.keys(state.discoveries)).toHaveLength(2);
  });

  it('never awards a negative XP reward', () => {
    const { state, outcome } = awardDiscovery(createEmptyCollectionState(), {
      speciesId: 'felis-catus',
      confidence: 0.3,
      xpReward: -100,
      imageFingerprint: 'a',
    });

    expect(outcome.earnedXp).toBe(0);
    expect(state.totalXp).toBe(0);
  });

  it('migrates legacy records and recomputes the XP total from records', () => {
    const normalized = normalizeCollectionState({
      totalXp: 99999,
      discoveries: {
        'panthera-leo': {
          species_id: 'panthera-leo',
          discovered_at: '2025-01-01T00:00:00.000Z',
          confidence_score: 0.88,
          xp_earned: 300,
        },
      },
    });

    expect(normalized.totalXp).toBe(300);
    expect(normalized.discoveries['panthera-leo'].photo_count).toBe(1);
    expect(normalized.discoveries['panthera-leo'].image_fingerprints).toEqual([]);
  });

  it('returns an empty state for corrupt or missing storage', () => {
    const corrupt = { getItem: vi.fn(() => '{not valid json') };
    expect(loadCollectionState(corrupt)).toEqual(createEmptyCollectionState());

    const missing = { getItem: vi.fn(() => null) };
    expect(loadCollectionState(missing)).toEqual(createEmptyCollectionState());
    expect(missing.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('reads a pre-rename journal through the legacy storage key', () => {
    const legacyState = JSON.stringify({
      totalXp: 300,
      discoveries: {
        'panthera-leo': {
          species_id: 'panthera-leo',
          discovered_at: '2025-01-01T00:00:00.000Z',
          confidence_score: 0.35,
          xp_earned: 300,
        },
      },
    });

    const storage = {
      getItem: vi.fn((key: string) => (key === LEGACY_STORAGE_KEYS[0] ? legacyState : null)),
    };

    const state = loadCollectionState(storage);

    expect(state.totalXp).toBe(300);
    expect(state.discoveries['panthera-leo']).toBeDefined();
    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(storage.getItem).toHaveBeenCalledWith(LEGACY_STORAGE_KEYS[0]);
  });
});
