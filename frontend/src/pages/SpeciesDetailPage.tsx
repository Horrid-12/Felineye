import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Utensils,
  Layers,
  ExternalLink,
  PawPrint,
  Cat,
  Dna,
  Info,
  Scale,
} from 'lucide-react';
import { BreedDetail, HybridDetail, SpeciesDetail, TaxonDetail } from '../types';
import { api } from '../services/api';
import { ConservationBadge } from '../components/species/ConservationBadge';
import { useCollectionStore } from '../store/useCollectionStore';
import { AlertBanner, LoadingState } from '../components/ui/JournalPrimitives';
import { SpecimenCorners } from '../components/ui/JournalOrnament';

interface Props {
  slug: string;
  onBack: () => void;
  onSelectSpecies: (slug: string) => void;
  backLabel?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  wild_species: 'Wild Species',
  domestic_species: 'Domestic Species',
  domestic_breed: 'Domestic Breed',
  hybrid: 'Hybrid — Not a Taxon',
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
    <div className="py-1 space-y-5 animate-fadeIn">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-felid-muted-ink hover:text-felid-cobalt-ink transition-colors py-1 uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </button>
      </div>

      {/* Hero Specimen Plate */}
      <div className="journal-plate overflow-hidden">
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-felid-elevated border-b border-felid-border">
          <img
            src={species.image_url}
            alt={species.common_name}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-felid-photo-scrim via-felid-photo-scrim/35 to-transparent" />
          <SpecimenCorners colorClass="border-felid-photo-ink/40" />

          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-10">
            <span className="px-2.5 py-1 bg-felid-photo-scrim/80 text-[10px] font-mono text-felid-photo-ink/90 border border-felid-photo-ink/20 rounded-sm backdrop-blur-[2px]">
              {species.image_attribution}
            </span>

            {discovered ? (
              <span className="px-3 py-1 text-xs font-mono font-medium uppercase tracking-wider bg-felid-highlight text-felid-on-highlight border border-felid-highlight rounded-sm shadow-sm inline-flex items-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5" /> Logged in Journal
              </span>
            ) : (
              <span className="px-3 py-1 text-xs bg-felid-surface/95 text-felid-cobalt-ink border border-felid-border-strong rounded-sm shadow-sm font-mono font-medium">
                +{species.xp_reward} Discovery XP
              </span>
            )}
          </div>

          <div className="absolute bottom-6 left-6 right-6 space-y-2.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <ConservationBadge status={species.conservation_status} showTitle />
              <span
                className={`px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-sm uppercase ${
                  species.category === 'domestic_species'
                    ? 'bg-felid-pomegranate text-felid-on-pomegranate'
                    : 'bg-felid-cobalt text-felid-on-cobalt'
                }`}
              >
                {CATEGORY_LABELS[species.category]}
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono bg-felid-photo-scrim/80 border border-felid-photo-ink/20 text-felid-photo-ink rounded-sm">
                {species.subfamily} · <em>{species.genus}</em>
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono bg-felid-photo-scrim/80 border border-felid-photo-ink/20 text-felid-photo-ink/85 rounded-sm">
                Lineage: {species.lineage}
              </span>
            </div>

