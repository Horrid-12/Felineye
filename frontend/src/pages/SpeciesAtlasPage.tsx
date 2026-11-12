import React, { useEffect, useState } from 'react';
import { Cat, RotateCcw, PawPrint, ArrowRight } from 'lucide-react';
import { CatalogMeta, SpeciesSummary } from '../types';
import { api } from '../services/api';
import { SpeciesCard } from '../components/species/SpeciesCard';
import { SpeciesFilters } from '../components/species/SpeciesFilters';
import { DomesticCatsSection } from '../components/species/DomesticCatsSection';
import {
  AlertBanner,
  EmptyState,
  LoadingState,
  PageHeader,
} from '../components/ui/JournalPrimitives';

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
    const targetCategory = initialCategory ?? '';
    setFilters((prev) =>
      prev.category === targetCategory ? prev : { ...prev, category: targetCategory },
    );
  }, [initialCategory]);

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
    <div className="py-2 space-y-6">
      <PageHeader
        kicker="Taxonomy Archive · IUCN SSC Cat Specialist Group 2017"
        kickerIcon={<Cat className="w-3.5 h-3.5" />}
        title={
          <>
            Species <span className="italic text-felid-cobalt-ink">Atlas</span>
          </>
        }
        subtitle="The documented wild Felidae catalogue, with the domestic cat kept as its own species category. Domestic breeds are tracked separately and never added to the wild species count."
        meta={
          meta
            ? `${meta.wild_species_count} wild species · ${meta.domestic_species_count} domestic species · ${meta.breed_count} CFA breeds`
            : 'Loading catalog counts…'
        }
        aside={
          <>
            <span className="bg-felid-surface text-felid-ink border border-felid-border rounded-sm px-3 py-1.5 text-xs font-mono">
              Showing <strong className="text-felid-cobalt-ink">{speciesList.length}</strong> of{' '}
              {totalCount} species
            </span>
            {!showDomesticSection && (
              <button
                type="button"
                onClick={() =>
                  handleFilterChange({
                    category: 'domestic_species',
                    subfamily: '',
                    conservation_status: '',
                  })
                }
                className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-felid-pomegranate-ink hover:underline"
              >
                <PawPrint className="w-3.5 h-3.5" />
                <span>Domestic cats &amp; breeds</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </>
        }
      />

      {/* Filter Component */}
      <SpeciesFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Error State */}
      {errorMsg && <AlertBanner tone="error">{errorMsg}</AlertBanner>}

      {/* Species Grid */}
      {loading ? (
        <LoadingState label="Loading Felidae taxa records..." className="py-20" />
      ) : speciesList.length === 0 ? (
        <EmptyState
          title={
            showDomesticSection
              ? `No domestic species record matched “${filters.search}”.`
              : 'No feline species matched your criteria.'
          }
          description={
            showDomesticSection
              ? 'Breed and hybrid records are searched in the section below.'
              : 'Try adjusting search queries or resetting the category, subfamily, and IUCN status chips.'
          }
          action={
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-primary text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset all filters</span>
            </button>
          }
        />
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
