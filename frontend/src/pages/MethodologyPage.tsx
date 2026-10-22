import React from 'react';
import { Info, Shield, Brain, Cpu, Database } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-felid-accent uppercase tracking-wider mb-1">
          <Info className="w-3.5 h-3.5" />
          <span>Scientific Documentation</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-felid-ivory tracking-tight">
          Methodology & <span className="text-felid-accent">Architecture</span>
        </h1>
        <p className="text-sm text-felid-muted leading-relaxed">
          How FelidLens identifies felids, computes uncertainty, protects wildlife, and curates global biodiversity records.
        </p>
      </div>

      {/* Section 1: Identification Architecture */}
      <section className="rounded-2xl border border-felid-border bg-felid-surface/60 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-felid-pine border border-felid-border flex items-center justify-center text-felid-accent">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-felid-ivory">
              Provider-Independent Inference Architecture
            </h2>
            <span className="text-xs text-felid-muted font-mono">
              Abstract Classifier Interface & Multi-Stage Pipeline
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed">
          FelidLens implements a modular pipeline designed to decouple presentation logic from the underlying neural inference engine. The processing lifecycle consists of four distinct stages:
        </p>

        <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-felid-ivory-dim leading-relaxed pl-2">
          <li>
            <strong className="text-felid-ivory">Safe Image Ingestion & Sanitization:</strong> Raw uploads are validated using Pillow for decodability, strict MIME type compliance (JPEG, PNG, WebP), minimum resolution boundaries (48x48px), and maximum file size enforcement (15MB). Potentially hazardous EXIF tags and GPS embeds are safely stripped.
          </li>
          <li>
            <strong className="text-felid-ivory">Out-of-Domain Detection:</strong> The image feature vector is analyzed against non-feline baseline distributions. Images devoid of feline characteristics (e.g., automobiles, landscapes, canines) return an explicit <code>non_felid_detected</code> outcome rather than forcing a deceptive species prediction.
          </li>
          <li>
            <strong className="text-felid-ivory">Normalized Probability Ranking:</strong> Feline features are ranked against the 8 evolutionary lineages of Felidae, generating a ranked probability distribution across candidate taxa.
          </li>
          <li>
            <strong className="text-felid-ivory">Entropy-Based Uncertainty Evaluation:</strong> Shannon entropy is calculated across the candidate distribution to objectively measure ambiguity before assigning confidence tiers.
          </li>
        </ol>
      </section>

      {/* Section 2: Mathematical Uncertainty Engine */}
      <section className="rounded-2xl border border-felid-border bg-felid-surface/60 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-felid-pine border border-felid-border flex items-center justify-center text-felid-accent">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-felid-ivory">
              Transparent Uncertainty & Shannon Entropy
            </h2>
            <span className="text-xs text-felid-muted font-mono">
              Calibrated Probabilities vs Similarity Heuristics
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed">
          In natural wildlife photography, illumination artifacts, vegetation occlusion, motion blur, and morphological convergence between sister taxa (such as <em>Panthera onca</em> and <em>Panthera pardus</em>) introduce epistemic uncertainty.
        </p>

        <div className="p-4 rounded-xl bg-felid-pine border border-felid-border font-mono text-xs text-felid-accent/90">
          H(P) = - ∑ [ p(x) · ln( p(x) ) ]
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed">
          When the Shannon entropy H(P) exceeds our calibrated threshold (2.10) or the top candidate activation falls below the minimum confidence threshold, FelidLens flags the prediction as <code>uncertain</code>. We transparently report diagnostic reasoning to the user rather than masquerading uncertainty as fact.
        </p>
      </section>

      {/* Section 3: Responsible Wildlife Data Protocol */}
      <section className="rounded-2xl border border-felid-border bg-felid-surface/60 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-felid-pine border border-felid-border flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-felid-ivory">
              Conservation Safety & Coordinate Obscuration
            </h2>
            <span className="text-xs text-felid-muted font-mono">
              Zero Vulnerable Wildlife Coordinates Exposed
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed">
          Poaching, commercial trafficking, and irresponsible tourism present existential threats to apex predators and rare felids. In compliance with ethical biodiversity guidelines:
        </p>

        <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-felid-ivory-dim leading-relaxed pl-2">
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

      {/* Section 4: Data Provenance & Citations */}
      <section className="rounded-2xl border border-felid-border bg-felid-surface/60 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-felid-pine border border-felid-border flex items-center justify-center text-felid-accent">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-felid-ivory">
              Data Provenance & Acknowledgements
            </h2>
            <span className="text-xs text-felid-muted font-mono">
              Scientific Authorities & Open Data Licences
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-felid-ivory-dim leading-relaxed">
          <p>
            <strong>Taxonomic Classification:</strong> Based on the revised taxonomy of the Felidae established by Kitchener, A. C. et al. (2017), Cat News Special Issue 11, IUCN SSC Cat Specialist Group.
          </p>
          <p>
            <strong>Field Observations:</strong> Sourced via the iNaturalist Network API under Creative Commons open-access scientific licenses (CC BY-NC 4.0).
          </p>
          <p>
            <strong>Taxonomic Backbone:</strong> Synchronized with the Global Biodiversity Information Facility (GBIF) Backbone Taxonomy.
          </p>
          <p>
            <strong>Conservation Statuses:</strong> Regularly aligned with the IUCN Red List of Threatened Species Version 2024-2.
          </p>
        </div>
      </section>
    </div>
  );
};
