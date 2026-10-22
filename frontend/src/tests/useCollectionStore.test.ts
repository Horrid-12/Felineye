import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollectionStore } from '../store/useCollectionStore';

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
  });

  it('initializes with zero discoveries and Rank 1 Kitten Scout', () => {
    const { result } = renderHook(() => useCollectionStore());
    expect(result.current.discoveryCount).toBe(0);
    expect(result.current.totalXp).toBe(0);
    expect(result.current.currentRank.rank).toBe(1);
    expect(result.current.currentRank.title).toBe('Kitten Scout');
  });

  it('awards XP on new discovery and prevents double-awarding on repeat identification', () => {
    const { result } = renderHook(() => useCollectionStore());

    // First discovery
    act(() => {
      const outcome = result.current.unlockDiscovery('panthera-leo', 0.95, 300);
      expect(outcome.isNew).toBe(true);
      expect(outcome.earnedXp).toBe(300);
    });

    expect(result.current.discoveryCount).toBe(1);
    expect(result.current.totalXp).toBe(300);
    expect(result.current.isDiscovered('panthera-leo')).toBe(true);

    // Repeated action for the same species should NOT award duplicate XP
    act(() => {
      const outcome2 = result.current.unlockDiscovery('panthera-leo', 0.92, 300);
      expect(outcome2.isNew).toBe(false);
      expect(outcome2.earnedXp).toBe(0);
    });

    expect(result.current.discoveryCount).toBe(1);
    expect(result.current.totalXp).toBe(300);
  });

  it('ranks up when XP milestones are reached', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.unlockDiscovery('tiger', 0.9, 850);
    });

    expect(result.current.totalXp).toBe(850);
    expect(result.current.currentRank.rank).toBe(3);
    expect(result.current.currentRank.title).toBe('Cat Whisperer');
  });
});
