import React from 'react';
import { Shield, Brain, Cpu, Database, PawPrint } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
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

      {/* Section 3: Responsible Wildlife Data Protocol */}
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

      {/* Section 4: Data Provenance & Citations */}
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
            <strong className="text-felid-ivory uppercase">Taxonomic Classification:</strong> Based on the revised taxonomy of the Felidae established by Kitchener, A. C. et al. (2017), Cat News Special Issue 11, IUCN SSC Cat Specialist Group.
          </p>
          <p>
            <strong className="text-felid-ivory uppercase">Field Observations:</strong> Sourced via the iNaturalist Network API under Creative Commons open-access scientific licenses (CC BY-NC 4.0).
          </p>
          <p>
            <strong className="text-felid-ivory uppercase">Taxonomic Backbone:</strong> Synchronized with the Global Biodiversity Information Facility (GBIF) Backbone Taxonomy.
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
