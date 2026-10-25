import React, { useEffect, useState } from 'react';
import { PawPrint, Cat, ArrowRight, Compass, Award } from 'lucide-react';
import { ActivePage, CatalogMeta, SpeciesDetail } from '../types';
import { api } from '../services/api';
import { ConservationBadge } from '../components/species/ConservationBadge';
import { useCollectionStore } from '../store/useCollectionStore';

interface Props {
  setActivePage: (page: ActivePage) => void;
  onSelectSpecies: (slug: string) => void;
  onOpenDomestic: () => void;
}

export const HomePage: React.FC<Props> = ({ setActivePage, onSelectSpecies, onOpenDomestic }) => {
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
      {/* Hero Section with Velvet Neo-Brutalist Aesthetic */}
      <section className="border-2 border-black bg-[#141218] shadow-brutal-lg relative overflow-hidden">
        {/* Background Graphic Elements */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1800&q=80"
            alt="Graceful Feline Companion"
            className="w-full h-full object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a0e] via-[#0c0a0e]/90 to-transparent" />
        </div>

        {/* Viewfinder Corner Overlays */}
        <div className="absolute top-2 left-2 text-felid-accent font-mono text-[10px] z-10 select-none">+ [HUD_STATION]</div>
        <div className="absolute top-2 right-2 text-felid-accent font-mono text-[10px] z-10 select-none">ONLINE +</div>

        <div className="relative z-10 max-w-3xl p-5 sm:p-7 lg:p-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono font-black text-felid-accent uppercase">
            <PawPrint className="w-3.5 h-3.5" />
            <span>AI FIELD GUIDE // IUCN SSC CATSG 2017 TAXONOMY</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-felid-ivory uppercase tracking-tight leading-[1.05]">
            DISCOVER THE WORLD OF <span className="text-felid-accent underline decoration-4 underline-offset-4">CATS</span>
          </h1>

          <p className="text-xs sm:text-sm text-felid-muted max-w-2xl leading-relaxed">
            From playful domestic companions curled on your couch to solitary snow leopards of alpine cliffs. Upload any photograph to classify feline morphology with transparent Shannon entropy confidence gates.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => setActivePage('identify')}
              className="px-5 py-2.5 bg-felid-accent hover:bg-felid-accent-hover text-black font-mono font-black text-xs uppercase border-2 border-black shadow-brutal brutal-press inline-flex items-center gap-2"
            >
              <PawPrint className="w-4 h-4" />
              Scan a Cat Photo
            </button>
            <button
              onClick={() => setActivePage('species')}
              className="px-5 py-2.5 bg-[#1d1922] hover:bg-[#26222d] text-felid-ivory font-mono font-bold text-xs uppercase border-2 border-black shadow-brutal brutal-press inline-flex items-center gap-2"
            >
              <Cat className="w-4 h-4 text-felid-accent" />
              Browse Cat Atlas
            </button>
            <button
              onClick={onOpenDomestic}
              className="px-5 py-2.5 bg-[#1d1922] hover:bg-[#26222d] text-felid-ivory font-mono font-bold text-xs uppercase border-2 border-black shadow-brutal brutal-press inline-flex items-center gap-2"
            >
              <Cat className="w-4 h-4 text-felid-accent" />
              Domestic Cats
            </button>
          </div>
        </div>

        {/* Promptify-Style Quick Platform Metrics Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 border-t-2 border-black bg-[#0c0a0e] divide-x-2 divide-black text-center">
          <div className="p-2.5">
            <span className="block font-mono font-black text-lg sm:text-xl text-felid-accent">
              {meta?.wild_species_count ?? '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-felid-muted font-mono font-bold">
              Wild Species
            </span>
          </div>
          <div className="p-2.5">
            <span className="block font-mono font-black text-lg sm:text-xl text-felid-accent">
              {meta?.domestic_species_count ?? '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-felid-muted font-mono font-bold">
              Domestic Species
            </span>
          </div>
          <div className="p-2.5">
            <span className="block font-mono font-black text-lg sm:text-xl text-emerald-400">
              {meta?.breed_count ?? '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-felid-muted font-mono font-bold">
              CFA Breeds
            </span>
          </div>
          <div className="p-2.5">
            <span className="block font-mono font-black text-lg sm:text-xl text-felid-ivory">
              {meta?.lineage_count ?? '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-felid-muted font-mono font-bold">
              Cat Lineages
            </span>
          </div>
        </div>
      </section>

      {/* Featured Feline of the Day & Quick Progress */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Featured Species Card (2 Columns) */}
        <div className="lg:col-span-2 border-2 border-black bg-[#141218] p-6 sm:p-8 flex flex-col justify-between shadow-brutal space-y-6">
          {featured ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black text-felid-accent uppercase tracking-wider">
                  <Cat className="w-4 h-4" />
                  FEATURED FELINE OF THE DAY
                </span>
                <ConservationBadge status={featured.conservation_status} showTitle />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-64 overflow-hidden border-2 border-black bg-[#0c0a0e] relative group shadow-brutal-sm">
                  <img
                    src={featured.image_url}
                    alt={featured.common_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black text-[9px] font-mono text-felid-muted border border-black">
                    {featured.image_attribution}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-display font-black text-2xl text-felid-ivory uppercase">
                      {featured.common_name}
                    </h3>
                    <p className="text-xs italic text-felid-muted font-serif">
                      {featured.scientific_name}
                    </p>
                  </div>

                  <p className="text-xs text-felid-ivory-dim leading-relaxed line-clamp-4">
                    {featured.description}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => onSelectSpecies(featured.id)}
                      className="px-4 py-2.5 bg-[#1d1922] hover:bg-[#26222d] text-felid-ivory text-xs font-mono font-bold border-2 border-black shadow-brutal-sm brutal-press inline-flex items-center gap-2 uppercase"
                    >
                      <span>Explore Cat Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 text-felid-accent" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-felid-muted font-mono">
              Loading featured feline...
            </div>
          )}
        </div>

        {/* Discovery Expedition Widget (1 Column, Promptify Inset Influence) */}
        <div className="border-2 border-black bg-[#141218] p-6 flex flex-col justify-between shadow-brutal">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-felid-accent text-xs font-mono font-black uppercase tracking-wider pb-3 border-b-2 border-black">
              <Compass className="w-4 h-4" />
              <span>EXPEDITION TELEMETRY</span>
            </div>

            <div>
              <span className="text-[10px] text-felid-muted font-mono uppercase block">FIELD NATURALIST RANK</span>
              <h3 className="font-display font-black text-xl text-felid-ivory uppercase mt-0.5">
                {currentRank.title}
              </h3>
              <p className="text-xs text-felid-muted mt-1 leading-relaxed font-mono">
                {currentRank.description}
              </p>
            </div>

            <div className="p-4 bg-[#0c0a0e] border-2 border-black space-y-2 shadow-brutal-sm">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-felid-muted uppercase">Species Logged</span>
                <span className="font-bold text-felid-ivory">{discoveryCount} Cats</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-felid-muted uppercase">Discovery XP</span>
                <span className="font-bold text-felid-accent">{totalXp} XP</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => setActivePage('collection')}
              className="w-full py-3 bg-felid-accent hover:bg-felid-accent-hover text-black text-xs font-mono font-black border-2 border-black shadow-brutal brutal-press inline-flex items-center justify-center gap-2 uppercase"
            >
              <Award className="w-4 h-4" />
              Open Field Journal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