            <h1 className="font-display font-semibold text-2xl sm:text-3xl text-felid-photo-ink tracking-tight">
              {species.common_name}
            </h1>
            <p className="text-sm sm:text-base italic text-felid-photo-ink/85 font-serif">
              {species.scientific_name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-felid-border bg-felid-elevated/55 text-xs font-mono">
          <div className="p-4 text-center sm:text-left">
            <span className="text-felid-muted-ink block uppercase text-[10px] tracking-wider mb-1">
              Rarity Tier
            </span>
            <span className="font-medium text-felid-highlight-ink text-sm uppercase">
              {species.discovery_rarity}
            </span>
          </div>
          <div className="p-4 text-center sm:text-left">
            <span className="text-felid-muted-ink block uppercase text-[10px] tracking-wider mb-1">
              Body Mass &amp; Length
            </span>
            <span className="font-medium text-felid-ink leading-snug block">
              {species.size_and_weight || 'Not documented'}
            </span>
          </div>
          <div className="p-4 text-center sm:text-left">
            <span className="text-felid-muted-ink block uppercase text-[10px] tracking-wider mb-1">
              Catalogue Category
            </span>
            <span className="font-medium text-felid-ink block uppercase">
              {CATEGORY_LABELS[species.category]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <section className="journal-plate p-5 space-y-2.5">
            <h2 className="font-display font-semibold text-lg text-felid-ink flex items-center gap-2">
              <Cat className="w-4 h-4 text-felid-cobalt-ink" />
              <span>Physical Characteristics &amp; Description</span>
            </h2>
            <p className="text-xs sm:text-sm text-felid-ink/90 leading-relaxed font-sans">
              {species.description}
            </p>
          </section>

          <section className="journal-plate p-5 space-y-3">
            <h2 className="font-display font-semibold text-lg text-felid-ink flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-felid-cobalt-ink" />
              <span>Diagnostic Visual Identifiers</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {species.distinguishing_characteristics.map((trait, idx) => (
                <div
                  key={idx}
                  className="journal-inset p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-felid-ink/90"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-felid-cobalt shrink-0 mt-2" />
                  <span className="leading-relaxed font-sans">{trait}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="journal-plate p-6 space-y-4">
            <h2 className="font-display font-semibold text-xl text-felid-ink flex items-center gap-2">
              <Utensils className="w-5 h-5 text-felid-pomegranate-ink" />
              <span>Dietary Ecology &amp; Hunting Behavior</span>
            </h2>
            <div className="space-y-4 text-sm text-felid-ink/90 leading-relaxed font-sans">
              <div>
                <strong className="text-felid-muted-ink font-mono uppercase text-[11px] tracking-wider block mb-1">
                  Dietary Base
                </strong>
                <p>{species.diet}</p>
              </div>
              <div>
                <strong className="text-felid-muted-ink font-mono uppercase text-[11px] tracking-wider block mb-1">
                  Behavior &amp; Social Structure
                </strong>
                <p>{species.behavior}</p>
              </div>
            </div>
          </section>

          {species.similar_species.length > 0 && (
            <section className="journal-plate p-6 space-y-4">
              <h2 className="font-display font-semibold text-xl text-felid-ink flex items-center gap-2">
                <Scale className="w-5 h-5 text-felid-pomegranate-ink" />
                <span>Sister Taxa &amp; Lookalike Cats</span>
              </h2>
              <div className="space-y-3">
                {species.similar_species.map((sim, i) => (
                  <div
                    key={i}
                    className="journal-inset p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h4 className="font-display font-semibold text-base text-felid-ink">
                        {sim.common_name}
                      </h4>
                      <p className="text-xs sm:text-sm text-felid-muted-ink leading-relaxed font-sans">
                        <strong className="text-felid-cobalt-ink font-mono text-[11px] uppercase mr-1">
                          Distinction:
                        </strong>
                        {sim.differentiator}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectSpecies(sim.slug)}
                      className="btn-primary py-2 px-3.5 text-xs shrink-0"
                    >
                      Compare Profile
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="journal-plate p-5 space-y-2.5">
            <h3 className="font-display font-semibold text-base text-felid-ink flex items-center gap-2">
              <MapPin className="w-4 h-4 text-felid-cobalt-ink" />
              <span>Geographic Range</span>
            </h3>
            <p className="text-xs sm:text-sm text-felid-muted-ink leading-relaxed font-sans">
              {species.geographic_range || 'Global or undocumented.'}
            </p>
          </div>

          <div className="journal-plate p-5 space-y-3">
            <h3 className="font-display font-semibold text-base text-felid-ink flex items-center gap-2">
              <Layers className="w-4 h-4 text-felid-cobalt-ink" />
              <span>Natural Habitats &amp; Biomes</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {species.habitats.map((h, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-mono bg-felid-elevated/80 border border-felid-border rounded-sm text-felid-ink"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="journal-plate p-5 space-y-3">
            <h3 className="font-display font-semibold text-base text-felid-ink flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-felid-pomegranate-ink" />
              <span>Taxonomic Verification</span>
            </h3>
            <p className="text-xs text-felid-muted-ink font-sans leading-relaxed">
              {species.taxonomy_source || 'IUCN/SSC Cat Specialist Group (Kitchener et al. 2017)'}
            </p>
            <ul className="space-y-2 text-xs font-mono">
              {species.inaturalist_taxon_id && (
                <li>
                  <a
                    href={`https://www.inaturalist.org/taxa/${species.inaturalist_taxon_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 bg-felid-elevated/60 hover:bg-felid-hover text-felid-ink transition-colors border border-felid-border rounded-sm"
                  >
                    <span>iNaturalist Taxon #{species.inaturalist_taxon_id}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-felid-cobalt-ink" />
                  </a>
                </li>
              )}
              {species.gbif_taxon_key && (
                <li>
                  <a
                    href={`https://www.gbif.org/species/${species.gbif_taxon_key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 bg-felid-elevated/60 hover:bg-felid-hover text-felid-ink transition-colors border border-felid-border rounded-sm"
                  >
                    <span>GBIF Key #{species.gbif_taxon_key}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-felid-cobalt-ink" />
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`https://www.iucnredlist.org/search?query=${encodeURIComponent(species.scientific_name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 bg-felid-elevated/60 hover:bg-felid-hover text-felid-ink transition-colors border border-felid-border rounded-sm"
                >
                  <span>IUCN Red List Assessment</span>
                  <ExternalLink className="w-3.5 h-3.5 text-felid-cobalt-ink" />
                </a>
              </li>
            </ul>
            {species.provenance && Object.keys(species.provenance).length > 0 && (
              <p className="text-[11px] text-felid-muted-ink font-mono leading-relaxed border-t border-felid-border pt-2.5">
                Data provenance: {Object.values(species.provenance).filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </aside>
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
  <div className="py-1 space-y-5 animate-fadeIn">
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-mono font-medium text-felid-muted-ink hover:text-felid-cobalt-ink transition-colors py-1 uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>
    </div>

    <div className="journal-plate overflow-hidden">
      <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-felid-elevated border-b border-felid-border">
        {breed.image_url ? (
          <img
            src={breed.image_url}
            alt={breed.common_name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-felid-muted-ink">
            <Cat className="w-16 h-16" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-felid-photo-scrim via-felid-photo-scrim/30 to-transparent" />
        <span className="absolute top-4 left-4 px-2.5 py-1 bg-felid-photo-scrim/80 text-[10px] font-mono text-felid-photo-ink/90 border border-felid-photo-ink/20 rounded-sm">
          {breed.image_attribution || 'No image attribution recorded'}
        </span>
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-medium bg-felid-highlight text-felid-on-highlight rounded-sm uppercase">
              Domestic Breed
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-mono bg-felid-photo-scrim/80 border border-felid-photo-ink/20 text-felid-photo-ink/90 rounded-sm">
              {breed.registry}
            </span>
          </div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl text-felid-photo-ink tracking-tight">
            {breed.common_name}
          </h1>
          <p className="text-sm sm:text-base italic text-felid-photo-ink/85 font-serif">
            {breed.scientific_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-felid-border bg-felid-border gap-px">
        {[
          { label: 'Origin', value: breed.origin || 'Not documented' },
          { label: 'Body Type', value: breed.body_type || 'Not documented' },
          { label: 'Coat Length', value: breed.coat_length || 'Not documented' },
          { label: 'Coat Pattern', value: breed.coat_pattern || 'Not documented' },
        ].map((fact) => (
          <div key={fact.label} className="p-3.5 text-center bg-felid-elevated">
            <span className="text-felid-muted-ink block uppercase text-[10px] font-mono mb-0.5">
              {fact.label}
            </span>
            <span className="font-medium text-felid-ink text-xs font-mono leading-tight block">
              {fact.value}
            </span>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section className="journal-plate p-6 space-y-3">
          <h2 className="font-display font-semibold text-xl text-felid-ink flex items-center gap-2">
            <Cat className="w-5 h-5 text-felid-cobalt-ink" />
            <span>Breed Overview</span>
          </h2>
          <p className="text-sm sm:text-base text-felid-ink/90 leading-relaxed font-sans">
            {breed.description}
          </p>
        </section>

        <section className="journal-plate p-6 space-y-3">
          <h2 className="font-display font-semibold text-xl text-felid-ink flex items-center gap-2">
            <Dna className="w-5 h-5 text-felid-pomegranate-ink" />
            <span>Origin &amp; Development</span>
          </h2>
          <p className="text-sm text-felid-ink/90 leading-relaxed font-sans">
            {breed.development || 'Development history not documented in the selected registry summary.'}
          </p>
        </section>

        <AlertBanner tone="info">
          <span className="inline-flex items-start gap-2">
            <span>
              {breed.common_name} is a breed of the domestic cat (<em>Felis catus</em>), not a separate species.
              Breed assignments are human-defined and do not change the species count.
            </span>
          </span>
        </AlertBanner>
      </div>

      <aside className="space-y-6">
        <div className="journal-plate p-5 space-y-3">
          <h3 className="font-display font-semibold text-base text-felid-ink flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-felid-cobalt-ink" />
            <span>Registry Verification</span>
          </h3>
          <a
            href={breed.registry_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 bg-felid-elevated/60 hover:bg-felid-hover text-felid-ink transition-colors border border-felid-border rounded-sm text-xs font-mono"
          >
            <span>{breed.registry}</span>
            <ExternalLink className="w-3.5 h-3.5 text-felid-cobalt-ink" />
          </a>
          <p className="text-[11px] text-felid-muted-ink font-mono">
            Verified {breed.registry_verified || 'during curation'}.
          </p>
          {breed.provenance?.descriptive_source && (
            <a
              href={breed.provenance.descriptive_source}
              target="_blank"
              rel="noreferrer"
              className="block text-[11px] text-felid-cobalt-ink hover:underline font-mono"
            >
              Descriptive source record
            </a>
          )}
        </div>

        <div className="journal-plate p-5 space-y-3">
          <h3 className="font-display font-semibold text-base text-felid-ink flex items-center gap-2">
            <Info className="w-4 h-4 text-felid-pomegranate-ink" />
            <span>Parent Species</span>
          </h3>
          {breed.parent_id ? (
            <button
              type="button"
              onClick={() => onSelectSpecies(breed.parent_id as string)}
              className="w-full text-left p-2.5 bg-felid-elevated/60 hover:bg-felid-hover text-felid-ink border border-felid-border rounded-sm text-xs font-mono transition-colors"
            >
              Domestic Cat (<em>Felis catus</em>)
            </button>
          ) : (
            <p className="text-xs text-felid-muted-ink font-mono">Not recorded.</p>
          )}
        </div>
      </aside>
    </div>
  </div>
);

const HybridView: React.FC<{
  hybrid: HybridDetail;
  backLabel: string;
  onBack: () => void;
  onSelectSpecies: (slug: string) => void;
}> = ({ hybrid, backLabel, onBack, onSelectSpecies }) => (
  <div className="max-w-5xl mx-auto py-1 space-y-5 animate-fadeIn">
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-mono font-medium text-felid-muted-ink hover:text-felid-cobalt-ink transition-colors py-1 uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>
    </div>

    <div className="journal-plate overflow-hidden">
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-felid-elevated border-b border-felid-border">
        {hybrid.image_url ? (
          <img
            src={hybrid.image_url}
            alt={hybrid.common_name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-felid-muted-ink">
            <Dna className="w-12 h-12" />
            <span className="text-[11px] font-mono uppercase">No species-account image available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-felid-photo-scrim via-felid-photo-scrim/35 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <span className="px-2.5 py-0.5 text-[11px] font-mono font-medium bg-felid-pomegranate text-felid-on-pomegranate rounded-sm uppercase inline-block">
            Hybrid — Not a Species or Breed
          </span>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl text-felid-photo-ink tracking-tight">
            {hybrid.common_name}
          </h1>
          <p className="text-sm italic text-felid-photo-ink/85 font-serif">
            {hybrid.scientific_name}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm sm:text-base text-felid-ink/90 leading-relaxed font-sans">
          {hybrid.description}
        </p>
        <p className="text-xs sm:text-sm text-felid-muted-ink leading-relaxed font-sans journal-inset p-3.5">
          {hybrid.note}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {hybrid.parents.map((parent, index) => (
            <button
              key={parent}
              type="button"
              onClick={() => onSelectSpecies(parent)}
              className="text-left p-3 bg-felid-elevated/60 hover:bg-felid-hover border border-felid-border hover:border-felid-cobalt/60 rounded-sm text-xs font-mono transition-colors"
            >
              <span className="text-[10px] text-felid-muted-ink uppercase block">
                Parent {index + 1}
              </span>
              <span className="text-felid-ink font-medium">
                {hybrid.parent_names[index] || parent}
              </span>
            </button>
          ))}
        </div>
        {hybrid.provenance?.source && (
          <a
            href={hybrid.provenance.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-felid-cobalt-ink hover:underline"
          >
            <span>Source record</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  </div>
);

export const SpeciesDetailPage: React.FC<Props> = ({
  slug,
  onBack,
  onSelectSpecies,
  backLabel = 'Back to Catalog',
}) => {
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
    window.scrollTo?.({ top: 0, behavior: 'auto' });
  }, [slug]);

  if (loading) {
    return <LoadingState label="Loading curated taxonomic dossier..." className="py-24" />;
  }

  if (errorMsg || !taxon) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-felid-pomegranate-ink text-sm font-mono uppercase">
          {errorMsg || 'Taxon not found.'}
        </p>
        <button type="button" onClick={onBack} className="btn-primary text-xs">
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </button>
      </div>
    );
  }

  if (taxon.category === 'domestic_breed') {
    return (
      <BreedView
        breed={taxon}
        backLabel={backLabel}
        onBack={onBack}
        onSelectSpecies={onSelectSpecies}
      />
    );
  }

  if (taxon.category === 'hybrid') {
    return (
      <HybridView
        hybrid={taxon}
        backLabel={backLabel}
        onBack={onBack}
        onSelectSpecies={onSelectSpecies}
      />
    );
  }

  return (
    <SpeciesView
      species={taxon}
      backLabel={backLabel}
      onBack={onBack}
      onSelectSpecies={onSelectSpecies}
    />
  );
};
