import React, { useEffect, useState } from 'react';
import {
  Shield,
  Brain,
  Cpu,
  Database,
  PawPrint,
  Cat,
  Dna,
  Microscope,
  BookMarked,
} from 'lucide-react';
import { CatalogMeta } from '../types';
import { api } from '../services/api';
import { AlertBanner, PageHeader } from '../components/ui/JournalPrimitives';
import { BotanicalRule } from '../components/ui/JournalOrnament';
import {
  BreedValidationChart,
  CatalogCompositionChart,
  PipelineFlowDiagram,
} from '../components/methodology/MethodologyCharts';

export const MethodologyPage: React.FC = () => {
  const [meta, setMeta] = useState<CatalogMeta | null>(null);

  useEffect(() => {
    api.getCatalogMeta().then(setMeta).catch(() => {
      // Static copy below remains accurate without the live counts.
    });
  }, []);

  const sections = [
    { id: 'sec-pipeline', label: '§ 1 Pipeline' },
    { id: 'sec-thresholds', label: '§ 2 Abstention & Scores' },
    { id: 'sec-provenance', label: '§ 3 Models & Validation' },
    { id: 'sec-taxonomy', label: '§ 4 Taxonomy Strata' },
    { id: 'sec-conservation', label: '§ 5 Conservation Safety' },
    { id: 'sec-references', label: '§ 6 References' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-10">
      <PageHeader
        kicker="Scientific Documentation & Architecture"
        kickerIcon={<PawPrint className="w-3.5 h-3.5" />}
        title={
          <>
            Methodology &amp; <span className="italic text-felid-cobalt-ink">Architecture</span>
          </>
        }
        subtitle="How Felineye runs local vision models, applies abstention rules instead of guessing, safeguards cat populations, and curates global biodiversity records."
      />

      {/* Publication Quick Contents Strip */}
      <nav
        aria-label="Methodology sections"
        className="journal-inset p-2.5 flex flex-wrap items-center gap-1.5"
      >
        <span className="text-[10px] font-mono uppercase tracking-wider text-felid-muted-ink px-2">
          Contents
        </span>
        {sections.map((sec) => (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            className="px-2.5 py-1 text-xs font-mono text-felid-muted-ink hover:text-felid-cobalt-ink hover:bg-felid-surface rounded-sm border border-transparent hover:border-felid-border transition-colors"
          >
            {sec.label}
          </a>
        ))}
      </nav>

      {/* Section 1: Identification Architecture */}
      <section id="sec-pipeline" className="journal-plate p-6 sm:p-8 space-y-5 scroll-mt-24">
        <div className="flex items-center gap-3 pb-4 border-b border-felid-border">
          <div className="w-10 h-10 bg-felid-cobalt/15 border border-felid-cobalt/40 rounded-sm flex items-center justify-center text-felid-cobalt-ink shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-felid-cobalt-ink block">
              Section 01 · Validate → Gate → Rank → Taxonomise → Abstain
            </span>
            <h2 className="font-display font-semibold text-xl sm:text-2xl text-felid-ink">
              Local, Replaceable Inference Pipeline
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-felid-ink/90 leading-relaxed font-sans">
          Presentation logic is decoupled from the neural provider through a small abstract
          classifier interface. The real pipeline runs these stages in order, and any stage can
          end the request with an explicit non-identification outcome:
        </p>

        <PipelineFlowDiagram />

        <ol className="list-decimal list-outside ml-5 space-y-3 text-sm text-felid-ink/90 leading-relaxed font-sans">
          <li>
            <strong className="text-felid-ink font-semibold">Safe Image Ingestion &amp; Sanitisation:</strong>{' '}
            Raw uploads are validated with Pillow for decodability, MIME compliance (JPEG, PNG,
            WebP, BMP), minimum resolution boundaries (48×48 px), and maximum file size (15 MB).
            EXIF orientation is applied and metadata is stripped. A valid file is a prerequisite,
            not evidence of a feline.
          </li>
          <li>
            <strong className="text-felid-ink font-semibold">Deterministic Quality Gate:</strong>{' '}
            Sharpness (Laplacian variance), brightness, and contrast are measured on a bounded
            grayscale copy. Severely blurred, dark, blown-out, or flat images are allowed to
            abstain; they are never used to invent a species.
          </li>
          <li>
            <strong className="text-felid-ink font-semibold">Independent Feline Relevance Gate:</strong>{' '}
            BioCLIP compares the image with explicit non-feline prompts, and a separate MobileNetV2
            ImageNet classifier independently checks the content. Both must agree that a feline is
            present. If they disagree, the result is withheld rather than forced.
          </li>
          <li>
            <strong className="text-felid-ink font-semibold">Zero-Shot Candidate Ranking:</strong>{' '}
            A BioCLIP ViT-B/16 vision encoder embeds the photo and compares it with pre-computed
            scientific-name prompts for the 41 catalog species. The output is a ranked{' '}
            <em>cosine similarity</em>, not a probability distribution.
          </li>
          <li>
            <strong className="text-felid-ink font-semibold">Taxonomy Handling:</strong>{' '}
            Every candidate carries an explicit category: wild species, domestic species, domestic
            breed, or hybrid. Hybrids are removed. A breed-labelled species candidate is downgraded
            to <em>Felis catus</em>; breed is never a species-level answer.
          </li>
          <li>
            <strong className="text-felid-ink font-semibold">Closest Breed Match:</strong>{' '}
            Only after a domestic cat is accepted at species level, a dedicated ViT breed classifier
            may add a closest visual breed match. It must clear a confidence floor and a margin over
            the next class; generic coat classes and non-catalogue breeds abstain. When it does not
            clear the floor, the top curated classes are still listed as closest matches rather than
            forcing a breed. The match never changes the species result or awards XP, and it is not
            pedigree verification.
          </li>
          <li>
            <strong className="text-felid-ink font-semibold">Conservative Acceptance &amp; Abstention:</strong>{' '}
            A species is reported only when the top score clears a similarity floor{' '}
            <em>and</em> separates from the runner-up by a margin. Close wild candidates, lynx
            genus ambiguities, domestic-vs-small-wildcat conflicts, and content-gate disagreements
            return{' '}
            <code className="px-1.5 py-0.5 bg-felid-elevated border border-felid-border rounded-sm text-xs font-mono text-felid-cobalt-ink">
              unable_to_identify
            </code>{' '}
            with the candidates listed for comparison.
          </li>
        </ol>
      </section>

      {/* Section 2: Scores vs probabilities */}
      <section id="sec-thresholds" className="journal-plate p-6 sm:p-8 space-y-5 scroll-mt-24">
        <div className="flex items-center gap-3 pb-4 border-b border-felid-border">
          <div className="w-10 h-10 bg-felid-pomegranate/15 border border-felid-pomegranate/40 rounded-sm flex items-center justify-center text-felid-pomegranate-ink shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-felid-pomegranate-ink block">
              Section 02 · No Fabricated Entropy or Confidence
            </span>
            <h2 className="font-display font-semibold text-xl sm:text-2xl text-felid-ink">
              Similarity Scores, Not Calibrated Probabilities
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-felid-ink/90 leading-relaxed font-sans">
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
            <div key={item.label} className="journal-inset p-3.5">
              <span className="block text-[10px] uppercase tracking-wider text-felid-muted-ink mb-1">
                {item.label}
              </span>
              <span className="text-felid-cobalt-ink font-medium text-sm">{item.value}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-felid-muted-ink leading-relaxed font-sans">
          Those thresholds are conservative <em>abstention</em> settings chosen against the 41
          curated catalog reference images plus dog, crocodile, and object negatives. They are not a
          calibration benchmark and are not presented as such. The API reports{' '}
          <code className="px-1.5 py-0.5 bg-felid-elevated border border-felid-border rounded-sm text-xs font-mono text-felid-ink">
            is_calibrated: false
          </code>
          , labels the score semantics explicitly, and returns{' '}
          <code className="px-1.5 py-0.5 bg-felid-elevated border border-felid-border rounded-sm text-xs font-mono text-felid-ink">
            entropy: null
          </code>{' '}
          because the provider does not produce a categorical distribution.
        </p>

        <AlertBanner tone="warning">
          <span>
            A ranked candidate is a visual-similarity estimate, not human verification. It must not
            be used as an authoritative scientific record, and no result is labelled{' '}
            <code className="px-1.5 py-0.5 bg-felid-surface border border-felid-border rounded-sm text-xs font-mono">
              CONFIRMED
            </code>
            . Weak evidence produces multiple candidates or an abstention.
          </span>
        </AlertBanner>
      </section>

      {/* Section 3: Model provenance & Validation Visualization */}
      <section id="sec-provenance" className="journal-plate p-6 sm:p-8 space-y-5 scroll-mt-24">
        <div className="flex items-center gap-3 pb-4 border-b border-felid-border">
          <div className="w-10 h-10 bg-felid-highlight/15 border border-felid-highlight/45 rounded-sm flex items-center justify-center text-felid-highlight-ink shrink-0">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-felid-highlight-ink block">
              Section 03 · BioCLIP ViT-B/16 + ImageNet Gate + Breed ViT
            </span>
            <h2 className="font-display font-semibold text-xl sm:text-2xl text-felid-ink">
              Model Provenance, Licences &amp; Validation
            </h2>
          </div>
        </div>

        <div className="space-y-3 text-sm text-felid-ink/90 leading-relaxed font-sans">
          <p>
            <strong className="text-felid-ink font-semibold">Primary ranker:</strong>{' '}
            <a
              className="text-felid-cobalt-ink underline hover:opacity-80"
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
            <strong className="text-felid-ink font-semibold">Independent content gate:</strong>{' '}
            MobileNetV2-12 from the ONNX Model Zoo, Apache-2.0. It is used only to check whether the
            image contains a feline; it is not treated as a species cross-check. The two models are
            trained differently, so their disagreement is meaningful evidence of uncertainty.
          </p>
          <p>
            <strong className="text-felid-ink font-semibold">Breed estimator:</strong>{' '}
            <a
              className="text-felid-cobalt-ink underline hover:opacity-80"
              href="https://huggingface.co/dima806/cat_breed_image_detection"
              target="_blank"
              rel="noreferrer"
            >
              cat_breed_image_detection
            </a>{' '}
            (dima806), a ViT-B/16 fine-tuned on 48 cat classes under Apache-2.0. It runs only for
            accepted domestic cats and is exported to ONNX. Its output is a softmax score, not a
            calibrated probability, and it is reported as visual similarity rather than pedigree
            verification.
          </p>
          <p>
            <strong className="text-felid-ink font-semibold">No silent fallback:</strong>{' '}
            The default{' '}
            <code className="px-1.5 py-0.5 bg-felid-elevated border border-felid-border rounded-sm text-xs font-mono">
              auto
            </code>{' '}
            provider prefers BioCLIP with the gate, then the ImageNet-only fallback, and otherwise returns{' '}
            <code className="px-1.5 py-0.5 bg-felid-elevated border border-felid-border rounded-sm text-xs font-mono">
              model_unavailable
            </code>
            . It never switches to a development heuristic. The deterministic mock provider requires an explicit{' '}
            <code className="px-1.5 py-0.5 bg-felid-elevated border border-felid-border rounded-sm text-xs font-mono">
              CLASSIFIER_PROVIDER=dev_mock
            </code>
            , is labelled{' '}
            <code className="px-1.5 py-0.5 bg-felid-elevated border border-felid-border rounded-sm text-xs font-mono">
              development_simulation
            </code>
            , and cannot award XP.
          </p>
        </div>

        {/* Measured Real-Photo Validation Chart */}
        <BreedValidationChart />

        <div className="journal-inset p-4 space-y-2">
          <span className="text-felid-pomegranate-ink font-mono font-medium text-[11px] uppercase tracking-wider block">
            Known Limitations
          </span>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-felid-muted-ink leading-relaxed font-sans">
            <li>
              Small wildcats (margay, ocelot, oncilla, Pallas&apos;s cat, jungle cat, black-footed
              cat) remain confusable with each other and with domestic cats.
            </li>
            <li>
              Snow leopard and clouded leopard can be confused with other rosetted cats; lynx
              species cannot be separated reliably.
            </li>
            <li>
              Breed matches are visual only. The dedicated classifier is not calibrated, and it
              confuses close breed pairs (Maine Coon / Norwegian Forest, Ragdoll / Birman / Siamese).
              It averages crop/flip views of the photo (test-time augmentation); real-photo validation
              put top-1 accuracy near 53.5%, top-3 near 75.6%, and the precision of asserted matches
              at 87.5% at the 0.80 floor (100% at 0.90). Weak, generic, or non-catalogue evidence
              abstains instead of forcing a breed.
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
      <section id="sec-taxonomy" className="journal-plate p-6 sm:p-8 space-y-5 scroll-mt-24">
        <div className="flex items-center gap-3 pb-4 border-b border-felid-border">
          <div className="w-10 h-10 bg-felid-cobalt/15 border border-felid-cobalt/40 rounded-sm flex items-center justify-center text-felid-cobalt-ink shrink-0">
            <Cat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-felid-cobalt-ink block">
              Section 04 · Wild · Domestic · Breeds · Hybrids
            </span>
            <h2 className="font-display font-semibold text-xl sm:text-2xl text-felid-ink">
              Taxonomic Categories &amp; Count Semantics
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-felid-ink/90 leading-relaxed font-sans">
          Felineye follows the IUCN/SSC Cat Specialist Group revision of Felidae (Kitchener et al. 2017).
          That revision recognises 41 extant species, comprising 40 wild species plus the domestic cat
          (<em>Felis catus</em>). This is a documented taxonomic snapshot, not a permanent universal constant:
          authorities split and merge taxa over time, and the catalogue records its source so discrepancies can be audited.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 border border-felid-border rounded-sm bg-felid-border gap-px overflow-hidden">
          {[
            { label: 'Wild Species', value: meta?.wild_species_count ?? '—', tone: 'text-felid-cobalt-ink' },
            { label: 'Domestic Species', value: meta?.domestic_species_count ?? '—', tone: 'text-felid-pomegranate-ink' },
            { label: 'CFA Breeds', value: meta?.breed_count ?? '—', tone: 'text-felid-highlight-ink' },
            { label: 'Hybrid Crosses', value: meta?.hybrid_count ?? '—', tone: 'text-felid-muted-ink' },
          ].map((stat) => (
            <div key={stat.label} className="p-3.5 text-center bg-felid-elevated">
              <span className={`block font-mono font-medium text-xl ${stat.tone}`}>
                {stat.value}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-felid-muted-ink font-mono">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <CatalogCompositionChart meta={meta} />

        <div className="space-y-3 text-sm text-felid-ink/90 leading-relaxed font-sans">
          <p>
            <strong className="text-felid-ink font-semibold">Domestic breeds:</strong> Each breed profile is
            linked to the Cat Fanciers&apos; Association (CFA) registry and was fetched and title-checked during
            curation{meta ? ` (${meta.updated})` : ''}. Breed names are human-defined labels, not scientific taxa;
            every breed is assigned to <em>Felis catus</em> and excluded from all species counts. Other registries
            such as TICA and FIFe recognise partly different lists and are not claimed here. Breeds are never
            discoverable and never award XP.
          </p>
          <p>
            <strong className="text-felid-ink font-semibold">Hybrids:</strong> Crosses such as the liger,
            tigon, leopon, and pumapard are listed separately for completeness. They are not species and not breeds,
            are excluded from both counts, and are never returned as identification results.
          </p>
        </div>

        <div className="journal-inset p-4 flex items-start gap-3">
          <Dna className="w-4 h-4 text-felid-cobalt-ink shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-felid-muted-ink leading-relaxed font-sans">
            Counts are reported independently so that adding breeds can never inflate the wild Felidae total.
            The species atlas, collection roster, and home-page statistics all read these separate values.
          </p>
        </div>
      </section>

      {/* Section 5: Responsible Wildlife Data Protocol */}
      <section id="sec-conservation" className="journal-plate p-6 sm:p-8 space-y-4 scroll-mt-24">
        <div className="flex items-center gap-3 pb-4 border-b border-felid-border">
          <div className="w-10 h-10 bg-felid-pomegranate/15 border border-felid-pomegranate/40 rounded-sm flex items-center justify-center text-felid-pomegranate-ink shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-felid-pomegranate-ink block">
              Section 05 · Zero Vulnerable Coordinates Exposed
            </span>
            <h2 className="font-display font-semibold text-xl sm:text-2xl text-felid-ink">
              Conservation Safety &amp; Coordinate Obscuration
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-felid-ink/90 leading-relaxed font-sans">
          Poaching, commercial trafficking, and irresponsible tourism present existential threats to apex predators and rare felids. In compliance with ethical biodiversity guidelines:
        </p>

        <ul className="list-disc list-outside ml-5 space-y-2 text-sm text-felid-muted-ink leading-relaxed font-sans">
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

      <BotanicalRule />

      {/* Section 6: Data Provenance & Citations */}
      <section id="sec-references" className="journal-plate p-6 sm:p-8 space-y-5 scroll-mt-24">
        <div className="flex items-center gap-3 pb-4 border-b border-felid-border">
          <div className="w-10 h-10 bg-felid-cobalt/15 border border-felid-cobalt/40 rounded-sm flex items-center justify-center text-felid-cobalt-ink shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-felid-cobalt-ink block">
              Section 06 · Scientific Authorities &amp; Open Data Licences
            </span>
            <h2 className="font-display font-semibold text-xl sm:text-2xl text-felid-ink">
              Data Provenance, References &amp; Acknowledgements
            </h2>
          </div>
        </div>

        <ol className="space-y-3 text-sm text-felid-ink/90 leading-relaxed font-sans">
          <li className="flex items-start gap-3">
            <span className="font-mono text-xs text-felid-muted-ink pt-0.5 shrink-0">[1]</span>
            <div>
              <strong className="text-felid-ink font-semibold">Taxonomic Classification:</strong> Based on the revised taxonomy of the Felidae established by Kitchener, A. C. et al. (2017), <em>Cat News Special Issue 11</em>, IUCN SSC Cat Specialist Group. Forty wild species plus the domestic cat are catalogued; breeds and hybrids are tracked in separate collections.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-mono text-xs text-felid-muted-ink pt-0.5 shrink-0">[2]</span>
            <div>
              <strong className="text-felid-ink font-semibold">Identification Models:</strong> BioCLIP (Imageomics Institute, Stevens et al.) under the MIT licence, MobileNetV2-12 from the ONNX Model Zoo under Apache-2.0, and the cat-breed ViT (<code className="font-mono text-xs">dima806/cat_breed_image_detection</code>) under Apache-2.0. Inference runs through ONNX Runtime; model weights are not committed to the repository.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-mono text-xs text-felid-muted-ink pt-0.5 shrink-0">[3]</span>
            <div>
              <strong className="text-felid-ink font-semibold">Domestic Breed Registry:</strong> Breed records follow the Cat Fanciers&apos; Association (CFA) breed profiles at cfa.org. Each registry URL was fetched and title-checked during curation; breed names are not treated as scientific taxa.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-mono text-xs text-felid-muted-ink pt-0.5 shrink-0">[4]</span>
            <div>
              <strong className="text-felid-ink font-semibold">Field Observations:</strong> Sourced via the iNaturalist Network API under Creative Commons open-access scientific licenses (CC BY-NC 4.0).
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-mono text-xs text-felid-muted-ink pt-0.5 shrink-0">[5]</span>
            <div>
              <strong className="text-felid-ink font-semibold">Taxonomic Backbone:</strong> Cross-referenced with the Global Biodiversity Information Facility (GBIF) Backbone Taxonomy where its treatment agrees with the 2017 CatSG revision. Taxon identifiers are omitted where modern databases split or synonymise a CatSG species rather than asserting a false mapping.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-mono text-xs text-felid-muted-ink pt-0.5 shrink-0">[6]</span>
            <div>
              <strong className="text-felid-ink font-semibold">Conservation Statuses:</strong> Regularly aligned with the IUCN Red List of Threatened Species Version 2024-2.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <BookMarked className="w-4 h-4 text-felid-cobalt-ink shrink-0 mt-1" />
            <div>
              <strong className="text-felid-ink font-semibold">Original Attribution:</strong> Felineye is adapted from the open-source architecture of <strong className="text-felid-cobalt-ink">BirdLens</strong> by sdprojects12.
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
};
