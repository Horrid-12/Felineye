import { DiscoveryRecord } from '../types';

export const STORAGE_KEY = 'felidlens_discovery_store_v1';

export interface CollectionState {
  discoveries: Record<string, DiscoveryRecord>;
  totalXp: number;
}

export interface DiscoveryAwardInput {
  speciesId: string;
  /** Model score; persisted for the journal, never treated as a probability. */
  confidence: number;
  /** Server-computed reward. Zero means no reward is due. */
  xpReward: number;
  /** SHA-256 of the uploaded bytes, supplied by the server. */
  imageFingerprint?: string | null;
  imagePreview?: string;
  /** Injectable clock for deterministic tests. */
  now?: string;
}

export type DiscoveryAwardKind = 'new_species' | 'new_photo' | 'repeat_image';

export interface DiscoveryAwardOutcome {
  kind: DiscoveryAwardKind;
  speciesId: string;
  earnedXp: number;
  isNewSpecies: boolean;
  totalXp: number;
  photoCount: number;
}

export interface DiscoveryAwardResult {
  state: CollectionState;
  outcome: DiscoveryAwardOutcome;
}

export function createEmptyCollectionState(): CollectionState {
  return { discoveries: {}, totalXp: 0 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Repair a persisted record written by an older version of the store. */
export function normalizeDiscoveryRecord(raw: unknown, speciesId: string): DiscoveryRecord | null {
  if (!isRecord(raw)) return null;

  const fingerprints = Array.isArray(raw.image_fingerprints)
    ? raw.image_fingerprints.filter((value): value is string => typeof value === 'string')
    : [];

  const confidence =
    typeof raw.confidence_score === 'number' && Number.isFinite(raw.confidence_score)
      ? raw.confidence_score
      : 0;
  const xpEarned =
    typeof raw.xp_earned === 'number' && Number.isFinite(raw.xp_earned) && raw.xp_earned >= 0
      ? raw.xp_earned
      : 0;
  const photoCount =
    typeof raw.photo_count === 'number' && Number.isFinite(raw.photo_count) && raw.photo_count >= 1
      ? Math.floor(raw.photo_count)
      : Math.max(1, fingerprints.length);

  return {
    species_id: typeof raw.species_id === 'string' ? raw.species_id : speciesId,
    discovered_at: typeof raw.discovered_at === 'string' ? raw.discovered_at : new Date(0).toISOString(),
    confidence_score: confidence,
    image_preview: typeof raw.image_preview === 'string' ? raw.image_preview : undefined,
    xp_earned: xpEarned,
    image_fingerprints: fingerprints,
    photo_count: photoCount,
    last_seen_at: typeof raw.last_seen_at === 'string' ? raw.last_seen_at : undefined,
  };
}

/** Parse persisted state without trusting its shape or totals. */
export function normalizeCollectionState(raw: unknown): CollectionState {
  if (!isRecord(raw) || !isRecord(raw.discoveries)) {
    return createEmptyCollectionState();
  }

  const discoveries: Record<string, DiscoveryRecord> = {};
  for (const [speciesId, value] of Object.entries(raw.discoveries)) {
    const record = normalizeDiscoveryRecord(value, speciesId);
    if (record) discoveries[speciesId] = record;
  }

  // XP is always the sum of the persisted per-species rewards. This keeps the
  // total idempotent even if a previous tab wrote an inconsistent value.
  const totalXp = Object.values(discoveries).reduce(
    (sum, record) => sum + Math.max(0, record.xp_earned),
    0,
  );

  return { discoveries, totalXp };
}

export function loadCollectionState(storage?: Pick<Storage, 'getItem'>): CollectionState {
  try {
    const target = storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
    if (!target) return createEmptyCollectionState();
    const saved = target.getItem(STORAGE_KEY);
    if (!saved) return createEmptyCollectionState();
    return normalizeCollectionState(JSON.parse(saved));
  } catch (error) {
    console.warn('Failed to read collection from localStorage:', error);
    return createEmptyCollectionState();
  }
}

/**
 * Pure, atomic discovery transition.
 *
 * - A species is rewarded exactly once (`new_species`).
 * - A *different* photo of an already-discovered species is logged without XP
 *   (`new_photo`), so galleries can grow without farming rewards.
 * - Re-submitting the same image fingerprint is a no-op (`repeat_image`).
 *
 * Callers must only pass results the server marked `is_discovery_eligible`.
 * The returned `state` is the *same object* when nothing changed, which lets the
 * store skip re-rendering and redundant persistence.
 */
export function awardDiscovery(
  state: CollectionState,
  input: DiscoveryAwardInput,
): DiscoveryAwardResult {
  const now = input.now ?? new Date().toISOString();
  const fingerprint = input.imageFingerprint?.trim() || undefined;
  const xpReward =
    Number.isFinite(input.xpReward) && input.xpReward > 0 ? Math.floor(input.xpReward) : 0;
  const confidence =
    Number.isFinite(input.confidence) && input.confidence >= 0 ? input.confidence : 0;

  const existing = state.discoveries[input.speciesId];

  if (!existing) {
    const record: DiscoveryRecord = {
      species_id: input.speciesId,
      discovered_at: now,
      confidence_score: confidence,
      image_preview: input.imagePreview,
      xp_earned: xpReward,
      image_fingerprints: fingerprint ? [fingerprint] : [],
      photo_count: 1,
      last_seen_at: now,
    };

    return {
      state: {
        discoveries: { ...state.discoveries, [input.speciesId]: record },
        totalXp: state.totalXp + xpReward,
      },
      outcome: {
        kind: 'new_species',
        speciesId: input.speciesId,
        earnedXp: xpReward,
        isNewSpecies: true,
        totalXp: state.totalXp + xpReward,
        photoCount: 1,
      },
    };
  }

  const knownFingerprints = existing.image_fingerprints ?? [];
  if (fingerprint && knownFingerprints.includes(fingerprint)) {
    return {
      state,
      outcome: {
        kind: 'repeat_image',
        speciesId: input.speciesId,
        earnedXp: 0,
        isNewSpecies: false,
        totalXp: state.totalXp,
        photoCount: existing.photo_count ?? Math.max(1, knownFingerprints.length),
      },
    };
  }

  const updated: DiscoveryRecord = {
    ...existing,
    confidence_score: Math.max(existing.confidence_score, confidence),
    image_fingerprints: fingerprint ? [...knownFingerprints, fingerprint] : knownFingerprints,
    photo_count: (existing.photo_count ?? Math.max(1, knownFingerprints.length)) + 1,
    last_seen_at: now,
  };

  return {
    state: {
      discoveries: { ...state.discoveries, [input.speciesId]: updated },
      totalXp: state.totalXp,
    },
    outcome: {
      kind: 'new_photo',
      speciesId: input.speciesId,
      earnedXp: 0,
      isNewSpecies: false,
      totalXp: state.totalXp,
      photoCount: updated.photo_count ?? 1,
    },
  };
}
