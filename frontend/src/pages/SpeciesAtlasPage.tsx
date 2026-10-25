import React, { useEffect, useState } from 'react';
import { Cat, AlertCircle, RotateCcw, PawPrint, ArrowRight } from 'lucide-react';
import { CatalogMeta, SpeciesSummary } from '../types';
import { api } from '../services/api';
import { SpeciesCard } from '../components/species/SpeciesCard';
import { SpeciesFilters } from '../components/species/SpeciesFilters';
import { DomesticCatsSection } from '../components/species/DomesticCatsSection';

type SpeciesCategory = 'wild_species' | 'domestic_species';

interface Props {
  onSelectSpecies: (slug: string) => void;
  initialCategory?: SpeciesCategory;
  onCategoryContextChange?: (category: SpeciesCategory | '') => void;
}

export const SpeciesAtlasPage: React.FC<Props> = ({
  onSelectSpecies,
  initialCategory,
  onCategoryContextChange,
}) => {
  const [speciesList, setSpeciesList] = useState<SpeciesSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [meta, setMeta] = useState<CatalogMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    subfamily: '',
    category: initialCategory ?? '',
    conservation_status: '',
  });

  useEffect(() => {
    api.getCatalogMeta().then(setMeta).catch(() => {
      // Counts are supplementary; the atlas still works if meta fails.
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await api.getSpeciesList({
          search: filters.search || undefined,
          subfamily: filters.subfamily || undefined,
          category: (filters.category || undefined) as SpeciesCategory | undefined,
          conservation_status: filters.conservation_status || undefined,
          page_size: 100,
        });

        setSpeciesList(data.items);
        setTotalCount(data.total);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load species catalog.');
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (updated: Partial<typeof filters>) => {
    const next = { ...filters, ...updated };
    setFilters(next);
    onCategoryContextChange?.(next.category as SpeciesCategory | '');
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      subfamily: '',
      category: '',
      conservation_status: '',
    });
    onCategoryContextChange?.('');
  };

  const showDomesticSection = filters.category === 'domestic_species';

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono font-black text-felid-accent uppercase tracking-wider mb-2">
            <Cat className="w-3.5 h-3.5" />
            <span>TAXONOMY ARCHIVE // IUCN SSC CAT SPECIALIST GROUP 2017</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-felid-ivory uppercase tracking-tight">
            SPECIES <span className="text-felid-accent underline decoration-4 underline-offset-4">ATLAS</span>
          </h1>
          <p className="text-xs sm:text-sm text-felid-muted mt-1 max-w-2xl font-mono leading-relaxed">
            The documented wild Felidae catalogue, with the domestic cat kept as its own species category.
            Domestic breeds are tracked separately and never added to the wild species count.
          </p>
          <p className="text-[11px] text-felid-muted/80 mt-1 font-mono">
            {meta
              ? `${meta.wild_species_count} wild species · ${meta.domestic_species_count} domestic species · ${meta.breed_count} CFA breeds`
              : 'Loading catalog counts…'}
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="bg-[#0c0a0e] text-felid-ivory border-2 border-black shadow-brutal-sm px-3 py-1 text-xs font-mono font-bold inline-block">
            SHOWING <strong className="text-felid-accent">{speciesList.length}</strong> OF {totalCount} SPECIES
          </span>
          {!showDomesticSection && (
            <button
              onClick={() =>
                handleFilterChange({
                  category: 'domestic_species',
                  subfamily: '',
                  conservation_status: '',
                })
              }
              className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black text-felid-accent uppercase hover:underline"
            >
              <PawPrint className="w-3.5 h-3.5" />
              Domestic cats &amp; breeds <ArrowRight className="w-3 h-3" />
            </button>
          )}
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
        <div className="py-12 text-center border-2 border-dashed border-[#332c3a] bg-[#0c0a0e] p-8 space-y-3 shadow-brutal-sm">
          {showDomesticSection ? (
            <>
              <p className="text-sm text-felid-ivory font-mono font-bold uppercase">
                NO DOMESTIC SPECIES RECORD MATCHED “{filters.search}”.
              </p>
              <p className="text-xs text-felid-muted max-w-sm mx-auto font-mono">
                Breed and hybrid records are searched in the section below.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-felid-ivory font-mono font-bold uppercase">
                NO FELINE SPECIES MATCHED YOUR CRITERIA.
              </p>
              <p className="text-xs text-felid-muted max-w-sm mx-auto font-mono">
                Try adjusting search queries or resetting the category, subfamily, and IUCN status chips.
              </p>
            </>
          )}
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

      {/* Domestic breeds are part of the atlas, revealed by the Domestic Cat filter */}
      {showDomesticSection && (
        <DomesticCatsSection onSelectTaxon={onSelectSpecies} search={filters.search} />
      )}
    </div>
  );
};
