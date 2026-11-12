import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCircle2,
  FileQuestion,
  ShieldAlert,
  Info,
  PawPrint,
  BrainCircuit,
  WifiOff,
  Camera,
} from 'lucide-react';
import { IdentificationResult, IdentificationStatus, ActivePage } from '../types';
import { api } from '../services/api';
import { ImageDropzone } from '../components/identify/ImageDropzone';
import { ScannerEffect } from '../components/identify/ScannerEffect';
import { CandidateCard } from '../components/identify/CandidateCard';
import { BreedEstimatePanel } from '../components/identify/BreedEstimatePanel';
import { SimilarCompareModal } from '../components/identify/SimilarCompareModal';
import { useCollectionStore } from '../store/useCollectionStore';
import { DiscoveryAwardKind } from '../store/collectionStorage';
import { AlertBanner, PageHeader } from '../components/ui/JournalPrimitives';

interface Props {
  setActivePage: (page: ActivePage) => void;
  onSelectSpecies: (slug: string) => void;
}

interface DiscoveryNotice {
  kind: DiscoveryAwardKind;
  name: string;
  xp: number;
  photoCount: number;
}

const IDENTIFIED_STATUSES: IdentificationStatus[] = [
  'identified_wild_species',
  'identified_domestic_cat',
  'identified_domestic_breed',
];

const SCORE_SEMANTICS_LABELS: Record<string, string> = {
  bioclip_image_text_cosine_similarity: 'image–text cosine similarity (not calibrated)',
  imagenet_softmax_class_score: 'ImageNet class score (not a species probability)',
  simulated_rank_distribution: 'simulated ranks (not AI inference)',
};

const STATUS_LABELS: Record<string, string> = {
  identified_wild_species: 'WILD SPECIES IDENTIFIED',
  identified_domestic_cat: 'DOMESTIC CAT IDENTIFIED',
  identified_domestic_breed: 'DOMESTIC BREED IDENTIFIED',
  development_simulation: 'DEVELOPMENT SIMULATION',
  unable_to_identify: 'EVIDENCE INSUFFICIENT',
  non_feline_detected: 'NO FELINE DETECTED',
  model_unavailable: 'MODEL UNAVAILABLE',
  processing_error: 'PROCESSING ERROR',
};

const scoreSemanticsLabel = (semantics: string | undefined): string => {
  if (!semantics) return 'model score (not calibrated)';
  return SCORE_SEMANTICS_LABELS[semantics] ?? `${semantics.replace(/_/g, ' ')} (not calibrated)`;
};

