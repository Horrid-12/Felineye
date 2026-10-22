import React, { useEffect, useState } from 'react';
import { Eye, BookOpen, Award, ArrowRight, Sparkles, Shield, Compass } from 'lucide-react';
import { ActivePage, SpeciesDetail } from '../types';
import { api } from '../services/api';
import { ConservationBadge } from '../components/species/ConservationBadge';
import { useCollectionStore } from '../store/useCollectionStore';

interface Props {
  setActivePage: (page: ActivePage) => void;
  onSelectSpecies: (slug: string) => void;
}

export const HomePage: React.FC<Props> = ({ setActivePage, onSelectSpecies }) => {
  const [featured, setFeatured] = useState<SpeciesDetail | null>(null);
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
    loadFeatured();
  }, []);

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-felid-border bg-felid-pine shadow-card">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1800&q=80"
            alt="Majestic Lion in African Savanna"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-felid-dark via-felid-dark/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-felid-dark via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl p-8 sm:p-12 lg:p-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-felid-surface border border-felid-accent/30 text-xs font-mono text-felid-accent">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Field Guide to the Family Felidae</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-felid-ivory tracking-tight leading-[1.15]">
            Discover the Kingdom of <span className="text-felid-accent">Felids</span>
          </h1>

          <p className="text-base sm:text-lg text-felid-muted leading-relaxed max-w-2xl">
            From the roar of Serengeti lions to the elusive snow leopards of the Himalayas and domestic companions in our homes. Upload a photograph to identify species with transparent AI confidence metrics.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActivePage('identify')}
              className="px-6 py-3.5 rounded-xl bg-felid-accent hover:bg-felid-accent-hover text-black font-semibold text-sm inline-flex items-center gap-2 shadow-forest-glow transition-all hover:scale-[1.02] focus:outline-none"
            >
              <Eye className="w-4 h-4" />
              Identify a Photo
            </button>
            <button
              onClick={() => setActivePage('species')}
              className="px-6 py-3.5 rounded-xl bg-felid-surface hover:bg-felid-surface-hover text-felid-ivory font-medium text-sm border border-felid-border inline-flex items-center gap-2 transition-colors focus:outline-none"
            >
              <BookOpen className="w-4 h-4 text-felid-muted" />
              Browse Species Atlas
            </button>
          </div>
        </div>

        {/* Quick Platform Metrics */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 border-t border-felid-border/60 bg-black/40 backdrop-blur-sm divide-x divide-felid-border/50 text-center py-4">
          <div className="p-3">
            <span className="block font-display font-bold text-xl sm:text-2xl text-felid-accent">
              37+
            </span>
            <span className="text-[11px] uppercase tracking-wider text-felid-muted font-mono">
              Curated Species
            </span>
          </div>
          <div className="p-3">
            <span className="block font-display font-bold text-xl sm:text-2xl text-felid-accent">
              8
            </span>
            <span className="text-[11px] uppercase tracking-wider text-felid-muted font-mono">
              Feline Lineages
            </span>
          </div>
          <div className="p-3">
            <span className="block font-display font-bold text-xl sm:text-2xl text-felid-accent">
              100%
            </span>
            <span className="text-[11px] uppercase tracking-wider text-felid-muted font-mono">
              Obscured Coordinates
            </span>
          </div>
          <div className="p-3">
            <span className="block font-display font-bold text-xl sm:text-2xl text-felid-accent">
              {discoveryCount}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-felid-muted font-mono">
              Your Discoveries
            </span>
          </div>
        </div>
      </section>

      {/* Featured Feline of the Day & Quick Progress */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Featured Species Card (2 Columns) */}
        <div className="lg:col-span-2 rounded-2xl border border-felid-border bg-felid-surface/80 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          {featured ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-felid-accent uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Feline of the Day
                </span>
                <ConservationBadge status={featured.conservation_status} showTitle />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-60 rounded-xl overflow-hidden border border-felid-border bg-felid-pine relative group">
                  <img
                    src={featured.image_url}
                    alt={featured.common_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-[10px] text-felid-muted">
                    {featured.image_attribution}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-felid-ivory">
                      {featured.common_name}
                    </h3>
                    <p className="text-sm italic text-felid-muted font-serif">
                      {featured.scientific_name}
                    </p>
                  </div>

                  <p className="text-xs text-felid-ivory-dim leading-relaxed line-clamp-4">
                    {featured.description}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => onSelectSpecies(featured.id)}
                      className="px-4 py-2 rounded-lg bg-felid-pine hover:bg-felid-border text-felid-ivory text-xs font-medium border border-felid-border inline-flex items-center gap-2 transition-colors"
                    >
                      View Full Encyclopedia Entry
                      <ArrowRight className="w-3.5 h-3.5 text-felid-accent" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-felid-muted">
              Loading featured species...
            </div>
          )}
        </div>

        {/* Discovery Expedition Widget (1 Column) */}
        <div className="rounded-2xl border border-felid-border bg-felid-surface/80 p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-felid-accent text-xs font-mono uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Expedition Status</span>
            </div>

            <div>
              <span className="text-xs text-felid-muted block">Field Naturalist Rank</span>
              <h3 className="font-display font-bold text-xl text-felid-ivory mt-0.5">
                {currentRank.title}
              </h3>
              <p className="text-xs text-felid-muted mt-1 leading-relaxed">
                {currentRank.description}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-felid-pine/60 border border-felid-border/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-felid-muted">Discoveries</span>
                <span className="font-mono font-semibold text-felid-ivory">{discoveryCount} Species</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-felid-muted">Experience</span>
                <span className="font-mono font-semibold text-felid-accent">{totalXp} XP</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => setActivePage('collection')}
              className="w-full py-2.5 rounded-xl bg-felid-pine hover:bg-felid-border text-felid-ivory text-xs font-medium border border-felid-border inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Award className="w-4 h-4 text-felid-accent" />
              Open Field Journal
            </button>
          </div>
        </div>
      </section>

      {/* Ethical Exploration Highlights */}
      <section className="rounded-2xl border border-felid-border bg-felid-surface/50 p-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-display font-bold text-2xl text-felid-ivory">
            Scientific Accuracy & Responsible Wildlife Discovery
          </h2>
          <p className="text-xs text-felid-muted leading-relaxed">
            Built from peer-reviewed taxonomic checklists, verified iNaturalist occurrences, and transparent probabilistic AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 rounded-xl bg-felid-pine/50 border border-felid-border/50 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-sm text-felid-ivory">
              Ethical Obfuscation
            </h4>
            <p className="text-xs text-felid-muted leading-relaxed">
              We never expose precise latitude and longitude for threatened felids like tigers or snow leopards. Locations are generalized to broad protected reserves.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-felid-pine/50 border border-felid-border/50 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-sm text-felid-ivory">
              Transparent Uncertainty
            </h4>
            <p className="text-xs text-felid-muted leading-relaxed">
              Models evaluate Shannon entropy and feature bounds. If lighting, angle, or quality prevents definitive identification, the system returns an explicit uncertain state.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-felid-pine/50 border border-felid-border/50 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-sm text-felid-ivory">
              Curated Taxonomy
            </h4>
            <p className="text-xs text-felid-muted leading-relaxed">
              Includes comprehensive morphometrics, diet, behaviour, and IUCN Red List statuses for all 41 extant species across both Pantherinae and Felinae subfamilies.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
