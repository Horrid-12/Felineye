import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  resetCollectionStoreCache,
  useCollectionStore,
} from '../store/useCollectionStore';

// Mock localStorage storage map
let store: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    store = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useCollectionStore hook', () => {
  beforeEach(() => {
    store = {};
    vi.clearAllMocks();
    resetCollectionStoreCache();
  });

  it('initializes with zero discoveries and Rank 1 Kitten Scout', () => {
    const { result } = renderHook(() => useCollectionStore());
    expect(result.current.discoveryCount).toBe(0);
    expect(result.current.totalXp).toBe(0);
    expect(result.current.currentRank.rank).toBe(1);
    expect(result.current.currentRank.title).toBe('Kitten Scout');
  });

  it('awards XP on a new species and refuses a repeat image', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      const outcome = result.current.recordDiscovery({
        speciesId: 'panthera-leo',
        confidence: 0.35,
        xpReward: 300,
        imageFingerprint: 'image-one',
      });
      expect(outcome.kind).toBe('new_species');
      expect(outcome.earnedXp).toBe(300);
    });

    expect(result.current.discoveryCount).toBe(1);
    expect(result.current.totalXp).toBe(300);
    expect(result.current.isDiscovered('panthera-leo')).toBe(true);

    act(() => {
      const outcome = result.current.recordDiscovery({
        speciesId: 'panthera-leo',
        confidence: 0.35,
        xpReward: 300,
        imageFingerprint: 'image-one',
      });
      expect(outcome.kind).toBe('repeat_image');
      expect(outcome.earnedXp).toBe(0);
    });

    expect(result.current.discoveryCount).toBe(1);
    expect(result.current.totalXp).toBe(300);
  });

  it('counts a new photo of a known species without duplicating XP', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.recordDiscovery({
        speciesId: 'panthera-leo',
        confidence: 0.35,
        xpReward: 300,
        imageFingerprint: 'image-one',
      });
    });

    act(() => {
      const outcome = result.current.recordDiscovery({
        speciesId: 'panthera-leo',
        confidence: 0.39,
        xpReward: 300,
        imageFingerprint: 'image-two',
      });
      expect(outcome.kind).toBe('new_photo');
      expect(outcome.photoCount).toBe(2);
      expect(outcome.earnedXp).toBe(0);
    });

    expect(result.current.totalXp).toBe(300);
    expect(result.current.discoveries['panthera-leo'].photo_count).toBe(2);
  });

  it('is atomic when the same reward is recorded twice in one tick', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      const first = result.current.recordDiscovery({
        speciesId: 'panthera-tigris',
        confidence: 0.36,
        xpReward: 350,
        imageFingerprint: 'same-image',
      });
      const second = result.current.recordDiscovery({
        speciesId: 'panthera-tigris',
        confidence: 0.36,
        xpReward: 350,
        imageFingerprint: 'same-image',
      });
      expect(first.kind).toBe('new_species');
      expect(second.kind).toBe('repeat_image');
    });

    expect(result.current.totalXp).toBe(350);
    expect(result.current.discoveryCount).toBe(1);
  });

  it('shares one journal across mounted consumers', () => {
    const first = renderHook(() => useCollectionStore());
    const second = renderHook(() => useCollectionStore());

    act(() => {
      first.result.current.recordDiscovery({
        speciesId: 'panthera-onca',
        confidence: 0.33,
        xpReward: 275,
        imageFingerprint: 'jaguar-photo',
      });
    });

    expect(second.result.current.totalXp).toBe(275);
    expect(second.result.current.isDiscovered('panthera-onca')).toBe(true);
  });

  it('ranks up when XP milestones are reached', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.recordDiscovery({
        speciesId: 'panthera-tigris',
        confidence: 0.36,
        xpReward: 850,
        imageFingerprint: 'tiger-photo',
      });
    });

    expect(result.current.totalXp).toBe(850);
    expect(result.current.currentRank.rank).toBe(3);
    expect(result.current.currentRank.title).toBe('Cat Whisperer');
  });

  it('clears progress and persists the empty journal', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.recordDiscovery({
        speciesId: 'felis-catus',
        confidence: 0.34,
        xpReward: 50,
        imageFingerprint: 'cat-photo',
      });
    });
    expect(result.current.totalXp).toBe(50);

    act(() => {
      result.current.clearProgress();
    });

    expect(result.current.totalXp).toBe(0);
    expect(result.current.discoveryCount).toBe(0);
  });
});
