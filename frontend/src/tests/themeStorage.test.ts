import { describe, it, expect, vi } from 'vitest';
import {
  applyThemeToDocument,
  loadThemePreference,
  normalizeThemePreference,
  resolveTheme,
  saveThemePreference,
  THEME_META_COLORS,
  THEME_STORAGE_KEY,
} from '../store/themeStorage';

describe('themeStorage', () => {
  it('normalizes valid preferences and falls back to system for invalid inputs', () => {
    expect(normalizeThemePreference('light')).toBe('light');
    expect(normalizeThemePreference('dark')).toBe('dark');
    expect(normalizeThemePreference('system')).toBe('system');
    expect(normalizeThemePreference('neon-pink')).toBe('system');
    expect(normalizeThemePreference(null)).toBe('system');
    expect(normalizeThemePreference(undefined)).toBe('system');
    expect(normalizeThemePreference(42)).toBe('system');
  });

  it('loads and saves preferences safely even if storage throws', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: vi.fn((k: string) => map.get(k) ?? null),
      setItem: vi.fn((k: string, v: string) => {
        map.set(k, v);
      }),
    };

    expect(loadThemePreference(storage)).toBe('system');
    saveThemePreference('dark', storage);
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
    expect(loadThemePreference(storage)).toBe('dark');

    const broken = {
      getItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      setItem: vi.fn(() => {
        throw new Error('quota');
      }),
    };
    expect(loadThemePreference(broken)).toBe('system');
    expect(() => saveThemePreference('light', broken)).not.toThrow();
  });

  it('resolves explicit and system preferences accurately', () => {
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('system', 'light')).toBe('light');
  });

  it('applies dark class, data-theme, colorScheme, and Cobalt & Pomegranate meta theme-color to document', () => {
    expect(THEME_META_COLORS.light).toBe('#F2E7D5');
    expect(THEME_META_COLORS.dark).toBe('#241B29');

    const doc = document.implementation.createHTMLDocument('Test');
    const meta = doc.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', '#000000');
    doc.head.appendChild(meta);

    applyThemeToDocument('dark', doc);
    expect(doc.documentElement.classList.contains('dark')).toBe(true);
    expect(doc.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(doc.documentElement.style.colorScheme).toBe('dark');
    expect(meta.getAttribute('content')).toBe('#241B29');

    applyThemeToDocument('light', doc);
    expect(doc.documentElement.classList.contains('dark')).toBe(false);
    expect(doc.documentElement.getAttribute('data-theme')).toBe('light');
    expect(doc.documentElement.style.colorScheme).toBe('light');
    expect(meta.getAttribute('content')).toBe('#F2E7D5');
  });
});
