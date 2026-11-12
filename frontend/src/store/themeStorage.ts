export const THEME_STORAGE_KEY = 'felineye_theme_preference_v1';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_META_COLORS: Record<ResolvedTheme, string> = {
  light: '#F2E7D5',
  dark: '#241B29',
};

export function normalizeThemePreference(raw: unknown): ThemePreference {
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw;
  }
  return 'system';
}

export function loadThemePreference(
  storage?: Pick<Storage, 'getItem'> | null,
): ThemePreference {
  try {
    const target =
      storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
    if (!target || typeof target.getItem !== 'function') {
      return 'system';
    }
    return normalizeThemePreference(target.getItem(THEME_STORAGE_KEY));
  } catch (error) {
    console.warn('Failed to read theme preference from localStorage:', error);
    return 'system';
  }
}

export function saveThemePreference(
  preference: ThemePreference,
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  try {
    const target =
      storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
    if (!target || typeof target.setItem !== 'function') {
      return;
    }
    target.setItem(THEME_STORAGE_KEY, preference);
  } catch (error) {
    console.warn('Failed to persist theme preference to localStorage:', error);
  }
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

export function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme = getSystemTheme(),
): ResolvedTheme {
  return preference === 'system' ? systemTheme : preference;
}

export function applyThemeToDocument(
  resolved: ResolvedTheme,
  doc?: Document | null,
): void {
  const targetDoc = doc ?? (typeof document === 'undefined' ? null : document);
  if (!targetDoc) return;

  const root = targetDoc.documentElement;
  if (root) {
    root.classList.toggle('dark', resolved === 'dark');
    root.setAttribute('data-theme', resolved);
    root.style.colorScheme = resolved;
  }

  const themeMeta = targetDoc.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', THEME_META_COLORS[resolved]);
  }
}
