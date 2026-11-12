import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Navbar } from '../components/layout/Navbar';
import { MethodologyPage } from '../pages/MethodologyPage';
import { ObservationsPage } from '../pages/ObservationsPage';
import { CollectionPage } from '../pages/CollectionPage';
import { SpeciesCard } from '../components/species/SpeciesCard';
import { SimilarCompareModal } from '../components/identify/SimilarCompareModal';
import { resetThemeStoreCache } from '../store/useThemeStore';
import { resetCollectionStoreCache } from '../store/useCollectionStore';
import { THEME_STORAGE_KEY } from '../store/themeStorage';
import { api } from '../services/api';

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

describe('Theme switching & redesigned views', () => {
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
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  it('ThemeToggle switches between Light, System, and Dark and persists to localStorage', () => {
    render(<ThemeToggle />);

    const lightBtn = screen.getByTestId('theme-option-light');
    const systemBtn = screen.getByTestId('theme-option-system');
    const darkBtn = screen.getByTestId('theme-option-dark');

    expect(systemBtn.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(darkBtn);
    expect(darkBtn.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    fireEvent.click(lightBtn);
    expect(lightBtn.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('Navbar preserves navigation routes and surfaces theme toggle in desktop & mobile drawer', () => {
    const setActivePage = vi.fn();
    render(<Navbar activePage="species" setActivePage={setActivePage} />);

    fireEvent.click(screen.getByText('Methodology'));
    expect(setActivePage).toHaveBeenCalledWith('methodology');

    fireEvent.click(screen.getByText('Dataset Review'));
    expect(setActivePage).toHaveBeenCalledWith('dataset-review');

    fireEvent.click(screen.getByText('Observations'));
    expect(setActivePage).toHaveBeenCalledWith('observations');

    // Open mobile navigation drawer
    fireEvent.click(screen.getByLabelText('Toggle Navigation'));
    expect(screen.getByText('Appearance')).toBeDefined();
    expect(screen.getAllByTestId('theme-option-dark').length).toBeGreaterThanOrEqual(2);
  });

  it('MethodologyPage renders scientific sections and interactive validation chart', async () => {
    vi.spyOn(api, 'getCatalogMeta').mockResolvedValue({
      authority: 'IUCN/SSC Cat Specialist Group',
      reference: 'Kitchener et al. 2017',
      year: 2017,
      url: 'https://www.catsg.org',
      taxonomy_note: '41 species',
      breed_note: '22 breeds',
      hybrid_note: '4 hybrids',
      updated: '2026-10-25',
      wild_species_count: 40,
      domestic_species_count: 1,
      species_count: 41,
      breed_count: 22,
      hybrid_count: 4,
      lineage_count: 8,
      breed_registry: { name: 'CFA', url: 'https://cfa.org' },
    });

    await act(async () => {
      render(<MethodologyPage />);
    });

    expect(screen.getByText(/Local, Replaceable Inference Pipeline/i)).toBeDefined();
    expect(screen.getByText(/Figure 2 · Breed Confidence Threshold/i)).toBeDefined();

    // Default shipped 0.80 readout
    expect(screen.getByText(/Floor 0\.80 \(Shipped default\)/)).toBeDefined();

    // Select 0.90 threshold point on the SVG chart
    const point90 = screen.getByRole('button', { name: /Threshold 0\.90/i });
    fireEvent.click(point90);
    expect(screen.getByText(/Precision 100\.0%/)).toBeDefined();
    expect(screen.getByText(/Coverage 20\.9%/)).toBeDefined();

    // Keyboard navigation from 0.90 -> 0.95 via ArrowRight and back via ArrowLeft
    fireEvent.keyDown(point90, { key: 'ArrowRight' });
    expect(screen.getByText(/Floor 0\.95/)).toBeDefined();
    expect(screen.getByText(/Coverage 12\.8%/)).toBeDefined();
    fireEvent.keyDown(point90, { key: 'ArrowLeft' });
    expect(screen.getByText(/Floor 0\.90/)).toBeDefined();
  });

  it('SimilarCompareModal closes when Escape is pressed', async () => {
    vi.spyOn(api, 'getSpeciesDetail').mockResolvedValue({
      id: 'panthera-onca',
      common_name: 'Jaguar',
      scientific_name: 'Panthera onca',
      subfamily: 'Pantherinae',
      lineage: 'Panthera',
      genus: 'Panthera',
      conservation_status: 'NT',
      conservation_title: 'Near Threatened',
      is_wild: true,
      thumbnail_url: 'https://example.com/jaguar.jpg',
      image_url: 'https://example.com/jaguar.jpg',
      discovery_rarity: 'Rare',
      xp_reward: 275,
      habitats: ['Forest'],
      category: 'wild_species',
      rank: 'species',
      description: 'Apex neotropical felid.',
      distinguishing_characteristics: ['Rosettes with central spots'],
      diet: 'Carnivore',
      behavior: 'Solitary',
      image_attribution: 'Wikimedia Commons',
      similar_species: [],
    });

    const onClose = vi.fn();
    await act(async () => {
      render(
        <SimilarCompareModal
          sourceSlug="panthera-onca"
          onClose={onClose}
          onNavigate={vi.fn()}
        />,
      );
    });

    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ObservationsPage renders structured field notes with obscured coordinates', async () => {
    vi.spyOn(api, 'getObservations').mockResolvedValue({
      total: 1,
      observations: [
        {
          id: 'obs-42',
          species_name: 'Caracal',
          scientific_name: 'Caracal caracal',
          observed_on: '2026-05-14',
          broad_location: 'Anatolia, Turkey',
          image_url: 'https://example.com/caracal.jpg',
          quality_grade: 'research',
          source: 'iNaturalist',
          source_url: 'https://www.inaturalist.org/observations/42',
          coordinates_obscured: true,
        },
      ],
      disclaimer: 'Coordinates generalized',
    });

    await act(async () => {
      render(<ObservationsPage />);
    });

    expect(await screen.findByText('Caracal')).toBeDefined();
    expect(screen.getByText('Field Note')).toBeDefined();
    expect(screen.getByText('Generalized Coords')).toBeDefined();
    expect(screen.getByText('Anatolia, Turkey')).toBeDefined();
    expect(screen.getByText(/Logged 2026-05-14/)).toBeDefined();
    const img = screen.getByAltText('Caracal');
    expect(img.className).toContain('object-top');
  });

  it('CollectionPage and SpeciesCard preserve object-top framing and journal state', async () => {
    resetCollectionStoreCache();
    vi.spyOn(api, 'getCollectionMeta').mockResolvedValue({
      species: [
        {
          id: 'panthera-pardus',
          common_name: 'Leopard',
          scientific_name: 'Panthera pardus',
          subfamily: 'Pantherinae',
          lineage: 'Panthera',
          genus: 'Panthera',
          rarity: 'Uncommon',
          xp_reward: 250,
          thumbnail_url: 'https://example.com/leopard.jpg',
          is_wild: true,
          category: 'wild_species',
        },
      ],
      badges: [
        {
          id: 'first_contact',
          title: 'First Glimpse',
          description: 'Log your first feline.',
          icon: 'Compass',
          required_count: 1,
          category: 'discovery',
        },
      ],
      ranks: [],
    });
    vi.spyOn(api, 'getCatalogMeta').mockResolvedValue({
      authority: 'IUCN/SSC Cat Specialist Group',
      reference: 'Kitchener et al. 2017',
      year: 2017,
      url: 'https://www.catsg.org',
      taxonomy_note: '41 species',
      breed_note: '22 breeds',
      hybrid_note: '4 hybrids',
      updated: '2026-10-25',
      wild_species_count: 40,
      domestic_species_count: 1,
      species_count: 41,
      breed_count: 22,
      hybrid_count: 4,
      lineage_count: 8,
      breed_registry: { name: 'CFA', url: 'https://cfa.org' },
    });

    await act(async () => {
      render(<CollectionPage setActivePage={vi.fn()} onSelectSpecies={vi.fn()} />);
    });

    expect(await screen.findByText('Leopard')).toBeDefined();
    expect(screen.getByAltText('Leopard').className).toContain('object-top');
    expect(screen.getByText('First Glimpse')).toBeDefined();

    render(
      <SpeciesCard
        species={{
          id: 'lynx-lynx',
          common_name: 'Eurasian Lynx',
          scientific_name: 'Lynx lynx',
          subfamily: 'Felinae',
          lineage: 'Lynx',
          genus: 'Lynx',
          conservation_status: 'LC',
          conservation_title: 'Least Concern',
          is_wild: true,
          thumbnail_url: 'https://example.com/lynx.jpg',
          image_url: 'https://example.com/lynx.jpg',
          discovery_rarity: 'Uncommon',
          xp_reward: 200,
          habitats: ['Forest', 'Mountains'],
          category: 'wild_species',
          rank: 'species',
        }}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByAltText('Eurasian Lynx').className).toContain('object-top');
  });
});
