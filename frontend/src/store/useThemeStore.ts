import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  applyThemeToDocument,
  getSystemTheme,
  loadThemePreference,
  ResolvedTheme,
  resolveTheme,
  saveThemePreference,
  ThemePreference,
} from './themeStorage';

export type { ResolvedTheme, ThemePreference } from './themeStorage';

interface ThemeSnapshot {
  preference: ThemePreference;
  systemTheme: ResolvedTheme;
  resolvedTheme: ResolvedTheme;
}

let currentSnapshot: ThemeSnapshot | null = null;
const listeners = new Set<() => void>();
let mediaCleanup: (() => void) | null = null;

function buildSnapshot(
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ThemeSnapshot {
  return {
    preference,
    systemTheme,
    resolvedTheme: resolveTheme(preference, systemTheme),
  };
}

function attachMediaListener(): void {
  if (
    mediaCleanup !== null ||
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return;
  }

  try {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const base = getSnapshot();
      const nextSystem = getSystemTheme();
      if (nextSystem === base.systemTheme) return;
      const next = buildSnapshot(base.preference, nextSystem);
      currentSnapshot = next;
      applyThemeToDocument(next.resolvedTheme);
      for (const listener of listeners) listener();
    };

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', handleChange);
      mediaCleanup = () => query.removeEventListener('change', handleChange);
    } else if (typeof query.addListener === 'function') {
      query.addListener(handleChange);
      mediaCleanup = () => query.removeListener(handleChange);
    }
  } catch {
    // Environments without full MediaQueryList support fall back cleanly.
  }
}

function getSnapshot(): ThemeSnapshot {
  if (currentSnapshot === null) {
    const preference = loadThemePreference();
    const systemTheme = getSystemTheme();
    currentSnapshot = buildSnapshot(preference, systemTheme);
    applyThemeToDocument(currentSnapshot.resolvedTheme);
    attachMediaListener();
  }
  return currentSnapshot;
}

function subscribe(listener: () => void): () => void {
  attachMediaListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setThemePreference(preference: ThemePreference): void {
  const prev = getSnapshot();
  const next = buildSnapshot(preference, getSystemTheme());
  saveThemePreference(preference);
  applyThemeToDocument(next.resolvedTheme);
  if (
    prev.preference === next.preference &&
    prev.resolvedTheme === next.resolvedTheme &&
    prev.systemTheme === next.systemTheme
  ) {
    return;
  }
  currentSnapshot = next;
  for (const listener of listeners) listener();
}

export function resetThemeStoreCache(): void {
  currentSnapshot = null;
  if (mediaCleanup) {
    try {
      mediaCleanup();
    } catch {
      // Ignore cleanup failures if matchMedia stub was replaced
    }
    mediaCleanup = null;
  }
}

const PREFERENCE_ORDER: ThemePreference[] = ['light', 'system', 'dark'];

export function useThemeStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    applyThemeToDocument(snapshot.resolvedTheme);
  }, [snapshot.resolvedTheme]);

  const setPreference = useCallback((preference: ThemePreference) => {
    setThemePreference(preference);
  }, []);

  const cyclePreference = useCallback(() => {
    const current = getSnapshot().preference;
    const idx = PREFERENCE_ORDER.indexOf(current);
    const next = PREFERENCE_ORDER[(idx + 1) % PREFERENCE_ORDER.length];
    setThemePreference(next);
  }, []);

  return {
    preference: snapshot.preference,
    systemTheme: snapshot.systemTheme,
    resolvedTheme: snapshot.resolvedTheme,
    setPreference,
    cyclePreference,
  };
}
