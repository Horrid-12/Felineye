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

export function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const handleSelectSpecies = (slug: string) => {
    setSelectedSlug(slug);
    setActivePage('species-detail');
  };

  const handleBackToAtlas = () => {
    setActivePage('species');
  };

  return (
    <div className="min-h-screen bg-felid-dark text-felid-ivory flex flex-col selection:bg-felid-accent selection:text-black">
      {/* Ambient forest canopy radial background glow */}
      <div className="fixed inset-0 pointer-events-none bg-topo-subtle z-0 opacity-40" />

      {/* Primary Navigation */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* Main View Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activePage === 'home' && (
          <HomePage
            setActivePage={setActivePage}
            onSelectSpecies={handleSelectSpecies}
          />
        )}

        {activePage === 'identify' && (
          <IdentifyPage
            setActivePage={setActivePage}
            onSelectSpecies={handleSelectSpecies}
          />
        )}

        {activePage === 'species' && (
          <SpeciesAtlasPage onSelectSpecies={handleSelectSpecies} />
        )}

        {activePage === 'species-detail' && selectedSlug && (
          <SpeciesDetailPage
            slug={selectedSlug}
            onBack={handleBackToAtlas}
            onSelectSpecies={handleSelectSpecies}
          />
        )}

        {activePage === 'collection' && (
          <CollectionPage
            setActivePage={setActivePage}
            onSelectSpecies={handleSelectSpecies}
          />
        )}

        {activePage === 'observations' && <ObservationsPage />}

        {activePage === 'methodology' && <MethodologyPage />}
      </main>

      {/* Global Responsible Wildlife Footer */}
      <Footer setActivePage={setActivePage} />
    </div>
  );
}

export default App;
