import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { App } from '../App';
import { api } from '../services/api';
import { resetThemeStoreCache } from '../store/useThemeStore';
import { resetCollectionStoreCache } from '../store/useCollectionStore';
import { THEME_STORAGE_KEY } from '../store/themeStorage';

let storageMap: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key) => storageMap[key] ?? null,
  setItem: (key, value) => {
    storageMap[key] = String(value);
  },
  removeItem: (key) => {
    delete storageMap[key];
  },
  clear: () => {
    storageMap = {};
  },
  key: (i) => Object.keys(storageMap)[i] ?? null,
  get length() {
    return Object.keys(storageMap).length;
  },
};

const sampleSpecies = {
  id: 'panthera-uncia',
  common_name: 'Snow Leopard',
  scientific_name: 'Panthera uncia',
  subfamily: 'Pantherinae',
  lineage: 'Panthera',
  genus: 'Panthera',
  conservation_status: 'VU',
  conservation_title: 'Vulnerable',
  is_wild: true,
  thumbnail_url: 'https://example.com/snow-leopard.jpg',
  image_url: 'https://example.com/snow-leopard.jpg',
  discovery_rarity: 'Rare',
  xp_reward: 400,
  habitats: ['Alpine', 'Mountain'],
  geographic_range: 'Central and South Asia',
  size_and_weight: '32–52 kg',
  category: 'wild_species' as const,
  rank: 'species',
  description: 'High-altitude felid adapted to steep mountain ridges.',
  distinguishing_characteristics: ['Pale smoky-gray coat with dark rosettes'],
  diet: 'Blue sheep and ibex',
  behavior: 'Solitary crepuscular hunter',
  image_attribution: 'Wikimedia Commons',
  similar_species: [],
};

const sampleMeta = {
  authority: 'IUCN/SSC Cat Specialist Group',
  reference: 'Kitchener et al. 2017',
  year: 2017,
  url: 'https://www.catsg.org',
  taxonomy_note: '41 species',
  breed_note: '22 CFA breeds',
  hybrid_note: '4 hybrids',
  updated: '2026-10-25',
  wild_species_count: 40,
  domestic_species_count: 1,
  species_count: 41,
  breed_count: 22,
  hybrid_count: 4,
  lineage_count: 8,
  breed_registry: { name: 'CFA', url: 'https://cfa.org' },
};

describe('App multi-route navigation and theme persistence', () => {
  beforeEach(() => {
    storageMap = {};
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      configurable: true,
      writable: true,
    });
    window.scrollTo = vi.fn();
    resetThemeStoreCache();
    resetCollectionStoreCache();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');

    vi.spyOn(api, 'getFeaturedSpecies').mockResolvedValue(sampleSpecies);
    vi.spyOn(api, 'getCatalogMeta').mockResolvedValue(sampleMeta);
    vi.spyOn(api, 'getSpeciesList').mockResolvedValue({
      total: 1,
      page: 1,
      page_size: 100,
      items: [sampleSpecies],
    });
    vi.spyOn(api, 'getBreeds').mockResolvedValue({ total: 0, page: 1, page_size: 100, items: [] });
    vi.spyOn(api, 'getHybrids').mockResolvedValue({ total: 0, items: [] });
    vi.spyOn(api, 'getTaxonDetail').mockResolvedValue(sampleSpecies);
    vi.spyOn(api, 'getCollectionMeta').mockResolvedValue({
      species: [
        {
          id: 'panthera-uncia',
          common_name: 'Snow Leopard',
          scientific_name: 'Panthera uncia',
          subfamily: 'Pantherinae',
          lineage: 'Panthera',
          genus: 'Panthera',
          rarity: 'Rare',
          xp_reward: 400,
          thumbnail_url: 'https://example.com/snow-leopard.jpg',
          is_wild: true,
          category: 'wild_species',
        },
      ],
      badges: [
        {
          id: 'first_contact',
          title: 'First Glimpse',
          description: 'Make your very first feline discovery.',
          icon: 'Compass',
          required_count: 1,
          category: 'discovery',
        },
      ],
      ranks: [],
    });
    vi.spyOn(api, 'getObservations').mockResolvedValue({
      total: 1,
      observations: [
        {
          id: 'obs-1',
          species_name: 'Snow Leopard',
          scientific_name: 'Panthera uncia',
          observed_on: '2026-04-10',
          broad_location: 'Ladakh, India',
          image_url: 'https://example.com/obs.jpg',
          quality_grade: 'research',
          source: 'iNaturalist',
          source_url: 'https://www.inaturalist.org/observations/1',
          coordinates_obscured: true,
        },
      ],
      disclaimer: 'Coordinates generalized',
    });
  });

  it('preserves dark theme across all routes and navigates cleanly', async () => {
    await act(async () => {
      render(<App />);
    });

    // Home renders featured specimen
    expect(await screen.findByText('Snow Leopard')).toBeDefined();

    // Switch to dark theme
    fireEvent.click(screen.getAllByTestId('theme-option-dark')[0]);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // Navigate to Identify
    fireEvent.click(screen.getByText('Scan a Cat Photo'));
    expect(await screen.findByText('DROP FELINE PHOTOGRAPH HERE')).toBeDefined();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Navigate to Species Atlas -> Species Detail
    await act(async () => {
      fireEvent.click(screen.getAllByText('Species Atlas')[0]);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 250));
    });
    const atlasCard = await screen.findByText('Snow Leopard');
    await act(async () => {
      fireEvent.click(atlasCard);
    });
    expect(await screen.findByText(/Diagnostic Visual Identifiers/i)).toBeDefined();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Navigate to Observations
    await act(async () => {
      fireEvent.click(screen.getByText('Observations'));
    });
    expect(await screen.findByText('Ladakh, India')).toBeDefined();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Navigate to Dataset Review
    fireEvent.click(screen.getByText('Dataset Review'));
    expect(screen.getByTestId('reviewer-input')).toBeDefined();

    // Methodology page is removed from navigation
    expect(screen.queryByText('Methodology')).toBeNull();

    // Navigate to Field Journal (Collection) via Navbar rank capsule (footer is removed)
    expect(document.querySelector('footer')).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByTitle(/species discovered/i));
    });
    expect(await screen.findByText(/Felidae Field Roster/i)).toBeDefined();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Clicking Home "Domestic Cats" CTA opens domestic view, and clicking Navbar "Species Atlas" resets category back to all
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Felidae Field Journal/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Domestic Cats' }));
    });
    expect(await screen.findByText(/Domestic Breeds & Crosses/i)).toBeDefined();
    await act(async () => {
      fireEvent.click(screen.getAllByText('Species Atlas')[0]);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 250));
    });
    expect(screen.queryByText(/Domestic Breeds & Crosses/i)).toBeNull();

    // Switch back to light theme and confirm persistence across routes
    fireEvent.click(screen.getAllByTestId('theme-option-light')[0]);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
