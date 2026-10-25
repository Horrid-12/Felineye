import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Cat,
  Dna,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';
import { BreedSummary, CatalogMeta, HybridSummary } from '../../types';
import { api } from '../../services/api';

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
    <section className="space-y-6 border-t-2 border-black pt-8">
      {/* Section header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono font-black text-felid-accent uppercase tracking-wider mb-2">
            <Cat className="w-3.5 h-3.5" />
            <span>FELIS CATUS // CFA BREED REGISTRY</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-felid-ivory uppercase tracking-tight">
            DOMESTIC <span className="text-felid-accent underline decoration-4 underline-offset-4">BREEDS</span>
          </h2>
          <p className="text-xs text-felid-muted mt-1 max-w-2xl font-mono leading-relaxed">
            One domesticated species, many human-developed breeds. Breeds are not separate species and are never
            added to the wild Felidae count.
          </p>
          <p className="text-[11px] text-felid-muted/80 mt-1 font-mono inline-flex items-center gap-1.5">
            <Search className="w-3 h-3 text-felid-accent" />
            {query ? `Filtering breeds for “${search}”` : 'Use the atlas search above to filter breeds and hybrids'}
          </p>
        </div>

        <div className="grid grid-cols-3 border-2 border-black bg-[#0c0a0e] divide-x-2 divide-black shadow-brutal-sm shrink-0">
          {[
            { label: 'Domestic Species', value: meta?.domestic_species_count ?? '—' },
            { label: 'CFA Breeds', value: meta?.breed_count ?? '—' },
            { label: 'Hybrid Crosses', value: meta?.hybrid_count ?? '—' },
          ].map((stat) => (
            <div key={stat.label} className="px-3 py-2 text-center">
              <span className="block font-mono font-black text-lg text-felid-accent">{stat.value}</span>
              <span className="text-[9px] uppercase tracking-wider text-felid-muted font-mono font-bold">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/70 border-2 border-black shadow-brutal text-pink-200 text-xs font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-felid-accent shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Breeds */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-black">
          <h3 className="font-display font-black text-lg text-felid-ivory uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-felid-accent" />
            RECOGNIZED DOMESTIC BREEDS
          </h3>
          <span className="text-[10px] font-mono font-bold text-felid-muted uppercase">
            {visibleBreeds.length} of {breeds.length}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-felid-muted space-y-3 font-mono">
            <div className="w-8 h-8 border-2 border-felid-accent border-t-transparent animate-spin mx-auto" />
            <p className="text-xs uppercase">LOADING CFA BREED RECORDS...</p>
          </div>
        ) : visibleBreeds.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-[#332c3a] bg-[#0c0a0e] p-6">
            <p className="text-sm text-felid-ivory font-mono font-bold uppercase">
              NO BREEDS MATCHED “{search}”.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleBreeds.map((breed) => (
              <div
                key={breed.id}
                onClick={() => onSelectTaxon(breed.id)}
                className="group border-2 border-black bg-[#141218] hover:bg-[#1d1922] transition-all shadow-brutal hover:shadow-brutal-lg cursor-pointer flex flex-col brutal-press"
              >
                <div className="relative h-40 w-full overflow-hidden bg-[#0c0a0e] border-b-2 border-black">
                  {breed.thumbnail_url ? (
                    <img
                      src={breed.thumbnail_url}
                      alt={breed.common_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-felid-muted">
                      <Cat className="w-10 h-10" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black text-[9px] font-mono font-black text-felid-accent uppercase border border-black">
                    BREED
                  </span>
                </div>
                <div className="p-4 space-y-2 flex-1 flex flex-col">
                  <div>
                    <h4 className="font-display font-black text-base text-felid-ivory uppercase leading-tight">
                      {breed.common_name}
                    </h4>
                    <p className="text-[11px] italic text-felid-muted font-serif">{breed.scientific_name}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {breed.origin && (
                      <span className="px-1.5 py-0.5 bg-[#0c0a0e] border border-black text-[9px] font-mono text-felid-muted">
                        {breed.origin}
                      </span>
                    )}
                    {breed.coat_length && (
                      <span className="px-1.5 py-0.5 bg-[#0c0a0e] border border-black text-[9px] font-mono text-felid-muted">
                        {breed.coat_length} coat
                      </span>
                    )}
                  </div>
                  {breed.description && (
                    <p className="text-[11px] text-felid-ivory-dim leading-relaxed line-clamp-2">
                      {breed.description}
                    </p>
                  )}
                  <div className="mt-auto pt-2 border-t border-[#332c3a] flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-felid-muted uppercase">CFA recognized</span>
                    <a
                      href={breed.registry_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="text-[9px] font-mono font-black text-felid-accent inline-flex items-center gap-1 hover:underline uppercase"
                    >
                      Registry <ExternalLink className="w-2.5 h-2.5" />
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
        <div className="pb-2 border-b-2 border-black">
          <h3 className="font-display font-black text-lg text-felid-ivory uppercase flex items-center gap-2">
            <Dna className="w-4 h-4 text-felid-accent" />
            WILD FELID HYBRIDS
          </h3>
          <p className="text-[11px] text-felid-muted font-mono mt-1">
            Informational crosses between wild species. Not species, not breeds, and excluded from every count.
          </p>
        </div>

        {visibleHybrids.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleHybrids.map((hybrid) => (
              <div
                key={hybrid.id}
                onClick={() => onSelectTaxon(hybrid.id)}
                className="border-2 border-black bg-[#141218] shadow-brutal-sm hover:shadow-brutal cursor-pointer p-4 space-y-2 brutal-press"
              >
                {hybrid.thumbnail_url ? (
                  <div className="h-28 overflow-hidden border-2 border-black bg-black">
                    <img
                      src={hybrid.thumbnail_url}
                      alt={hybrid.common_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="h-28 border-2 border-dashed border-[#332c3a] bg-[#0c0a0e] flex items-center justify-center">
                    <span className="text-[10px] font-mono text-felid-muted uppercase">No species image</span>
                  </div>
                )}
                <h4 className="font-display font-black text-base text-felid-ivory uppercase">{hybrid.common_name}</h4>
                <p className="text-[10px] italic text-felid-muted font-serif leading-snug">{hybrid.scientific_name}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black text-felid-accent uppercase">
                  Details <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Taxonomy note */}
      {meta && (
        <section className="border-2 border-black bg-[#0c0a0e] p-4 sm:p-5 shadow-brutal-sm space-y-2">
          <h4 className="font-display font-black text-sm text-felid-ivory uppercase">Why these counts are separate</h4>
          <p className="text-xs text-felid-muted leading-relaxed font-mono">{meta.taxonomy_note}</p>
          <p className="text-xs text-felid-muted leading-relaxed font-mono">
            {meta.breed_note} {meta.hybrid_note}
          </p>
          <p className="text-[10px] text-felid-muted font-mono">
            Taxonomy: {meta.authority} ({meta.year}). Registry: {meta.breed_registry.name}. Last curated {meta.updated}.
          </p>
        </section>
      )}
    </section>
  );
};
