import React, { useEffect, useState } from 'react';
import { Shield, Brain, Cpu, Database, PawPrint, Cat, Dna, Microscope, AlertTriangle } from 'lucide-react';
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
          How Felineye runs a local vision model, applies abstention rules instead of guessing,
          safeguards cat populations, and curates global biodiversity records.
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
              LOCAL, REPLACEABLE INFERENCE PIPELINE
            </h2>
            <span className="text-xs text-felid-muted font-mono uppercase font-bold">
              Validate → Gate → Rank → Taxonomise → Abstain
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-sans">
          Presentation logic is decoupled from the neural provider through a small abstract
          classifier interface. The real pipeline runs these stages in order, and any stage can
          end the request with an explicit non-identification outcome:
        </p>

        <ol className="list-decimal list-inside space-y-2.5 text-xs sm:text-sm text-felid-ivory-dim leading-relaxed pl-1 font-mono">
          <li>
            <strong className="text-felid-ivory uppercase">Safe Image Ingestion & Sanitisation:</strong>{' '}
            Raw uploads are validated with Pillow for decodability, MIME compliance (JPEG, PNG,
            WebP, BMP), minimum resolution boundaries (48×48 px), and maximum file size (15 MB).
            EXIF orientation is applied and metadata is stripped. A valid file is a prerequisite,
            not evidence of a feline.
          </li>
          <li>
            <strong className="text-felid-ivory uppercase">Deterministic Quality Gate:</strong>{' '}
            Sharpness (Laplacian variance), brightness, and contrast are measured on a bounded
            grayscale copy. Severely blurred, dark, blown-out, or flat images are allowed to
            abstain; they are never used to invent a species.
          </li>
          <li>
            <strong className="text-felid-ivory uppercase">Independent Feline Relevance Gate:</strong>{' '}
            BioCLIP compares the image with explicit non-feline prompts, and a separate MobileNetV2
            ImageNet classifier independently checks the content. Both must agree that a feline is
            present. If they disagree, the result is withheld rather than forced.
          </li>
          <li>
            <strong className="text-felid-ivory uppercase">Zero-Shot Candidate Ranking:</strong>{' '}
            A BioCLIP ViT-B/16 vision encoder embeds the photo and compares it with pre-computed
            scientific-name prompts for the 41 catalog species. The output is a ranked{' '}
            <em>cosine similarity</em>, not a probability distribution.
          </li>
          <li>
            <strong className="text-felid-ivory uppercase">Taxonomy Handling:</strong>{' '}
            Every candidate carries an explicit category: wild species, domestic species, domestic
            breed, or hybrid. Hybrids are removed. A breed-level cue is downgraded to{' '}
            <em>Felis catus</em> at species level with an advisory, because a single photograph
            cannot establish breed ancestry with this model.
          </li>
          <li>
            <strong className="text-felid-ivory uppercase">Conservative Acceptance / Abstention:</strong>{' '}
            A species is reported only when the top score clears a similarity floor{' '}
            <em>and</em> separates from the runner-up by a margin. Close wild candidates, lynx
            genus ambiguities, domestic-vs-small-wildcat conflicts, and content-gate disagreements
            return <code>unable_to_identify</code> with the candidates listed for comparison.
          </li>
        </ol>
      </section>

      {/* Section 2: Scores vs probabilities */}
      <section className="border-2 border-black bg-[#141218] p-6 sm:p-8 space-y-4 shadow-brutal">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black">
          <div className="w-10 h-10 bg-felid-accent border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
            <Cpu className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase">
              SIMILARITY SCORES, NOT CALIBRATED PROBABILITIES
            </h2>
            <span className="text-xs text-felid-muted font-mono uppercase font-bold">
              No fabricated entropy, latency, or confidence metrics
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-sans">
          Natural wildlife photography involves motion blur, vegetation occlusion, unusual
          viewpoints, and genuine morphological convergence between sister taxa (for example{' '}
          <em>Panthera onca</em> and <em>Panthera pardus</em>). The model therefore cannot promise a
          calibrated probability from a single image.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          {[
            { label: 'Wild-species floor', value: '0.32 similarity' },
            { label: 'Wild-species margin', value: '0.030 over runner-up' },
            { label: 'Domestic-cat floor / margin', value: '0.30 / 0.015' },
          ].map((item) => (
            <div key={item.label} className="p-3 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm">
              <span className="block text-[10px] uppercase tracking-wider text-felid-muted font-bold">
                {item.label}
              </span>
              <span className="text-felid-accent font-black">{item.value}</span>
            </div>
          ))}
        </div>

        <p className="text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-sans">
          Those thresholds are conservative <em>abstention</em> settings chosen against the 41
          curated catalog reference images plus dog, crocodile, and object negatives. They are not a
          calibration benchmark and are not presented as such. The API reports{' '}
          <code>is_calibrated: false</code>, labels the score semantics explicitly, and returns{' '}
          <code>entropy: null</code> because the provider does not produce a categorical
          distribution.
        </p>

        <div className="p-4 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-felid-muted leading-relaxed font-mono">
            A ranked candidate is a visual-similarity estimate, not human verification. It must not
            be used as an authoritative scientific record, and no result is labelled{' '}
            <code>CONFIRMED</code>. Weak evidence produces multiple candidates or an abstention.
          </p>
        </div>
      </section>

      {/* Section 3: Model provenance */}
      <section className="border-2 border-black bg-[#141218] p-6 sm:p-8 space-y-4 shadow-brutal">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black">
          <div className="w-10 h-10 bg-felid-accent border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
            <Microscope className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-felid-ivory uppercase">
              MODEL PROVENANCE, LICENCES & LIMITATIONS
            </h2>
            <span className="text-xs text-felid-muted font-mono uppercase font-bold">
              BioCLIP ViT-B/16 + Independent ImageNet Gate
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-felid-ivory-dim leading-relaxed font-sans">
          <p>
            <strong className="text-felid-ivory uppercase font-mono">Primary ranker:</strong>{' '}
            <a
              className="text-felid-accent underline"
              href="https://huggingface.co/imageomics/bioclip"
              target="_blank"
              rel="noreferrer"
            >
              BioCLIP
            </a>{' '}
            ViT-B/16, trained by the Imageomics Institute on TreeOfLife-10M, MIT licensed. The
            vision encoder is exported to ONNX and the species text embeddings are pre-computed, so
            inference needs only ONNX Runtime, NumPy, and Pillow at runtime.
          </p>
          <p>
            <strong className="text-felid-ivory uppercase font-mono">Independent content gate:</strong>{' '}
            MobileNetV2-12 from the ONNX Model Zoo, Apache-2.0. It is used only to check whether the
            image contains a feline; it is not treated as a species cross-check. The two models are
            trained differently, so their disagreement is meaningful evidence of uncertainty.
          </p>
          <p>
            <strong className="text-felid-ivory uppercase font-mono">No silent fallback:</strong>{' '}
            the default <code>auto</code> provider prefers BioCLIP with the gate, then the
            ImageNet-only fallback, and otherwise returns <code>model_unavailable</code>. It never
            switches to a development heuristic. The deterministic mock provider requires an
            explicit <code>CLASSIFIER_PROVIDER=dev_mock</code>, is labelled{' '}
            <code>development_simulation</code>, and cannot award XP.
          </p>
        </div>

        <div className="p-4 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm">
          <span className="text-felid-accent font-mono font-black text-[10px] uppercase tracking-wider block mb-2">
            Known limitations
          </span>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-felid-muted leading-relaxed font-mono">
            <li>
              Small wildcats (margay, ocelot, oncilla, Pallas&apos;s cat, jungle cat, black-footed
              cat) remain confusable with each other and with domestic cats.
            </li>
            <li>
              Snow leopard and clouded leopard can be confused with other rosetted cats; lynx
              species cannot be separated reliably.
            </li>
            <li>
              Breed identity is not produced. A breed cue is reported as the domestic cat at species
              level with an advisory, never as a breed.
            </li>
            <li>
              Hybrids are excluded from the model vocabulary and can never be returned.
            </li>
            <li>
              The current thresholds were tuned on a small curated reference set, not a large
              independent validation benchmark. Coverage of all 40 wild species is not guaranteed.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 4: Taxonomy Categories & Registry */}
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
          Felineye follows the IUCN/SSC Cat Specialist Group revision of Felidae (Kitchener et al. 2017).
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
            such as TICA and FIFe recognise partly different lists and are not claimed here. Breeds are never
            discoverable and never award XP.
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

      {/* Section 5: Responsible Wildlife Data Protocol */}
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

      {/* Section 6: Data Provenance & Citations */}
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
            <strong className="text-felid-ivory uppercase">Identification Models:</strong> BioCLIP
            (Imageomics Institute, Stevens et al.) under the MIT licence, and MobileNetV2-12 from the
            ONNX Model Zoo under Apache-2.0. Inference runs through ONNX Runtime. Model weights are
            not committed to the repository; see the identification-model setup documentation.
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
            <strong className="text-felid-ivory uppercase">Original Attribution:</strong> Felineye is adapted from the open-source architecture of <strong className="text-felid-accent">BirdLens</strong> by sdprojects12.
          </p>
        </div>
      </section>
    </div>
  );
};
