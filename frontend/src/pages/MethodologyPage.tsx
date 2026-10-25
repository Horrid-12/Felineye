import React, { useEffect, useState } from 'react';
import { Shield, Brain, Cpu, Database, PawPrint, Cat, Dna } from 'lucide-react';
import { CatalogMeta } from '../types';
import { api } from '../services/api';

export const MethodologyPage: React.FC = () => {
  const [meta, setMeta] = useState<CatalogMeta | null>(null);

  useEffect(() => {
    api.getCatalogMeta().then(setMeta).catch(() => {
      // Static copy below remains accurate without the live counts.
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-10">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b-2 border-black">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono font-black text-felid-accent uppercase tracking-wider mb-1">
          <PawPrint className="w-3.5 h-3.5" />
          <span>SCIENTIFIC DOCUMENTATION & ARCHITECTURE</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-felid-ivory uppercase tracking-tight">
          METHODOLOGY & <span className="text-felid-accent underline decoration-4 underline-offset-4">ARCHITECTURE</span>
        </h1>
        <p className="text-xs sm:text-sm text-felid-muted leading-relaxed font-mono">
          How FelidLens classifies felids, calculates Shannon entropy uncertainty, safeguards cat populations, and curates global biodiversity records.
        </p>
      </div>

      {/* Section 1: Identification Architecture */}
      <section className="border-2 border-black bg-[#141218] p-6 sm:p-8 space-y-4 shadow-brutal">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black">
          <div className="w-10 h-10 bg-felid-accent border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
            <Brain className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase">
              PROVIDER-INDEPENDENT INFERENCE ARCHITECTURE
            </h2>
            <span className="text-xs text-felid-muted font-mono uppercase font-bold">
              Abstract Classifier Interface & Multi-Stage Feline Pipeline
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-sans">
          FelidLens implements a modular pipeline designed to decouple presentation logic from the underlying neural inference engine. The processing lifecycle consists of four distinct stages:
        </p>

        <ol className="list-decimal list-inside space-y-2.5 text-xs sm:text-sm text-felid-ivory-dim leading-relaxed pl-1 font-mono">
          <li>
            <strong className="text-felid-ivory uppercase">Safe Image Ingestion & Sanitization:</strong> Raw uploads are validated using Pillow for decodability, strict MIME compliance (JPEG, PNG, WebP), minimum resolution boundaries (48x48px), and maximum file size enforcement (15MB). Potentially hazardous EXIF tags and GPS embeds are safely stripped.
          </li>
          <li>
            <strong className="text-felid-ivory uppercase">Out-of-Domain Detection:</strong> The image feature vector is analyzed against non-feline baseline distributions. Images devoid of feline characteristics (e.g., automobiles, landscapes, canines) return an explicit <code>non_felid_detected</code> outcome rather than forcing a deceptive species prediction.
          </li>
          <li>
            <strong className="text-felid-ivory uppercase">Normalized Probability Ranking:</strong> Feline features are ranked against the 8 evolutionary lineages of Felidae, generating a ranked probability distribution across candidate taxa.
          </li>
          <li>
            <strong className="text-felid-ivory uppercase">Entropy-Based Uncertainty Evaluation:</strong> Shannon entropy is calculated across the candidate distribution to objectively measure ambiguity before assigning confidence tiers.
          </li>
          <li>
            <strong className="text-felid-ivory uppercase">Species First, Breeds Deferred:</strong> Candidate taxa carry an explicit category: wild species, domestic species, domestic breed, or hybrid. Hybrids are never classifiable. A breed-level cue is downgraded to the domestic cat (<em>Felis catus</em>) at species level with an <code>uncertain</code> result, because a single photograph cannot reliably establish breed ancestry.
          </li>
        </ol>
      </section>

      {/* Section 2: Mathematical Uncertainty Engine (Promptify Telemetry Inset Influence) */}
      <section className="border-2 border-black bg-[#141218] p-6 sm:p-8 space-y-4 shadow-brutal">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black">
          <div className="w-10 h-10 bg-felid-accent border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
            <Cpu className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase">
              TRANSPARENT UNCERTAINTY & SHANNON ENTROPY
            </h2>
            <span className="text-xs text-felid-muted font-mono uppercase font-bold">
              Calibrated Probabilities vs Similarity Heuristics
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-sans">
          In natural wildlife photography, illumination artifacts, vegetation occlusion, motion blur, and morphological convergence between sister taxa (such as <em>Panthera onca</em> and <em>Panthera pardus</em>) introduce epistemic uncertainty.
        </p>

        <div className="p-4 bg-[#0c0a0e] border-2 border-black font-mono text-sm text-felid-accent shadow-brutal-sm font-bold text-center">
          H(P) = - ∑ [ p(x) · ln( p(x) ) ]
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-sans">
          When the Shannon entropy H(P) exceeds our calibrated threshold (2.10) or the top candidate activation falls below the minimum confidence threshold, FelidLens flags the prediction as <code>uncertain</code>. We transparently report diagnostic reasoning to the user rather than masquerading uncertainty as fact.
        </p>
      </section>

      {/* Section 3: Taxonomy Categories & Registry */}
      <section className="border-2 border-black bg-[#141218] p-6 sm:p-8 space-y-4 shadow-brutal">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black">
          <div className="w-10 h-10 bg-felid-accent border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
            <Cat className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase">
              TAXONOMIC CATEGORIES & COUNT SEMANTICS
            </h2>
            <span className="text-xs text-felid-muted font-mono uppercase font-bold">
              Wild Species · Domestic Species · Breeds · Hybrids
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-sans">
          FelidLens follows the IUCN/SSC Cat Specialist Group revision of Felidae (Kitchener et al. 2017).
          That revision recognises 41 extant species, comprising 40 wild species plus the domestic cat
          (<em>Felis catus</em>). This is a documented taxonomic snapshot, not a permanent universal constant:
          authorities split and merge taxa over time, and the catalogue records its source so discrepancies can be audited.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 border-2 border-black bg-[#0c0a0e] divide-x-2 divide-black shadow-brutal-sm">
          {[
            { label: 'Wild Species', value: meta?.wild_species_count ?? '—' },
            { label: 'Domestic Species', value: meta?.domestic_species_count ?? '—' },
            { label: 'CFA Breeds', value: meta?.breed_count ?? '—' },
            { label: 'Hybrid Crosses', value: meta?.hybrid_count ?? '—' },
          ].map((stat) => (
            <div key={stat.label} className="p-3 text-center">
              <span className="block font-mono font-black text-xl text-felid-accent">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-wider text-felid-muted font-mono font-bold">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-sans">
          <p>
            <strong className="text-felid-ivory uppercase font-mono">Domestic breeds:</strong> Each breed profile is
            linked to the Cat Fanciers&apos; Association (CFA) registry and was fetched and title-checked during
            curation{meta ? ` (${meta.updated})` : ''}. Breed names are human-defined labels, not scientific taxa;
            every breed is assigned to <em>Felis catus</em> and excluded from all species counts. Other registries
            such as TICA and FIFe recognise partly different lists and are not claimed here.
          </p>
          <p>
            <strong className="text-felid-ivory uppercase font-mono">Hybrids:</strong> Crosses such as the liger,
            tigon, leopon, and pumapard are listed separately for completeness. They are not species and not breeds,
            are excluded from both counts, and are never returned as identification results.
          </p>
        </div>

        <div className="p-4 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm flex items-start gap-3">
          <Dna className="w-4 h-4 text-felid-accent shrink-0 mt-0.5" />
          <p className="text-xs text-felid-muted leading-relaxed font-mono">
            Counts are reported independently so that adding breeds can never inflate the wild Felidae total.
            The species atlas, collection roster, and home-page statistics all read these separate values.
          </p>
        </div>
      </section>

      {/* Section 4: Responsible Wildlife Data Protocol */}
      <section className="border-2 border-black bg-[#141218] p-6 sm:p-8 space-y-4 shadow-brutal">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black">
          <div className="w-10 h-10 bg-emerald-400 border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase">
              CONSERVATION SAFETY & COORDINATE OBSCURATION
            </h2>
            <span className="text-xs text-felid-muted font-mono uppercase font-bold">
              Zero Vulnerable Feline Coordinates Exposed
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-sans">
          Poaching, commercial trafficking, and irresponsible tourism present existential threats to apex predators and rare felids. In compliance with ethical biodiversity guidelines:
        </p>

        <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-felid-ivory-dim leading-relaxed pl-1 font-mono">
          <li>
            Exact GPS coordinates are never served through our API or displayed in the UI.
          </li>
          <li>
            Observations are generalized to broad administrative boundaries or national park reserves.
          </li>
          <li>
            Historical observations are explicitly noted as past records to prevent users from attempting to track or disturb living animals in sensitive denning or nesting sites.
          </li>
        </ul>
      </section>

      {/* Section 5: Data Provenance & Citations */}
      <section className="border-2 border-black bg-[#141218] p-6 sm:p-8 space-y-4 shadow-brutal">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black">
          <div className="w-10 h-10 bg-felid-accent border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
            <Database className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase">
              DATA PROVENANCE & ACKNOWLEDGEMENTS
            </h2>
            <span className="text-xs text-felid-muted font-mono uppercase font-bold">
              Scientific Authorities & Open Data Licences
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-mono">
          <p>
            <strong className="text-felid-ivory uppercase">Taxonomic Classification:</strong> Based on the revised taxonomy of the Felidae established by Kitchener, A. C. et al. (2017), Cat News Special Issue 11, IUCN SSC Cat Specialist Group. Forty wild species plus the domestic cat are catalogued; breeds and hybrids are tracked in separate collections.
          </p>
          <p>
            <strong className="text-felid-ivory uppercase">Domestic Breed Registry:</strong> Breed records follow the Cat Fanciers&apos; Association (CFA) breed profiles at cfa.org. Each registry URL was fetched and title-checked during curation; breed names are not treated as scientific taxa.
          </p>
          <p>
            <strong className="text-felid-ivory uppercase">Field Observations:</strong> Sourced via the iNaturalist Network API under Creative Commons open-access scientific licenses (CC BY-NC 4.0).
          </p>
          <p>
            <strong className="text-felid-ivory uppercase">Taxonomic Backbone:</strong> Cross-referenced with the Global Biodiversity Information Facility (GBIF) Backbone Taxonomy where its treatment agrees with the 2017 CatSG revision. Taxon identifiers are omitted where modern databases split or synonymise a CatSG species rather than asserting a false mapping.
          </p>
          <p>
            <strong className="text-felid-ivory uppercase">Conservation Statuses:</strong> Regularly aligned with the IUCN Red List of Threatened Species Version 2024-2.
          </p>
          <p>
            <strong className="text-felid-ivory uppercase">Original Attribution:</strong> FelidLens is adapted from the open-source architecture of <strong className="text-felid-accent">BirdLens</strong> by sdprojects12.
          </p>
        </div>
      </section>
    </div>
  );
};
