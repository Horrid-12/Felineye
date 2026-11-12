import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { resetThemeStoreCache, useThemeStore } from '../store/useThemeStore';
import { THEME_STORAGE_KEY } from '../store/themeStorage';

let storageMap: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => storageMap[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storageMap[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storageMap[key];
  }),
  clear: vi.fn(() => {
    storageMap = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

function createMatchMediaStub(initialDark: boolean) {
  let matches = initialDark;
  const listeners = new Set<(e: MediaQueryListEvent) => void>();

  const stub = vi.fn().mockImplementation(() => ({
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_event: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.add(cb);
    },
    removeEventListener: (_event: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.delete(cb);
    },
    addListener: (cb: (e: MediaQueryListEvent) => void) => {
      listeners.add(cb);
    },
    removeListener: (cb: (e: MediaQueryListEvent) => void) => {
      listeners.delete(cb);
    },
  }));

  return {
    stub,
    setDark(next: boolean) {
      matches = next;
      const evt = { matches: next, media: '(prefers-color-scheme: dark)' } as MediaQueryListEvent;
      for (const cb of listeners) cb(evt);
    },
  };
}

describe('useThemeStore hook', () => {
  beforeEach(() => {
    storageMap = {};
    vi.clearAllMocks();
    resetThemeStoreCache();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to system and follows OS dark-mode transitions', () => {
    const media = createMatchMediaStub(false);
    Object.defineProperty(window, 'matchMedia', { value: media.stub, writable: true });

    const { result } = renderHook(() => useThemeStore());
    expect(result.current.preference).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      media.setDark(true);
    });

    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('persists explicit theme choice across reloads and ignores OS flips when locked', () => {
    const media = createMatchMediaStub(true);
    Object.defineProperty(window, 'matchMedia', { value: media.stub, writable: true });

    const first = renderHook(() => useThemeStore());
    act(() => {
      first.result.current.setPreference('light');
    });

    expect(storageMap[THEME_STORAGE_KEY]).toBe('light');
    expect(first.result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // OS flip should not override explicit 'light'
    act(() => {
      media.setDark(true);
    });
    expect(first.result.current.resolvedTheme).toBe('light');

    // Simulate reload
    first.unmount();
    resetThemeStoreCache();

    const reloaded = renderHook(() => useThemeStore());
    expect(reloaded.result.current.preference).toBe('light');
    expect(reloaded.result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('shares preference updates across multiple consumers', () => {
    const media = createMatchMediaStub(false);
    Object.defineProperty(window, 'matchMedia', { value: media.stub, writable: true });

    const a = renderHook(() => useThemeStore());
    const b = renderHook(() => useThemeStore());

    act(() => {
      a.result.current.setPreference('dark');
    });

    expect(b.result.current.preference).toBe('dark');
    expect(b.result.current.resolvedTheme).toBe('dark');
  });
});
