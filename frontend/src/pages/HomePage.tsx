import React, { useEffect, useState } from 'react';
import { PawPrint, Cat, ArrowRight, Compass, Award } from 'lucide-react';
import { ActivePage, CatalogMeta, SpeciesDetail } from '../types';
import { api } from '../services/api';
import { ConservationBadge } from '../components/species/ConservationBadge';
import { useCollectionStore } from '../store/useCollectionStore';
import { BotanicalRule, SpecimenCorners } from '../components/ui/JournalOrnament';
import { LoadingState } from '../components/ui/JournalPrimitives';

interface Props {
  setActivePage: (page: ActivePage) => void;
  onSelectSpecies: (slug: string) => void;
  onOpenDomestic: () => void;
}

export const HomePage: React.FC<Props> = ({
  setActivePage,
  onSelectSpecies,
  onOpenDomestic,
}) => {
  const [featured, setFeatured] = useState<SpeciesDetail | null>(null);
  const [meta, setMeta] = useState<CatalogMeta | null>(null);
  const { totalXp, currentRank, discoveryCount } = useCollectionStore();

  useEffect(() => {
    async function loadFeatured() {
      try {
        const item = await api.getFeaturedSpecies();
        setFeatured(item);
      } catch (e) {
        console.error('Failed to load featured species:', e);
      }
    }
    async function loadCounts() {
      try {
        setMeta(await api.getCatalogMeta());
      } catch (e) {
        console.error('Failed to load catalog counts:', e);
      }
    }
    loadFeatured();
    loadCounts();
  }, []);

  return (
    <div className="space-y-8 py-2">
      {/* Editorial Naturalist Monograph Hero */}
      <section className="journal-plate overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Editorial Folio */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-5 flex flex-col justify-center relative">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1 bg-felid-elevated/80 border border-felid-cobalt/25 rounded-sm text-[11px] font-mono font-medium text-felid-cobalt-ink uppercase tracking-wider">
              <PawPrint className="w-3.5 h-3.5" />
              <span>AI Field Guide · IUCN SSC CatSG 2017 Taxonomy</span>
            </div>

            <h1 className="font-display font-semibold text-3xl sm:text-4xl lg:text-[2.85rem] text-felid-ink tracking-tight leading-[1.08]">
              Discover the World of{' '}
              <span className="italic text-felid-pomegranate-ink">Felidae</span>
            </h1>

            <p className="text-sm sm:text-base text-felid-muted-ink max-w-xl leading-relaxed font-sans">
              From domestic companions curled on your windowsill to solitary snow leopards of alpine ridges. Upload a photograph and let a local vision model rank candidate species — with honest abstention when the evidence is weak.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setActivePage('identify')}
                className="btn-primary text-xs sm:text-sm"
              >
                <PawPrint className="w-4 h-4" />
                <span>Scan a Cat Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('species')}
                className="btn-secondary text-xs sm:text-sm"
              >
                <Cat className="w-4 h-4 text-felid-cobalt-ink" />
                <span>Browse Cat Atlas</span>
              </button>
              <button
                type="button"
                onClick={onOpenDomestic}
                className="btn-secondary text-xs sm:text-sm"
              >
                <Cat className="w-4 h-4 text-felid-pomegranate-ink" />
                <span>Domestic Cats</span>
              </button>
            </div>
          </div>

          {/* Right Framed Specimen Plate */}
          <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-[320px] bg-felid-elevated border-t lg:border-t-0 lg:border-l border-felid-border overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1400&q=80"
              alt="Graceful Feline Companion"
              className="w-full h-full object-cover object-center"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-felid-photo-scrim/75 via-transparent to-felid-photo-scrim/20 pointer-events-none"
              aria-hidden="true"
            />
            <SpecimenCorners colorClass="border-felid-photo-ink/50" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-felid-photo-ink/90">
              <span>Plate I · Felis catus</span>
              <span className="uppercase tracking-wider">Archival Vision</span>
            </div>
          </div>
        </div>

        {/* Catalogue Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-felid-border bg-felid-border gap-px text-center">
          <div className="p-3.5 bg-felid-elevated">
            <span className="block font-mono font-medium text-xl text-felid-cobalt-ink">
              {meta?.wild_species_count ?? '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-felid-muted-ink font-mono">
              Wild Species
            </span>
          </div>
          <div className="p-3.5 bg-felid-elevated">
            <span className="block font-mono font-medium text-xl text-felid-pomegranate-ink">
              {meta?.domestic_species_count ?? '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-felid-muted-ink font-mono">
              Domestic Species
            </span>
          </div>
          <div className="p-3.5 bg-felid-elevated">
            <span className="block font-mono font-medium text-xl text-felid-highlight-ink">
              {meta?.breed_count ?? '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-felid-muted-ink font-mono">
              CFA Breeds
            </span>
          </div>
          <div className="p-3.5 bg-felid-elevated">
            <span className="block font-mono font-medium text-xl text-felid-ink">
              {meta?.lineage_count ?? '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-felid-muted-ink font-mono">
              Cat Lineages
            </span>
          </div>
        </div>
      </section>

      <BotanicalRule />

      {/* Featured Feline of the Day & Expedition Telemetry */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Species Card (2 Columns) */}
        <div className="lg:col-span-2 journal-plate p-6 sm:p-7 flex flex-col justify-between">
          {featured ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-felid-border">
                <span className="inline-flex items-center gap-2 text-xs font-mono font-medium text-felid-cobalt-ink uppercase tracking-wider">
                  <Cat className="w-4 h-4" />
                  <span>Featured Specimen of the Day</span>
                </span>
                <ConservationBadge status={featured.conservation_status} showTitle />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-64 overflow-hidden border border-felid-border-strong rounded-sm bg-felid-elevated relative group">
                  <img
                    src={featured.image_url}
                    alt={featured.common_name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 bg-felid-photo-scrim/80 text-[10px] font-mono text-felid-photo-ink/90 truncate">
                    {featured.image_attribution}
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <h2 className="font-display font-semibold text-2xl sm:text-3xl text-felid-ink leading-tight">
                      {featured.common_name}
                    </h2>
                    <p className="text-sm italic text-felid-muted-ink font-serif mt-0.5">
                      {featured.scientific_name}
                    </p>
                  </div>

                  <p className="text-sm text-felid-muted-ink leading-relaxed line-clamp-4 font-sans">
                    {featured.description}
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectSpecies(featured.id)}
                      className="btn-secondary text-xs"
                    >
                      <span>Explore Cat Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 text-felid-cobalt-ink" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <LoadingState label="Loading featured specimen..." className="py-16" />
          )}
        </div>

        {/* Expedition Telemetry Widget */}
        <div className="journal-plate p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-felid-highlight-ink text-xs font-mono font-medium uppercase tracking-wider pb-3.5 border-b border-felid-border">
              <Compass className="w-4 h-4" />
              <span>Field Journal Telemetry</span>
            </div>

            <div>
              <span className="text-[10px] text-felid-muted-ink font-mono uppercase tracking-wider block">
                Naturalist Rank
              </span>
              <h3 className="font-display font-semibold text-2xl text-felid-ink mt-0.5">
                {currentRank.title}
              </h3>
              <p className="text-xs sm:text-sm text-felid-muted-ink mt-1.5 leading-relaxed font-sans">
                {currentRank.description}
              </p>
            </div>

            <div className="journal-inset p-4 space-y-2.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-felid-muted-ink uppercase">Species Logged</span>
                <span className="font-medium text-felid-ink">{discoveryCount} Cats</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-felid-muted-ink uppercase">Discovery XP</span>
                <span className="font-medium text-felid-highlight-ink">{totalXp} XP</span>
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setActivePage('collection')}
              className="btn-primary w-full text-xs"
            >
              <Award className="w-4 h-4" />
              <span>Open Field Journal</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
