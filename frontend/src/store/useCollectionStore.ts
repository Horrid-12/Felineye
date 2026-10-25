import { useCallback, useSyncExternalStore } from 'react';
import { RankTier } from '../types';
import {
  awardDiscovery,
  CollectionState,
  createEmptyCollectionState,
  DiscoveryAwardInput,
  DiscoveryAwardOutcome,
  loadCollectionState,
  STORAGE_KEY,
} from './collectionStorage';

export type { CollectionState } from './collectionStorage';

const DEFAULT_RANKS: RankTier[] = [
  { rank: 1, title: 'Kitten Scout', min_xp: 0, badge_icon: 'Eye', description: 'Beginning your journey into the world of cats.' },
  { rank: 2, title: 'Curious Prowler', min_xp: 300, badge_icon: 'Footprints', description: 'Skilled at identifying common and domestic felids.' },
  { rank: 3, title: 'Cat Whisperer', min_xp: 800, badge_icon: 'Compass', description: 'Recognizing wild lineages and specialized feline habitats.' },
  { rank: 4, title: 'Velvet Stalker', min_xp: 1600, badge_icon: 'Sunrise', description: 'Mastering wild cats of the open biomes and forests.' },
  { rank: 5, title: 'Panthera Master', min_xp: 2800, badge_icon: 'Flame', description: 'Tracking apex big cats and elusive predators.' },
  { rank: 6, title: 'Supreme Felid Sovereign', min_xp: 4500, badge_icon: 'Crown', description: 'Master of the Felidae kingdom, having documented the rarest cats on Earth.' },
];

// ---------------------------------------------------------------------------
// Module-level store
//
// A single source of truth shared by every hook consumer (Navbar, IdentifyPage,
// CollectionPage…). Updates are applied to the current snapshot synchronously,
// so two rapid identifications cannot both observe the same empty journal and
// award duplicate XP.
// ---------------------------------------------------------------------------

let currentState: CollectionState | null = null;
const listeners = new Set<() => void>();

function persist(state: CollectionState): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (error) {
    console.warn('Failed to persist collection to localStorage:', error);
  }
}

function getSnapshot(): CollectionState {
  if (currentState === null) {
    currentState = loadCollectionState();
  }
  return currentState;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: CollectionState): void {
  if (next === currentState) return;
  currentState = next;
  persist(next);
  for (const listener of listeners) listener();
}

/**
 * Discard the in-memory snapshot so the next read rehydrates from storage.
 * Intended for tests and for a deliberate hard reset.
 */
export function resetCollectionStoreCache(): void {
  currentState = null;
}

export function clearCollectionProgress(): void {
  commit(createEmptyCollectionState());
}

export function useCollectionStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  /**
   * Record a server-eligible identification.
   *
   * The caller must only invoke this when `result.is_discovery_eligible` is
   * true. Rewards are computed here from the server's `xp_reward`, never from
   * the presentation status, and are idempotent by species and image
   * fingerprint.
   */
  const recordDiscovery = useCallback(
    (input: DiscoveryAwardInput): DiscoveryAwardOutcome => {
      const { state: next, outcome } = awardDiscovery(getSnapshot(), input);
      commit(next);
      return outcome;
    },
    [],
  );

  const isDiscovered = useCallback(
    (speciesId: string): boolean => Boolean(getSnapshot().discoveries[speciesId]),
    [],
  );

  const currentRank = [...DEFAULT_RANKS]
    .reverse()
    .find((r) => state.totalXp >= r.min_xp) || DEFAULT_RANKS[0];

  const nextRank = DEFAULT_RANKS.find((r) => r.min_xp > state.totalXp) || null;

  const discoveryCount = Object.keys(state.discoveries).length;

  return {
    discoveries: state.discoveries,
    totalXp: state.totalXp,
    discoveryCount,
    currentRank,
    nextRank,
    isDiscovered,
    recordDiscovery,
    clearProgress: clearCollectionProgress,
  };
}
