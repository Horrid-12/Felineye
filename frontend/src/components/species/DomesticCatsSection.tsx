import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Cat,
  Dna,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';
import { BreedSummary, CatalogMeta, HybridSummary } from '../../types';
import { api } from '../../services/api';
import { AlertBanner, EmptyState, LoadingState } from '../ui/JournalPrimitives';
import { BotanicalRule } from '../ui/JournalOrnament';

interface Props {
  onSelectTaxon: (slug: string) => void;
  search: string;
}

export const DomesticCatsSection: React.FC<Props> = ({ onSelectTaxon, search }) => {
  const [meta, setMeta] = useState<CatalogMeta | null>(null);
  const [breeds, setBreeds] = useState<BreedSummary[]>([]);
  const [hybrids, setHybrids] = useState<HybridSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [metaData, breedData, hybridData] = await Promise.all([
          api.getCatalogMeta(),
          api.getBreeds({ page_size: 100 }),
          api.getHybrids(),
        ]);
        setMeta(metaData);
        setBreeds(breedData.items);
        setHybrids(hybridData.items);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load the domestic cat catalogue.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const query = search.trim().toLowerCase();

  const visibleBreeds = useMemo(() => {
    if (!query) return breeds;
    return breeds.filter((breed) =>
      [breed.common_name, breed.origin, breed.body_type, breed.coat_length, breed.coat_pattern]
        .filter(Boolean)
        .some((value) => (value as string).toLowerCase().includes(query))
    );
  }, [breeds, query]);

  const visibleHybrids = useMemo(() => {
    if (!query) return hybrids;
    return hybrids.filter((hybrid) =>
      [hybrid.common_name, hybrid.scientific_name, ...hybrid.parent_names]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [hybrids, query]);

  return (
    <section className="space-y-8 pt-4">
      <BotanicalRule />

      {/* Section header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-felid-surface border border-felid-cobalt/25 rounded-sm text-[11px] font-mono font-medium text-felid-cobalt-ink uppercase tracking-wider">
            <Cat className="w-3.5 h-3.5" />
            <span>Felis catus · CFA Breed Registry</span>
          </div>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl text-felid-ink tracking-tight">
            Domestic Breeds &amp; Crosses
          </h2>
          <p className="text-sm text-felid-muted-ink max-w-2xl font-sans leading-relaxed">
            One domesticated species, many human-developed breeds. Breeds are not separate species and are never
            added to the wild Felidae count.
          </p>
          <p className="text-xs text-felid-muted-ink font-mono inline-flex items-center gap-1.5 pt-0.5">
            <Search className="w-3 h-3 text-felid-cobalt-ink" />
            <span>
              {query ? `Filtering breeds for “${search}”` : 'Use the atlas search above to filter breeds and hybrids'}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-3 journal-plate divide-x divide-felid-border shrink-0">
          {[
            { label: 'Domestic Species', value: meta?.domestic_species_count ?? '—', tone: 'text-felid-pomegranate-ink' },
            { label: 'CFA Breeds', value: meta?.breed_count ?? '—', tone: 'text-felid-cobalt-ink' },
            { label: 'Hybrid Crosses', value: meta?.hybrid_count ?? '—', tone: 'text-felid-highlight-ink' },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-2.5 text-center">
              <span className={`block font-mono font-medium text-lg ${stat.tone}`}>
                {stat.value}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-felid-muted-ink font-mono">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {errorMsg && <AlertBanner tone="error">{errorMsg}</AlertBanner>}

      {/* Breeds */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-felid-border">
          <h3 className="font-display font-semibold text-xl text-felid-ink flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-felid-highlight-ink" />
            <span>Recognized Domestic Breeds</span>
          </h3>
          <span className="text-xs font-mono text-felid-muted-ink">
            {visibleBreeds.length} of {breeds.length}
          </span>
        </div>

        {loading ? (
          <LoadingState label="Loading CFA breed records..." className="py-12" />
        ) : visibleBreeds.length === 0 ? (
          <EmptyState title={`No breeds matched “${search}”.`} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleBreeds.map((breed) => (
              <div
                key={breed.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectTaxon(breed.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTaxon(breed.id);
                  }
                }}
                className="group journal-plate-interactive overflow-hidden cursor-pointer flex flex-col text-left"
              >
                <div className="relative h-44 w-full overflow-hidden bg-felid-elevated border-b border-felid-border">
                  {breed.thumbnail_url ? (
                    <img
                      src={breed.thumbnail_url}
                      alt={breed.common_name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-felid-muted-ink">
                      <Cat className="w-10 h-10" />
                    </div>
                  )}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-felid-surface/95 text-[10px] font-mono font-medium text-felid-cobalt-ink uppercase border border-felid-border-strong rounded-sm">
                    Breed
                  </span>
                </div>
                <div className="p-4 space-y-2.5 flex-1 flex flex-col">
                  <div>
                    <h4 className="font-display font-semibold text-base text-felid-ink leading-snug group-hover:text-felid-cobalt-ink transition-colors">
                      {breed.common_name}
                    </h4>
                    <p className="text-xs italic text-felid-muted-ink font-serif">{breed.scientific_name}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {breed.origin && (
                      <span className="px-2 py-0.5 bg-felid-elevated/70 border border-felid-border rounded-sm text-[10px] font-mono text-felid-muted-ink">
                        {breed.origin}
                      </span>
                    )}
                    {breed.coat_length && (
                      <span className="px-2 py-0.5 bg-felid-elevated/70 border border-felid-border rounded-sm text-[10px] font-mono text-felid-muted-ink">
                        {breed.coat_length} coat
                      </span>
                    )}
                  </div>
                  {breed.description && (
                    <p className="text-xs text-felid-muted-ink leading-relaxed line-clamp-2 font-sans">
                      {breed.description}
                    </p>
                  )}
                  <div className="mt-auto pt-2.5 border-t border-felid-border/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-felid-muted-ink uppercase">CFA recognized</span>
                    <a
                      href={breed.registry_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="text-[11px] font-mono font-medium text-felid-cobalt-ink inline-flex items-center gap-1 hover:underline"
                    >
                      Registry <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Hybrids */}
      <section className="space-y-4">
        <div className="pb-2.5 border-b border-felid-border">
          <h3 className="font-display font-semibold text-xl text-felid-ink flex items-center gap-2">
            <Dna className="w-4 h-4 text-felid-pomegranate-ink" />
            <span>Wild Felid Hybrids</span>
          </h3>
          <p className="text-xs text-felid-muted-ink font-sans mt-1">
            Informational crosses between wild species. Not species, not breeds, and excluded from every count.
          </p>
        </div>

        {visibleHybrids.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleHybrids.map((hybrid) => (
              <div
                key={hybrid.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectTaxon(hybrid.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTaxon(hybrid.id);
                  }
                }}
                className="journal-plate-interactive cursor-pointer p-4 space-y-2.5 flex flex-col text-left"
              >
                {hybrid.thumbnail_url ? (
                  <div className="h-32 overflow-hidden border border-felid-border rounded-sm bg-felid-elevated">
                    <img
                      src={hybrid.thumbnail_url}
                      alt={hybrid.common_name}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="h-32 border border-dashed border-felid-border-strong rounded-sm bg-felid-elevated/50 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-felid-muted-ink uppercase">No species image</span>
                  </div>
                )}
                <div>
                  <h4 className="font-display font-semibold text-base text-felid-ink">{hybrid.common_name}</h4>
                  <p className="text-xs italic text-felid-muted-ink font-serif leading-snug">{hybrid.scientific_name}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-sans font-semibold text-felid-cobalt-ink">
                  Details <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Taxonomy note */}
      {meta && (
        <section className="journal-inset p-5 space-y-2">
          <h4 className="font-display font-semibold text-base text-felid-ink">Why these counts are separate</h4>
          <p className="text-xs sm:text-sm text-felid-muted-ink leading-relaxed font-sans">{meta.taxonomy_note}</p>
          <p className="text-xs sm:text-sm text-felid-muted-ink leading-relaxed font-sans">
            {meta.breed_note} {meta.hybrid_note}
          </p>
          <p className="text-[11px] text-felid-muted-ink font-mono pt-1">
            Taxonomy: {meta.authority} ({meta.year}). Registry: {meta.breed_registry.name}. Last curated {meta.updated}.
          </p>
        </section>
      )}
    </section>
  );
};