export const IdentifyPage: React.FC<Props> = ({ setActivePage, onSelectSpecies }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [compareSlug, setCompareSlug] = useState<string | null>(null);
  const [discoveryNotice, setDiscoveryNotice] = useState<DiscoveryNotice | null>(null);

  const { recordDiscovery } = useCollectionStore();

  const handleImageSelected = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setErrorMsg(null);
    setDiscoveryNotice(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMsg(null);
    setDiscoveryNotice(null);
  };

  const celebrate = () => {
    try {
      const style = getComputedStyle(document.documentElement);
      const tokenVars = [
        '--felid-cobalt-rgb',
        '--felid-pomegranate-rgb',
        '--felid-highlight-rgb',
        '--felid-accent-rgb',
        '--felid-surface-rgb',
      ];
      const colors = tokenVars
        .map((v) => {
          const parts = style.getPropertyValue(v).trim().split(/\s+/).map(Number);
          if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
          return `#${parts.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
        })
        .filter((c): c is string => Boolean(c));

      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
        zIndex: 45,
        ...(colors.length > 0 ? { colors } : {}),
      });
    } catch {
      // Safe fallback if canvas is restricted
    }
  };

  const runIdentification = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMsg(null);
    setDiscoveryNotice(null);

    try {
      const res = await api.identifyImage(selectedFile);
      setResult(res);

      // Rewards are server-authoritative: only a real, successful species-level
      // result is eligible. Mock, uncertain, non-feline, breed, failed, and
      // model-unavailable results never reach the journal.
      const top = res.top_candidate;
      if (!res.is_discovery_eligible || !top) return;

      const outcome = recordDiscovery({
        speciesId: top.species_id,
        confidence: top.confidence_score,
        xpReward: res.xp_reward ?? 0,
        imageFingerprint: res.image_fingerprint,
      });

      setDiscoveryNotice({
        kind: outcome.kind,
        name: top.common_name,
        xp: outcome.earnedXp,
        photoCount: outcome.photoCount,
      });

      if (outcome.kind === 'new_species') {
        celebrate();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete identification request.');
    } finally {
      setIsLoading(false);
    }
  };

  const isIdentified = result ? IDENTIFIED_STATUSES.includes(result.status) : false;
  const gate = result?.feline_gate;

  const renderOutcomeHeader = () => {
    if (!result) return null;

    if (result.status === 'model_unavailable') {
      return (
        <div className="journal-plate border-felid-highlight/60 p-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-5 h-5 text-felid-highlight-ink shrink-0" />
            <h3 className="font-display font-semibold text-lg text-felid-ink uppercase">
              IDENTIFICATION MODEL NOT AVAILABLE
            </h3>
          </div>
          <p className="text-sm text-felid-muted-ink font-sans leading-relaxed">
            {result.uncertainty_note ||
              'No real identification model is installed, so no prediction was attempted.'}
          </p>
          <p className="text-xs text-felid-muted-ink font-sans leading-relaxed">
            Felineye does not fall back to random, hash-based, or heuristic predictions. When the
            model is unavailable the honest answer is that no identification was performed.
          </p>
          {result.model_setup_hint && (
            <code className="block p-3 bg-felid-elevated/80 border border-felid-border rounded-sm text-xs text-felid-cobalt-ink font-mono break-all">
              {result.model_setup_hint}
            </code>
          )}
        </div>
      );
    }

    if (result.status === 'processing_error') {
      return (
        <div className="journal-plate border-felid-pomegranate/60 p-6 space-y-2">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-felid-pomegranate-ink shrink-0" />
            <h3 className="font-display font-semibold text-lg text-felid-ink uppercase">
              PROCESSING ERROR
            </h3>
          </div>
          <p className="text-sm text-felid-muted-ink font-sans leading-relaxed">
            {result.uncertainty_note ||
              'The inference provider failed before producing a result. No prediction or discovery XP was produced.'}
          </p>
        </div>
      );
    }

    if (result.status === 'non_feline_detected') {
      return (
        <div className="journal-plate p-6 space-y-2.5 text-center">
          <FileQuestion className="w-9 h-9 text-felid-cobalt-ink mx-auto" />
          <h3 className="font-display font-semibold text-xl text-felid-ink uppercase">
            NO FELINE DETECTED
          </h3>
          <p className="text-sm text-felid-muted-ink max-w-lg mx-auto font-sans leading-relaxed">
            {result.uncertainty_note ||
              'The image was not found to contain a cat or wild felid with sufficient evidence, so it was not matched to a species.'}
          </p>
        </div>
      );
    }

    if (result.status === 'unable_to_identify') {
      return (
        <div className="journal-plate border-felid-highlight/60 p-6 space-y-2">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-felid-highlight-ink shrink-0" />
            <h3 className="font-display font-semibold text-lg text-felid-ink uppercase">
              UNABLE TO IDENTIFY — RESULT WITHHELD
            </h3>
          </div>
          <p className="text-sm text-felid-muted-ink font-sans leading-relaxed">
            {result.uncertainty_note ||
              'The available evidence was insufficient or conflicting. No species is asserted; the closest candidates are listed for comparison only.'}
          </p>
        </div>
      );
    }

    return (
      <div className="journal-plate p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isIdentified ? 'bg-felid-cobalt-line' : 'bg-felid-highlight-line'
            }`}
          />
          <span className="font-medium text-felid-ink uppercase">
            {STATUS_LABELS[result.status] ?? result.status.replace(/_/g, ' ')}
          </span>
          <span className="text-felid-muted-ink">· {scoreSemanticsLabel(result.score_semantics)}</span>
          {result.is_mock && (
            <span className="px-2 py-0.5 bg-felid-highlight/20 text-felid-highlight-ink font-medium border border-felid-highlight/50 rounded-sm">
              NOT REAL AI
            </span>
          )}
          {!result.is_calibrated && (
            <span className="px-2 py-0.5 bg-felid-elevated text-felid-muted-ink border border-felid-border rounded-sm">
              UNCALIBRATED
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-felid-muted-ink text-[11px]">
          {result.model_name && (
            <span className="flex items-center gap-1.5 bg-felid-elevated/70 px-2.5 py-0.5 border border-felid-border rounded-sm">
              <BrainCircuit className="w-3.5 h-3.5 text-felid-cobalt-ink" />
              <span>
                {result.model_name}
                {result.model_license ? ` · ${result.model_license}` : ''}
              </span>
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-felid-elevated/70 px-2.5 py-0.5 border border-felid-border rounded-sm">
            <Clock className="w-3.5 h-3.5 text-felid-cobalt-ink" />
            <span>{result.processing_time_ms}ms measured</span>
          </span>
          {typeof gate?.feline_probability === 'number' && (
            <span className="bg-felid-elevated/70 px-2.5 py-0.5 border border-felid-border rounded-sm">
              GATE: {gate.top_label ?? 'unknown'} ·{' '}
              {(gate.feline_probability * 100).toFixed(1)}% feline mass
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-8">
      <PageHeader
        centered
        kicker="Local Vision Model · Abstention-Aware Pipeline"
        kickerIcon={<PawPrint className="w-3.5 h-3.5" />}
        title={
          <>
            Feline <span className="italic text-felid-cobalt-ink">Paw Scanner</span>
          </>
        }
        subtitle="Upload a feline photo to rank it against 40 wild species and the domestic cat. Scores are model similarities, not calibrated probabilities. Domestic cats may also receive a separate closest visual breed match — similarity only, never pedigree verification. When evidence is weak or conflicting, Felineye abstains instead of forcing a species."
      />

      {/* Upload Zone & Interactive Scanner Preview */}
      <div className="relative">
        <ImageDropzone
          onImageSelected={handleImageSelected}
          selectedImage={selectedFile}
          onClear={handleClear}
          isLoading={isLoading}
        />

        {/* Scanner Overlay while running inference */}
        {isLoading && <ScannerEffect />}
      </div>

      {/* Action Button */}
      {selectedFile && !result && !isLoading && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={runIdentification}
            className="btn-primary px-8 py-3.5 text-xs sm:text-sm font-mono uppercase tracking-wider"
          >
            <PawPrint className="w-4 h-4" />
            <span>ANALYZE FELINE MORPHOLOGY</span>
          </button>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <AlertBanner tone="error" title="IDENTIFICATION FAILED // REQUEST REJECTED">
          {errorMsg}
        </AlertBanner>
      )}

      {/* Identification Results Section */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Journal outcome banner */}
          {discoveryNotice && (
            <div className="journal-plate border-felid-highlight/60 p-4 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-felid-highlight/20 border border-felid-highlight/50 rounded-sm flex items-center justify-center text-felid-highlight-ink shrink-0">
                  {discoveryNotice.kind === 'new_species' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="font-mono font-medium text-felid-highlight-ink block uppercase text-xs sm:text-sm">
                    {discoveryNotice.kind === 'new_species' && 'NEW SPECIES LOGGED IN FIELD JOURNAL!'}
                    {discoveryNotice.kind === 'new_photo' && 'NEW PHOTO LOGGED — SPECIES ALREADY DISCOVERED'}
                    {discoveryNotice.kind === 'repeat_image' && 'THIS PHOTO WAS ALREADY ANALYSED'}
                  </span>
                  <span className="text-felid-muted-ink font-sans">
                    {discoveryNotice.kind === 'new_species' &&
                      `Discovered ${discoveryNotice.name} // Awarded +${discoveryNotice.xp} Discovery XP`}
                    {discoveryNotice.kind === 'new_photo' &&
                      `${discoveryNotice.name} // Photo ${discoveryNotice.photoCount} logged. No duplicate XP for an already-discovered species.`}
                    {discoveryNotice.kind === 'repeat_image' &&
                      `${discoveryNotice.name} // No duplicate XP was awarded.`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('collection')}
                className="btn-primary py-2 px-4 text-xs uppercase font-mono"
              >
                VIEW JOURNAL
              </button>
            </div>
          )}

          {/* Development simulation warning (honesty requirement) */}
          {result.is_mock && (
            <AlertBanner tone="warning">
              <strong className="text-felid-ink uppercase font-mono">
                DEVELOPMENT SIMULATION ACTIVE:
              </strong>{' '}
              The explicit mock provider is running. These are deterministic test ranks, not real
              AI predictions, and they cannot award discovery XP.
            </AlertBanner>
          )}

          {/* Outcome State Header */}
          {renderOutcomeHeader()}

          {/* Advisory note for identified results that still carry a caveat */}
          {isIdentified && result.uncertainty_note && !result.breed && (
            <AlertBanner tone="info">
              <strong className="text-felid-ink uppercase font-mono">ADVISORY:</strong>{' '}
              {result.uncertainty_note}
            </AlertBanner>
          )}

          {/* Breed estimate for accepted domestic cats */}
          {result.status === 'identified_domestic_cat' && (
            <BreedEstimatePanel
              breed={result.breed}
              candidates={result.breed_candidates}
              note={result.breed_note}
              groupName={result.breed_group_name}
              groupCandidates={result.breed_group_candidates}
              onSelectBreed={onSelectSpecies}
            />
          )}

          {/* Candidate Predictions List */}
          {result.candidates.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-felid-border">
                <h3 className="font-display font-semibold text-xl text-felid-ink">
                  {isIdentified
                    ? 'RANKED MODEL CANDIDATES'
                    : 'CANDIDATES FOR COMPARISON (NOT ASSERTED)'}
                </h3>
                <span className="text-xs text-felid-muted-ink font-mono">
                  {result.candidates.length} taxa ranked
                </span>
              </div>

              <div className="space-y-4">
                {result.candidates.map((cand, idx) => (
                  <CandidateCard
                    key={cand.species_id}
                    candidate={cand}
                    rank={idx + 1}
                    isTop={isIdentified && idx === 0}
                    onViewDetails={onSelectSpecies}
                    onCompareSimilar={(slug) => setCompareSlug(slug)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reset / Try Another Photo Button */}
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary text-xs"
            >
              <RotateCcw className="w-4 h-4 text-felid-cobalt-ink" />
              <span>Upload Another Cat Photo</span>
            </button>
          </div>

          {/* Scientific Disclaimer */}
          <p className="text-xs text-felid-muted-ink text-center max-w-xl mx-auto italic font-sans">
            {result.disclaimer}
          </p>
        </div>
      )}

      {/* Comparative Modal */}
      {compareSlug && (
        <SimilarCompareModal
          sourceSlug={compareSlug}
          onClose={() => setCompareSlug(null)}
          onNavigate={(slug) => {
            setCompareSlug(null);
            onSelectSpecies(slug);
          }}
        />
      )}
    </div>
  );
};
