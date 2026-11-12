import { useState } from 'react';
import { ActivePage } from './types';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { IdentifyPage } from './pages/IdentifyPage';
import { SpeciesAtlasPage } from './pages/SpeciesAtlasPage';
import { SpeciesDetailPage } from './pages/SpeciesDetailPage';
import { CollectionPage } from './pages/CollectionPage';
import { ObservationsPage } from './pages/ObservationsPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { DatasetReviewPage } from './pages/DatasetReviewPage';
import { useThemeStore } from './store/useThemeStore';

const BACK_LABELS: Partial<Record<ActivePage, string>> = {
  home: 'Back to Home',
  identify: 'Back to Scanner',
  species: 'Back to Species Atlas',
  collection: 'Back to Field Journal',
};

type AtlasCategory = 'wild_species' | 'domestic_species' | '';

export function App() {
  useThemeStore();

  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [detailBackPage, setDetailBackPage] = useState<ActivePage>('species');
  const [atlasCategory, setAtlasCategory] = useState<AtlasCategory>('');

  const handleSelectTaxon = (slug: string, backPage: ActivePage) => {
    setSelectedSlug(slug);
    setDetailBackPage(backPage);
    setActivePage('species-detail');
  };

  const handleBackFromDetail = () => {
    setActivePage(detailBackPage);
  };

  // Navbar visits to the atlas start from the full catalogue. The domestic filter is
  // reached through the home CTA or the atlas header control.
  const handleNavigate = (page: ActivePage) => {
    if (page === 'species') {
      setAtlasCategory('');
    }
    setActivePage(page);
    window.scrollTo?.({ top: 0, behavior: 'auto' });
  };

  const handleOpenDomestic = () => {
    setAtlasCategory('domestic_species');
    setActivePage('species');
    window.scrollTo?.({ top: 0, behavior: 'auto' });
  };

  return (
    <div className="min-h-screen bg-felid-bg text-felid-ink flex flex-col selection:bg-felid-cobalt/20 selection:text-felid-ink relative">
      {/* Subtle Cobalt & Pomegranate archival canvas wash */}
      <div className="fixed inset-0 pointer-events-none journal-canvas-wash z-0" aria-hidden="true" />

      {/* Primary Navigation */}
      <Navbar activePage={activePage} setActivePage={handleNavigate} />

      {/* Main View Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activePage === 'home' && (
          <HomePage
            setActivePage={handleNavigate}
            onSelectSpecies={(slug) => handleSelectTaxon(slug, 'home')}
            onOpenDomestic={handleOpenDomestic}
          />
        )}

        {activePage === 'identify' && (
          <IdentifyPage
            setActivePage={handleNavigate}
            onSelectSpecies={(slug) => handleSelectTaxon(slug, 'identify')}
          />
        )}

        {activePage === 'species' && (
          <SpeciesAtlasPage
            onSelectSpecies={(slug) => handleSelectTaxon(slug, 'species')}
            initialCategory={atlasCategory || undefined}
            onCategoryContextChange={setAtlasCategory}
          />
        )}

        {activePage === 'species-detail' && selectedSlug && (
          <SpeciesDetailPage
            slug={selectedSlug}
            onBack={handleBackFromDetail}
            onSelectSpecies={(slug) => handleSelectTaxon(slug, detailBackPage)}
            backLabel={BACK_LABELS[detailBackPage] || 'Back to Catalog'}
          />
        )}

        {activePage === 'collection' && (
          <CollectionPage
            setActivePage={handleNavigate}
            onSelectSpecies={(slug) => handleSelectTaxon(slug, 'collection')}
          />
        )}

        {activePage === 'observations' && <ObservationsPage />}

        {activePage === 'dataset-review' && <DatasetReviewPage />}

        {activePage === 'methodology' && <MethodologyPage />}
      </main>

      {/* Footer */}
      <Footer setActivePage={handleNavigate} />
    </div>
  );
}

export default App;
