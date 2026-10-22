import React, { useEffect, useState } from 'react';
import { BookOpen, AlertCircle, RotateCcw } from 'lucide-react';
import { SpeciesSummary } from '../types';
import { api } from '../services/api';
import { SpeciesCard } from '../components/species/SpeciesCard';
import { SpeciesFilters } from '../components/species/SpeciesFilters';

interface Props {
  onSelectSpecies: (slug: string) => void;
}

export const SpeciesAtlasPage: React.FC<Props> = ({ onSelectSpecies }) => {
  const [speciesList, setSpeciesList] = useState<SpeciesSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    subfamily: '',
    is_wild: 'all',
    conservation_status: '',
  });

  const loadSpecies = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const isWildParam =
        filters.is_wild === 'wild' ? true : filters.is_wild === 'domestic' ? false : undefined;

      const data = await api.getSpeciesList({
        search: filters.search || undefined,
        subfamily: filters.subfamily || undefined,
        is_wild: isWildParam,
        conservation_status: filters.conservation_status || undefined,
        page_size: 50,
      });

      setSpeciesList(data.items);
      setTotalCount(data.total);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load species catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly for responsive feel
    const timer = setTimeout(() => {
      loadSpecies();
    }, 200);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (updated: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      subfamily: '',
      is_wild: 'all',
      conservation_status: '',
    });
  };

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-felid-accent uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Taxonomic Encyclopedia</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-felid-ivory tracking-tight">
            Species <span className="text-felid-accent">Atlas</span>
          </h1>
          <p className="text-xs sm:text-sm text-felid-muted mt-1 max-w-xl">
            Explore the complete taxonomy of the 41 extant Felidae species, their global distributions, morphology, and conservation designations.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-felid-muted">
            Showing <strong className="text-felid-accent">{speciesList.length}</strong> of {totalCount} Felids
          </span>
        </div>
      </div>

      {/* Filter Component */}
      <SpeciesFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Error State */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Species Grid */}
      {loading ? (
        <div className="py-20 text-center text-felid-muted space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-felid-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono">Querying Felidae taxonomy catalog...</p>
        </div>
      ) : speciesList.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-felid-border bg-felid-surface/30 p-8 space-y-3">
          <p className="text-sm text-felid-ivory font-medium">No feline species matched your criteria.</p>
          <p className="text-xs text-felid-muted max-w-sm mx-auto">
            Try adjusting your search terms or clearing specific IUCN / subfamily filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-lg bg-felid-pine hover:bg-felid-border text-felid-accent text-xs font-medium border border-felid-border inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {speciesList.map((species) => (
            <SpeciesCard
              key={species.id}
              species={species}
              onClick={onSelectSpecies}
            />
          ))}
        </div>
      )}
    </div>
  );
};
