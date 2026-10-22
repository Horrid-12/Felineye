import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Utensils,
  Layers,
  Scale,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  PawPrint,
  Cat
} from 'lucide-react';
import { SpeciesDetail } from '../types';
import { api } from '../services/api';
import { ConservationBadge } from '../components/species/ConservationBadge';
import { useCollectionStore } from '../store/useCollectionStore';

interface Props {
  slug: string;
  onBack: () => void;
  onSelectSpecies: (slug: string) => void;
}

export const SpeciesDetailPage: React.FC<Props> = ({ slug, onBack, onSelectSpecies }) => {
  const [species, setSpecies] = useState<SpeciesDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { isDiscovered } = useCollectionStore();

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await api.getSpeciesDetail(slug);
        setSpecies(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load species details.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center text-felid-muted space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-felid-accent border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-mono">Loading feline profile from curated taxonomy...</p>
      </div>
    );
  }

  if (errorMsg || !species) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-pink-400 text-sm">{errorMsg || 'Species not found.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-felid-surface hover:bg-felid-surface-hover text-felid-ivory text-xs border border-felid-border inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Atlas
        </button>
      </div>
    );
  }

  const discovered = isDiscovered(species.id);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8 animate-fadeIn">
      {/* Back navigation button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-felid-muted hover:text-felid-accent transition-colors py-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Species Atlas
        </button>
      </div>

      {/* Hero Profile Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-felid-border bg-felid-surface shadow-card">
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-black">
          <img
            src={species.image_url}
            alt={species.common_name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-felid-surface via-black/45 to-black/25" />

          {/* Top Attribution & Discovery Badge */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-lg bg-black/75 backdrop-blur-sm text-[11px] text-felid-muted border border-white/10">
              {species.image_attribution}
            </span>

            {discovered ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-felid-accent text-black shadow-pink-glow inline-flex items-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5" /> Logged in Journal
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs bg-black/75 backdrop-blur-sm text-felid-accent border border-felid-accent/40 font-mono">
                +{species.xp_reward} Discovery XP
              </span>
            )}
          </div>

          {/* Title and Taxonomy Overlay */}
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ConservationBadge status={species.conservation_status} showTitle />
              <span className="px-3 py-0.5 rounded-full text-xs font-mono bg-felid-pine/90 border border-felid-border text-felid-accent">
                {species.subfamily} · {species.genus}
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-mono bg-felid-pine/90 border border-felid-border text-felid-muted">
                Lineage: {species.lineage}
              </span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-felid-ivory tracking-tight">
              {species.common_name}
            </h1>
            <p className="text-base sm:text-lg italic text-felid-ivory-dim font-serif">
              {species.scientific_name}
            </p>
          </div>
        </div>

        {/* Quick Biological Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-felid-border/60 bg-felid-pine/70 border-t border-felid-border p-4 text-xs">
          <div className="p-3">
            <span className="text-felid-muted block font-mono uppercase text-[10px] mb-1">
              Rarity Tier
            </span>
            <span className="font-display font-semibold text-felid-accent text-sm">
              {species.discovery_rarity}
            </span>
          </div>
          <div className="p-3">
            <span className="text-felid-muted block font-mono uppercase text-[10px] mb-1">
              Body Mass & Length
            </span>
            <span className="font-medium text-felid-ivory leading-tight block">
              {species.size_and_weight || 'Not documented'}
            </span>
          </div>
          <div className="p-3">
            <span className="text-felid-muted block font-mono uppercase text-[10px] mb-1">
              Feline Ecology
            </span>
            <span className="font-medium text-felid-ivory block">
              {species.is_wild ? 'Wild Felid Species' : 'Domestic Cat Companion'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Overview, Characteristics, Behavior */}
        <div className="lg:col-span-2 space-y-8">
          {/* Natural History Overview */}
          <section className="rounded-3xl border border-felid-border bg-felid-surface/60 p-6 space-y-3">
            <h2 className="font-display font-bold text-lg text-felid-ivory flex items-center gap-2">
              <Cat className="w-4 h-4 text-felid-accent" />
              Physical Characteristics & Description
            </h2>
            <p className="text-sm text-felid-ivory-dim leading-relaxed">
              {species.description}
            </p>
          </section>

          {/* Diagnostic Field Identifiers with Pink Bullets */}
          <section className="rounded-3xl border border-felid-border bg-felid-surface/60 p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-felid-ivory flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-felid-accent" />
              Diagnostic Visual Identifiers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {species.distinguishing_characteristics.map((trait, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-felid-pine/60 border border-felid-border/60 flex items-start gap-2.5 text-xs text-felid-ivory-dim"
                >
                  <span className="w-2 h-2 rounded-full bg-felid-accent shrink-0 mt-1.5 shadow-pink-glow" />
                  <span className="leading-relaxed">{trait}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Diet and Hunting Behaviour */}
          <section className="rounded-3xl border border-felid-border bg-felid-surface/60 p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-felid-ivory flex items-center gap-2">
              <Utensils className="w-4 h-4 text-felid-accent" />
              Dietary Ecology & Hunting Behavior
            </h2>
            <div className="space-y-3 text-sm text-felid-ivory-dim leading-relaxed">
              <p>
                <strong className="text-felid-ivory">Diet: </strong>
                {species.diet}
              </p>
              <p>
                <strong className="text-felid-ivory">Behavior & Social Structure: </strong>
                {species.behavior}
              </p>
            </div>
          </section>

          {/* Similar Species Comparison */}
          {species.similar_species.length > 0 && (
            <section className="rounded-3xl border border-felid-border bg-felid-surface/60 p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-felid-ivory flex items-center gap-2">
                <Scale className="w-4 h-4 text-felid-accent" />
                Sister Taxa & Lookalike Cats
              </h2>
              <div className="space-y-3">
                {species.similar_species.map((sim, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-felid-pine/60 border border-felid-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-display font-bold text-sm text-felid-ivory">
                        {sim.common_name}
                      </h4>
                      <p className="text-xs text-felid-muted mt-1 leading-relaxed">
                        <strong className="text-felid-accent">Distinction: </strong>
                        {sim.differentiator}
                      </p>
                    </div>
                    <button
                      onClick={() => onSelectSpecies(sim.slug)}
                      className="shrink-0 px-3.5 py-1.5 rounded-xl bg-felid-surface hover:bg-felid-surface-hover text-felid-ivory text-xs font-medium border border-felid-border transition-colors hover:border-felid-accent"
                    >
                      Compare Profile
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (1 Col): Range, Habitat, External Taxonomy Links */}
        <div className="space-y-6">
          {/* Geographic Range */}
          <div className="rounded-3xl border border-felid-border bg-felid-surface/60 p-6 space-y-3">
            <h3 className="font-display font-bold text-base text-felid-ivory flex items-center gap-2">
              <MapPin className="w-4 h-4 text-felid-accent" />
              Geographic Range
            </h3>
            <p className="text-xs text-felid-ivory-dim leading-relaxed">
              {species.geographic_range || 'Global or undocumented.'}
            </p>
          </div>

          {/* Habitat Biomes */}
          <div className="rounded-3xl border border-felid-border bg-felid-surface/60 p-6 space-y-3">
            <h3 className="font-display font-bold text-base text-felid-ivory flex items-center gap-2">
              <Layers className="w-4 h-4 text-felid-accent" />
              Natural Habitats & Biomes
            </h3>
            <div className="flex flex-wrap gap-2">
              {species.habitats.map((h, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl text-xs bg-felid-pine border border-felid-border text-felid-muted"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* External Taxonomic Authority Links */}
          <div className="rounded-3xl border border-felid-border bg-felid-surface/60 p-6 space-y-3">
            <h3 className="font-display font-bold text-base text-felid-ivory flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-felid-accent" />
              Taxonomic Verification
            </h3>
            <ul className="space-y-2 text-xs">
              {species.inaturalist_taxon_id && (
                <li>
                  <a
                    href={`https://www.inaturalist.org/taxa/${species.inaturalist_taxon_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-felid-pine hover:bg-felid-surface-hover text-felid-ivory transition-colors border border-felid-border hover:border-felid-accent/50"
                  >
                    <span>iNaturalist Taxon #{species.inaturalist_taxon_id}</span>
                    <ExternalLink className="w-3 h-3 text-felid-accent" />
                  </a>
                </li>
              )}
              {species.gbif_taxon_key && (
                <li>
                  <a
                    href={`https://www.gbif.org/species/${species.gbif_taxon_key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-felid-pine hover:bg-felid-surface-hover text-felid-ivory transition-colors border border-felid-border hover:border-felid-accent/50"
                  >
                    <span>GBIF Key #{species.gbif_taxon_key}</span>
                    <ExternalLink className="w-3 h-3 text-felid-accent" />
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`https://www.iucnredlist.org/search?query=${encodeURIComponent(species.scientific_name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-felid-pine hover:bg-felid-surface-hover text-felid-ivory transition-colors border border-felid-border hover:border-felid-accent/50"
                >
                  <span>IUCN Red List Assessment</span>
                  <ExternalLink className="w-3 h-3 text-felid-accent" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
