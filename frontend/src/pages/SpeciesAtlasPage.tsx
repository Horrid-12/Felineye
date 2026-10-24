import React, { useEffect, useState } from 'react';
import { Cat, AlertCircle, RotateCcw, PawPrint } from 'lucide-react';
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
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono font-black text-felid-accent uppercase tracking-wider mb-2">
            <Cat className="w-3.5 h-3.5" />
            <span>TAXONOMY ARCHIVE // IUCN CAT SPECIALIST GROUP</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-felid-ivory uppercase tracking-tight">
            SPECIES <span className="text-felid-accent underline decoration-4 underline-offset-4">ATLAS</span>
          </h1>
          <p className="text-xs sm:text-sm text-felid-muted mt-1 max-w-xl font-mono leading-relaxed">
            The complete taxonomy of 41 extant Felidae species across 8 evolutionary lineages, from domestic companions to rare apex predators.
          </p>
        </div>

        <div className="text-right">
          <span className="bg-[#0c0a0e] text-felid-ivory border-2 border-black shadow-brutal-sm px-3 py-1 text-xs font-mono font-bold inline-block">
            SHOWING <strong className="text-felid-accent">{speciesList.length}</strong> OF {totalCount || 41} FELIDS
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
        <div className="p-4 bg-red-950/70 border-2 border-black shadow-brutal text-pink-200 text-xs font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-felid-accent shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Species Grid */}
      {loading ? (
        <div className="py-20 text-center text-felid-muted space-y-3 font-mono">
          <div className="w-8 h-8 border-2 border-felid-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase">LOADING FELIDAE TAXA RECORDS...</p>
        </div>
      ) : speciesList.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-[#332c3a] bg-[#0c0a0e] p-8 space-y-3 shadow-brutal-sm">
          <p className="text-sm text-felid-ivory font-mono font-bold uppercase">NO FELINE SPECIES MATCHED YOUR CRITERIA.</p>
          <p className="text-xs text-felid-muted max-w-sm mx-auto font-mono">
            Try adjusting search queries or resetting subfamily and IUCN status chips.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 bg-felid-accent text-black text-xs font-mono font-black border-2 border-black shadow-brutal-sm brutal-press inline-flex items-center gap-1.5 uppercase"
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
