import { useState, useEffect } from 'react';
import { DiscoveryRecord, RankTier } from '../types';

const STORAGE_KEY = 'felidlens_discovery_store_v1';

export interface CollectionState {
  discoveries: Record<string, DiscoveryRecord>;
  totalXp: number;
}

const DEFAULT_RANKS: RankTier[] = [
  { rank: 1, title: 'Novice Observer', min_xp: 0, badge_icon: 'Eye', description: 'Beginning your journey into Felidae.' },
  { rank: 2, title: 'Field Tracker', min_xp: 300, badge_icon: 'Footprints', description: 'Skilled at identifying common felids.' },
  { rank: 3, title: 'Wildlife Scout', min_xp: 800, badge_icon: 'Compass', description: 'Recognizing wild lineages and specialized habitats.' },
  { rank: 4, title: 'Savanna Naturalist', min_xp: 1600, badge_icon: 'Sunrise', description: 'Mastering open biome felids.' },
  { rank: 5, title: 'Apex Biologist', min_xp: 2800, badge_icon: 'Flame', description: 'Tracking apex Panthera predators.' },
  { rank: 6, title: 'Legendary Warden', min_xp: 4500, badge_icon: 'Crown', description: 'Master of the Felidae kingdom.' },
];

export function useCollectionStore() {
  const [state, setState] = useState<CollectionState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to read collection from localStorage:', e);
    }
    return { discoveries: {}, totalXp: 0 };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to persist collection to localStorage:', e);
    }
  }, [state]);

  const unlockDiscovery = (
    speciesId: string,
    confidence: number,
    xpReward: number,
    imagePreview?: string
  ): { isNew: boolean; earnedXp: number } => {
    if (state.discoveries[speciesId]) {
      return { isNew: false, earnedXp: 0 };
    }

    const newRecord: DiscoveryRecord = {
      species_id: speciesId,
      discovered_at: new Date().toISOString(),
      confidence_score: confidence,
      image_preview: imagePreview,
      xp_earned: xpReward,
    };

    setState((prev) => ({
      discoveries: { ...prev.discoveries, [speciesId]: newRecord },
      totalXp: prev.totalXp + xpReward,
    }));

    return { isNew: true, earnedXp: xpReward };
  };

  const isDiscovered = (speciesId: string): boolean => {
    return Boolean(state.discoveries[speciesId]);
  };

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
    unlockDiscovery,
    clearProgress: () => setState({ discoveries: {}, totalXp: 0 }),
  };
}
