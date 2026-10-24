import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Utensils,
  Layers,
  Scale,
  ExternalLink,
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
      <div className="py-24 text-center text-felid-muted space-y-3 font-mono">
        <div className="w-8 h-8 border-2 border-felid-accent border-t-transparent animate-spin mx-auto" />
        <p className="text-xs uppercase">LOADING CURATED TAXONOMIC DOSSIER...</p>
      </div>
    );
  }

  if (errorMsg || !species) {
    return (
      <div className="py-20 text-center space-y-4 font-mono">
        <p className="text-pink-400 text-sm uppercase">{errorMsg || 'Species not found.'}</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-felid-accent text-black text-xs font-mono font-black border-2 border-black shadow-brutal-sm brutal-press inline-flex items-center gap-2 uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Atlas
        </button>
      </div>
    );
  }

  const discovered = isDiscovered(species.id);

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-8 animate-fadeIn">
      {/* Back navigation button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-felid-muted hover:text-felid-accent transition-colors py-1.5 uppercase brutal-press"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Species Atlas
        </button>
      </div>

      {/* Hero Profile Banner */}
      <div className="border-2 border-black bg-[#141218] shadow-brutal-lg overflow-hidden">
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-black border-b-2 border-black">
          <img
            src={species.image_url}
            alt={species.common_name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Viewfinder crosshairs */}
          <div className="absolute top-2 left-2 text-felid-accent font-mono text-[10px] pointer-events-none">+ [OPTICAL_DOSSIER]</div>
          <div className="absolute top-2 right-2 text-felid-accent font-mono text-[10px] pointer-events-none">ONLINE +</div>

          {/* Top Attribution & Discovery Badge */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
            <span className="px-2.5 py-1 bg-black text-[10px] font-mono text-felid-muted border border-black shadow-brutal-sm">
              {species.image_attribution}
            </span>

            {discovered ? (
              <span className="px-3 py-1 text-xs font-mono font-black uppercase tracking-wider bg-felid-accent text-black border-2 border-black shadow-brutal-sm inline-flex items-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5" /> LOGGED IN JOURNAL
              </span>
            ) : (
              <span className="px-3 py-1 text-xs bg-black text-felid-accent border-2 border-black shadow-brutal-sm font-mono font-black">
                +{species.xp_reward} DISCOVERY XP
              </span>
            )}
          </div>

          {/* Title and Taxonomy Overlay */}
          <div className="absolute bottom-6 left-6 right-6 space-y-2 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <ConservationBadge status={species.conservation_status} showTitle />
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-black border-2 border-black text-felid-accent shadow-brutal-sm">
                {species.subfamily} · {species.genus}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-black border-2 border-black text-felid-muted shadow-brutal-sm">
                LINEAGE: {species.lineage}
              </span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-felid-ivory uppercase tracking-tight">
              {species.common_name}
            </h1>
            <p className="text-base sm:text-lg italic text-felid-ivory-dim font-serif">
              {species.scientific_name}
            </p>
          </div>
        </div>

        {/* Quick Biological Metrics Strip (Promptify Inset Influence) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-black bg-[#0c0a0e] p-2 text-xs font-mono">
          <div className="p-3 text-center sm:text-left">
            <span className="text-felid-muted block uppercase text-[10px] font-bold mb-0.5">
              Rarity Tier
            </span>
            <span className="font-black text-felid-accent text-sm uppercase">
              {species.discovery_rarity}
            </span>
          </div>
          <div className="p-3 text-center sm:text-left">
            <span className="text-felid-muted block uppercase text-[10px] font-bold mb-0.5">
              Body Mass & Length
            </span>
            <span className="font-bold text-felid-ivory leading-tight block">
              {species.size_and_weight || 'Not documented'}
            </span>
          </div>
          <div className="p-3 text-center sm:text-left">
            <span className="text-felid-muted block uppercase text-[10px] font-bold mb-0.5">
              Feline Ecology
            </span>
            <span className="font-bold text-felid-ivory block uppercase">
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
          <section className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase flex items-center gap-2">
              <Cat className="w-5 h-5 text-felid-accent" />
              PHYSICAL CHARACTERISTICS & DESCRIPTION
            </h2>
            <p className="text-sm text-felid-ivory-dim leading-relaxed font-sans">
              {species.description}
            </p>
          </section>

          {/* Diagnostic Field Identifiers */}
          <section className="border-2 border-black bg-[#141218] p-6 space-y-4 shadow-brutal">
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-felid-accent" />
              DIAGNOSTIC VISUAL IDENTIFIERS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {species.distinguishing_characteristics.map((trait, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm flex items-start gap-2.5 text-xs text-felid-ivory-dim"
                >
                  <span className="w-2 h-2 bg-felid-accent shrink-0 mt-1" />
                  <span className="leading-relaxed font-mono">{trait}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Diet and Hunting Behaviour */}
          <section className="border-2 border-black bg-[#141218] p-6 space-y-4 shadow-brutal">
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase flex items-center gap-2">
              <Utensils className="w-5 h-5 text-felid-accent" />
              DIETARY ECOLOGY & HUNTING BEHAVIOR
            </h2>
            <div className="space-y-3 text-sm text-felid-ivory-dim leading-relaxed font-sans">
              <p>
                <strong className="text-felid-ivory font-mono uppercase text-xs block">Dietary Base:</strong>
                {species.diet}
              </p>
              <p>
                <strong className="text-felid-ivory font-mono uppercase text-xs block">Behavior & Social Structure:</strong>
                {species.behavior}
              </p>
            </div>
          </section>

          {/* Similar Species Comparison */}
          {species.similar_species.length > 0 && (
            <section className="border-2 border-black bg-[#141218] p-6 space-y-4 shadow-brutal">
              <h2 className="font-display font-black text-lg text-felid-ivory uppercase flex items-center gap-2">
                <Scale className="w-5 h-5 text-felid-accent" />
                SISTER TAXA & LOOKALIKE CATS
              </h2>
              <div className="space-y-3">
                {species.similar_species.map((sim, i) => (
                  <div
                    key={i}
                    className="p-4 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-display font-black text-base text-felid-ivory uppercase">
                        {sim.common_name}
                      </h4>
                      <p className="text-xs text-felid-muted mt-1 leading-relaxed font-mono">
                        <strong className="text-felid-accent uppercase">Distinction: </strong>
                        {sim.differentiator}
                      </p>
                    </div>
                    <button
                      onClick={() => onSelectSpecies(sim.slug)}
                      className="shrink-0 px-4 py-2 bg-felid-accent hover:bg-felid-accent-hover text-black text-xs font-mono font-black border-2 border-black shadow-brutal-sm brutal-press uppercase"
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
          <div className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
            <h3 className="font-display font-black text-base text-felid-ivory uppercase flex items-center gap-2">
              <MapPin className="w-4 h-4 text-felid-accent" />
              GEOGRAPHIC RANGE
            </h3>
            <p className="text-xs text-felid-ivory-dim leading-relaxed font-mono">
              {species.geographic_range || 'Global or undocumented.'}
            </p>
          </div>

          {/* Habitat Biomes */}
          <div className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
            <h3 className="font-display font-black text-base text-felid-ivory uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-felid-accent" />
              NATURAL HABITATS & BIOMES
            </h3>
            <div className="flex flex-wrap gap-2">
              {species.habitats.map((h, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-mono bg-[#0c0a0e] border border-black text-felid-muted font-bold"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* External Taxonomic Authority Links */}
          <div className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
            <h3 className="font-display font-black text-base text-felid-ivory uppercase flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-felid-accent" />
              TAXONOMIC VERIFICATION
            </h3>
            <ul className="space-y-2 text-xs font-mono">
              {species.inaturalist_taxon_id && (
                <li>
                  <a
                    href={`https://www.inaturalist.org/taxa/${species.inaturalist_taxon_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 bg-[#0c0a0e] hover:bg-[#1d1922] text-felid-ivory transition-colors border-2 border-black shadow-brutal-sm"
                  >
                    <span>iNaturalist Taxon #{species.inaturalist_taxon_id}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-felid-accent" />
                  </a>
                </li>
              )}
              {species.gbif_taxon_key && (
                <li>
                  <a
                    href={`https://www.gbif.org/species/${species.gbif_taxon_key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 bg-[#0c0a0e] hover:bg-[#1d1922] text-felid-ivory transition-colors border-2 border-black shadow-brutal-sm"
                  >
                    <span>GBIF Key #{species.gbif_taxon_key}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-felid-accent" />
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`https://www.iucnredlist.org/search?query=${encodeURIComponent(species.scientific_name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 bg-[#0c0a0e] hover:bg-[#1d1922] text-felid-ivory transition-colors border-2 border-black shadow-brutal-sm"
                >
                  <span>IUCN Red List Assessment</span>
                  <ExternalLink className="w-3.5 h-3.5 text-felid-accent" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
