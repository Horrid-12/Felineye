import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Utensils,
  Layers,
  Scale,
  ExternalLink,
  PawPrint,
  Cat,
  Dna,
  Info,
} from 'lucide-react';
import { BreedDetail, HybridDetail, SpeciesDetail, TaxonDetail } from '../types';
import { api } from '../services/api';
import { ConservationBadge } from '../components/species/ConservationBadge';
import { useCollectionStore } from '../store/useCollectionStore';

interface Props {
  slug: string;
  onBack: () => void;
  onSelectSpecies: (slug: string) => void;
  backLabel?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  wild_species: 'WILD SPECIES',
  domestic_species: 'DOMESTIC SPECIES',
  domestic_breed: 'DOMESTIC BREED',
  hybrid: 'HYBRID — NOT A TAXON',
};

const SpeciesView: React.FC<{
  species: SpeciesDetail;
  backLabel: string;
  onBack: () => void;
  onSelectSpecies: (slug: string) => void;
}> = ({ species, backLabel, onBack, onSelectSpecies }) => {
  const { isDiscovered } = useCollectionStore();
  const discovered = isDiscovered(species.id);

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-8 animate-fadeIn">
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-felid-muted hover:text-felid-accent transition-colors py-1.5 uppercase brutal-press"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
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

          <div className="absolute top-2 left-2 text-felid-accent font-mono text-[10px] pointer-events-none">+ [OPTICAL_DOSSIER]</div>
          <div className="absolute top-2 right-2 text-felid-accent font-mono text-[10px] pointer-events-none">ONLINE +</div>

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

          <div className="absolute bottom-6 left-6 right-6 space-y-2 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <ConservationBadge status={species.conservation_status} showTitle />
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-felid-accent text-black border-2 border-black shadow-brutal-sm uppercase">
                {CATEGORY_LABELS[species.category]}
              </span>
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
              Catalogue Category
            </span>
            <span className="font-bold text-felid-ivory block uppercase">
              {CATEGORY_LABELS[species.category]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase flex items-center gap-2">
              <Cat className="w-5 h-5 text-felid-accent" />
              PHYSICAL CHARACTERISTICS & DESCRIPTION
            </h2>
            <p className="text-sm text-felid-ivory-dim leading-relaxed font-sans">
              {species.description}
            </p>
          </section>

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

        <div className="space-y-6">
          <div className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
            <h3 className="font-display font-black text-base text-felid-ivory uppercase flex items-center gap-2">
              <MapPin className="w-4 h-4 text-felid-accent" />
              GEOGRAPHIC RANGE
            </h3>
            <p className="text-xs text-felid-ivory-dim leading-relaxed font-mono">
              {species.geographic_range || 'Global or undocumented.'}
            </p>
          </div>

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

          <div className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
            <h3 className="font-display font-black text-base text-felid-ivory uppercase flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-felid-accent" />
              TAXONOMIC VERIFICATION
            </h3>
            <p className="text-[11px] text-felid-muted font-mono leading-relaxed">
              {species.taxonomy_source || 'IUCN/SSC Cat Specialist Group (Kitchener et al. 2017)'}
            </p>
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
            {species.provenance && Object.keys(species.provenance).length > 0 && (
              <p className="text-[10px] text-felid-muted font-mono leading-relaxed border-t border-[#332c3a] pt-2">
                Data provenance: {Object.values(species.provenance).filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BreedView: React.FC<{
  breed: BreedDetail;
  backLabel: string;
  onBack: () => void;
  onSelectSpecies: (slug: string) => void;
}> = ({ breed, backLabel, onBack, onSelectSpecies }) => (
  <div className="max-w-4xl mx-auto py-4 space-y-8 animate-fadeIn">
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-mono font-bold text-felid-muted hover:text-felid-accent transition-colors py-1.5 uppercase brutal-press"
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>
    </div>

    <div className="border-2 border-black bg-[#141218] shadow-brutal-lg overflow-hidden">
      <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-black border-b-2 border-black">
        {breed.image_url ? (
          <img src={breed.image_url} alt={breed.common_name} className="w-full h-full object-cover object-center" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-felid-muted">
            <Cat className="w-16 h-16" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <span className="absolute top-4 left-4 px-2.5 py-1 bg-black text-[10px] font-mono text-felid-muted border border-black">
          {breed.image_attribution || 'No image attribution recorded'}
        </span>
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-mono font-black bg-felid-accent text-black border-2 border-black uppercase">
              DOMESTIC BREED
            </span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-black border-2 border-black text-felid-muted uppercase">
              {breed.registry}
            </span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-felid-ivory uppercase tracking-tight">
            {breed.common_name}
          </h1>
          <p className="text-base sm:text-lg italic text-felid-ivory-dim font-serif">
            {breed.scientific_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x-2 divide-black bg-[#0c0a0e]">
        {[
          { label: 'Origin', value: breed.origin || 'Not documented' },
          { label: 'Body Type', value: breed.body_type || 'Not documented' },
          { label: 'Coat Length', value: breed.coat_length || 'Not documented' },
          { label: 'Coat Pattern', value: breed.coat_pattern || 'Not documented' },
        ].map((fact) => (
          <div key={fact.label} className="p-3 text-center">
            <span className="text-felid-muted block uppercase text-[9px] font-mono font-bold mb-0.5">{fact.label}</span>
            <span className="font-bold text-felid-ivory text-[11px] font-mono leading-tight block">{fact.value}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <section className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
          <h2 className="font-display font-black text-lg text-felid-ivory uppercase flex items-center gap-2">
            <Cat className="w-5 h-5 text-felid-accent" /> BREED OVERVIEW
          </h2>
          <p className="text-sm text-felid-ivory-dim leading-relaxed">{breed.description}</p>
        </section>

        <section className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
          <h2 className="font-display font-black text-lg text-felid-ivory uppercase flex items-center gap-2">
            <Dna className="w-5 h-5 text-felid-accent" /> ORIGIN & DEVELOPMENT
          </h2>
          <p className="text-sm text-felid-ivory-dim leading-relaxed font-mono">
            {breed.development || 'Development history not documented in the selected registry summary.'}
          </p>
        </section>

        <section className="border-2 border-black bg-[#0c0a0e] p-5 shadow-brutal-sm flex items-start gap-3">
          <Info className="w-4 h-4 text-felid-accent shrink-0 mt-0.5" />
          <p className="text-xs text-felid-muted leading-relaxed font-mono">
            {breed.common_name} is a breed of the domestic cat (<em>Felis catus</em>), not a separate species.
            Breed assignments are human-defined and do not change the species count.
          </p>
        </section>
      </div>

      <div className="space-y-6">
        <div className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
          <h3 className="font-display font-black text-base text-felid-ivory uppercase flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-felid-accent" /> REGISTRY VERIFICATION
          </h3>
          <a
            href={breed.registry_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 bg-[#0c0a0e] hover:bg-[#1d1922] text-felid-ivory transition-colors border-2 border-black shadow-brutal-sm text-xs font-mono"
          >
            <span>{breed.registry}</span>
            <ExternalLink className="w-3.5 h-3.5 text-felid-accent" />
          </a>
          <p className="text-[10px] text-felid-muted font-mono">
            Verified {breed.registry_verified || 'during curation'}.
          </p>
          {breed.provenance?.descriptive_source && (
            <a
              href={breed.provenance.descriptive_source}
              target="_blank"
              rel="noreferrer"
              className="block text-[10px] text-felid-muted hover:text-felid-accent font-mono underline"
            >
              Descriptive source record
            </a>
          )}
        </div>

        <div className="border-2 border-black bg-[#141218] p-6 space-y-3 shadow-brutal">
          <h3 className="font-display font-black text-base text-felid-ivory uppercase">Parent Species</h3>
          {breed.parent_id ? (
            <button
              onClick={() => onSelectSpecies(breed.parent_id as string)}
              className="w-full text-left p-2.5 bg-[#0c0a0e] hover:bg-[#1d1922] text-felid-ivory border-2 border-black shadow-brutal-sm text-xs font-mono brutal-press"
            >
              Domestic Cat (<em>Felis catus</em>)
            </button>
          ) : (
            <p className="text-xs text-felid-muted font-mono">Not recorded.</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const HybridView: React.FC<{
  hybrid: HybridDetail;
  backLabel: string;
  onBack: () => void;
  onSelectSpecies: (slug: string) => void;
}> = ({ hybrid, backLabel, onBack, onSelectSpecies }) => (
  <div className="max-w-3xl mx-auto py-4 space-y-8 animate-fadeIn">
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-mono font-bold text-felid-muted hover:text-felid-accent transition-colors py-1.5 uppercase brutal-press"
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>
    </div>

    <div className="border-2 border-black bg-[#141218] shadow-brutal-lg overflow-hidden">
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black border-b-2 border-black">
        {hybrid.image_url ? (
          <img src={hybrid.image_url} alt={hybrid.common_name} className="w-full h-full object-cover object-center" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-felid-muted">
            <Dna className="w-12 h-12" />
            <span className="text-[10px] font-mono uppercase">No species-account image available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <span className="px-2.5 py-0.5 text-xs font-mono font-black bg-[#fb7185] text-black border-2 border-black uppercase">
            HYBRID — NOT A SPECIES OR BREED
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-felid-ivory uppercase tracking-tight">
            {hybrid.common_name}
          </h1>
          <p className="text-sm italic text-felid-ivory-dim font-serif">{hybrid.scientific_name}</p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-sm text-felid-ivory-dim leading-relaxed">{hybrid.description}</p>
        <p className="text-xs text-felid-muted leading-relaxed font-mono border-2 border-black bg-[#0c0a0e] p-3">
          {hybrid.note}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {hybrid.parents.map((parent, index) => (
            <button
              key={parent}
              onClick={() => onSelectSpecies(parent)}
              className="text-left p-3 bg-[#0c0a0e] hover:bg-[#1d1922] border-2 border-black shadow-brutal-sm text-xs font-mono brutal-press"
            >
              <span className="text-[9px] text-felid-muted uppercase block">Parent {index + 1}</span>
              <span className="text-felid-ivory font-bold">{hybrid.parent_names[index] || parent}</span>
            </button>
          ))}
        </div>
        {hybrid.provenance?.source && (
          <a
            href={hybrid.provenance.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] font-mono text-felid-muted hover:text-felid-accent underline"
          >
            Source record <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  </div>
);

export const SpeciesDetailPage: React.FC<Props> = ({ slug, onBack, onSelectSpecies, backLabel = 'Back to Catalog' }) => {
  const [taxon, setTaxon] = useState<TaxonDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await api.getTaxonDetail(slug);
        setTaxon(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load taxon details.');
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

  if (errorMsg || !taxon) {
    return (
      <div className="py-20 text-center space-y-4 font-mono">
        <p className="text-pink-400 text-sm uppercase">{errorMsg || 'Taxon not found.'}</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-felid-accent text-black text-xs font-mono font-black border-2 border-black shadow-brutal-sm brutal-press inline-flex items-center gap-2 uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </button>
      </div>
    );
  }

  if (taxon.category === 'domestic_breed') {
    return <BreedView breed={taxon} backLabel={backLabel} onBack={onBack} onSelectSpecies={onSelectSpecies} />;
  }

  if (taxon.category === 'hybrid') {
    return <HybridView hybrid={taxon} backLabel={backLabel} onBack={onBack} onSelectSpecies={onSelectSpecies} />;
  }

  return <SpeciesView species={taxon} backLabel={backLabel} onBack={onBack} onSelectSpecies={onSelectSpecies} />;
};
