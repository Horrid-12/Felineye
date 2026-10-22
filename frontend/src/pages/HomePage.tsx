import React, { useEffect, useState } from 'react';
import { Eye, BookOpen, Award, ArrowRight, Sparkles, Shield, Compass, PawPrint, Cat, Heart } from 'lucide-react';
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
      {/* Hero Section with Pinky-Gray Velvet Aesthetic */}
      <section className="relative rounded-3xl overflow-hidden border border-felid-border bg-felid-pine shadow-card">
        {/* Background Image with Rosy Charcoal Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1800&q=80"
            alt="Graceful Feline Companion"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-felid-dark via-felid-dark/95 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-felid-dark via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-felid-accent/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-3xl p-8 sm:p-12 lg:p-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-felid-surface border border-felid-accent/30 text-xs font-mono text-felid-accent shadow-pink-glow">
            <PawPrint className="w-3.5 h-3.5" />
            <span>AI Identification & Field Guide to the Family Felidae</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-felid-ivory tracking-tight leading-[1.15]">
            Discover the World of <span className="text-felid-accent">Cats</span>
          </h1>

          <p className="text-base sm:text-lg text-felid-muted leading-relaxed max-w-2xl">
            From playful domestic companions curled on your couch to the solitary snow leopards of alpine peaks. Upload a photograph of any cat to identify its species with transparent AI confidence metrics.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActivePage('identify')}
              className="px-6 py-3.5 rounded-2xl bg-felid-accent hover:bg-felid-accent-hover text-black font-semibold text-sm inline-flex items-center gap-2 shadow-pink-glow transition-all hover:scale-[1.02] focus:outline-none"
            >
              <PawPrint className="w-4 h-4" />
              Scan a Cat Photo
            </button>
            <button
              onClick={() => setActivePage('species')}
              className="px-6 py-3.5 rounded-2xl bg-felid-surface hover:bg-felid-surface-hover text-felid-ivory font-medium text-sm border border-felid-border inline-flex items-center gap-2 transition-colors focus:outline-none"
            >
              <Cat className="w-4 h-4 text-felid-accent" />
              Browse Cat Atlas
            </button>
          </div>
        </div>

        {/* Quick Platform Metrics */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 border-t border-felid-border/60 bg-black/50 backdrop-blur-sm divide-x divide-felid-border/50 text-center py-4">
          <div className="p-3">
            <span className="block font-display font-bold text-xl sm:text-2xl text-felid-accent">
              37+
            </span>
            <span className="text-[11px] uppercase tracking-wider text-felid-muted font-mono">
              Feline Species
            </span>
          </div>
          <div className="p-3">
            <span className="block font-display font-bold text-xl sm:text-2xl text-felid-accent">
              8
            </span>
            <span className="text-[11px] uppercase tracking-wider text-felid-muted font-mono">
              Evolutionary Lineages
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
              Cats in Your Journal
            </span>
          </div>
        </div>
      </section>

      {/* Featured Feline of the Day & Quick Progress */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Featured Species Card (2 Columns) */}
        <div className="lg:col-span-2 rounded-3xl border border-felid-border bg-felid-surface/80 p-6 sm:p-8 flex flex-col justify-between shadow-card">
          {featured ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-felid-accent uppercase tracking-wider">
                  <Cat className="w-4 h-4" />
                  Featured Feline of the Day
                </span>
                <ConservationBadge status={featured.conservation_status} showTitle />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-64 rounded-2xl overflow-hidden border border-felid-border bg-felid-pine relative group">
                  <img
                    src={featured.image_url}
                    alt={featured.common_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-sm text-[10px] text-felid-muted">
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
                      className="px-4 py-2 rounded-xl bg-felid-pine hover:bg-felid-surface-hover text-felid-ivory text-xs font-medium border border-felid-border inline-flex items-center gap-2 transition-all hover:border-felid-accent"
                    >
                      <span>Explore Cat Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 text-felid-accent" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-felid-muted">
              Loading featured feline...
            </div>
          )}
        </div>

        {/* Discovery Expedition Widget (1 Column) */}
        <div className="rounded-3xl border border-felid-border bg-felid-surface/80 p-6 flex flex-col justify-between shadow-card">
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

            <div className="p-4 rounded-2xl bg-felid-pine/60 border border-felid-border/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-felid-muted">Species Cataloged</span>
                <span className="font-mono font-semibold text-felid-ivory">{discoveryCount} Cats</span>
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
              className="w-full py-2.5 rounded-xl bg-felid-pine hover:bg-felid-surface-hover text-felid-ivory text-xs font-medium border border-felid-border inline-flex items-center justify-center gap-2 transition-all hover:border-felid-accent"
            >
              <Award className="w-4 h-4 text-felid-accent" />
              Open Field Journal
            </button>
          </div>
        </div>
      </section>

      {/* Ethical Exploration Highlights */}
      <section className="rounded-3xl border border-felid-border bg-felid-surface/50 p-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-display font-bold text-2xl text-felid-ivory">
            Scientific Accuracy & Feline Protection
          </h2>
          <p className="text-xs text-felid-muted leading-relaxed">
            Curated from peer-reviewed cat taxonomy, verified occurrences, and transparent AI models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-felid-pine/50 border border-felid-border/50 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-felid-accent flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-sm text-felid-ivory">
              Ethical Obfuscation
            </h4>
            <p className="text-xs text-felid-muted leading-relaxed">
              We never expose precise latitude and longitude for threatened felids like tigers or snow leopards. Locations are generalized to broad protected reserves.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-felid-pine/50 border border-felid-border/50 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-felid-accent flex items-center justify-center">
              <PawPrint className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-sm text-felid-ivory">
              Transparent Uncertainty
            </h4>
            <p className="text-xs text-felid-muted leading-relaxed">
              Models evaluate Shannon entropy and feature bounds. If lighting, angle, or quality prevents definitive identification, the system returns an explicit uncertain state.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-felid-pine/50 border border-felid-border/50 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-felid-accent flex items-center justify-center">
              <Cat className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-sm text-felid-ivory">
              All 8 Cat Lineages
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
