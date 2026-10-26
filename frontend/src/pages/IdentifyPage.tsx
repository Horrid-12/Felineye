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
import { SimilarCompareModal } from '../components/identify/SimilarCompareModal';
import { useCollectionStore } from '../store/useCollectionStore';
import { DiscoveryAwardKind } from '../store/collectionStorage';

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
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f472b6', '#fb7185', '#fda4af', '#f43f5e', '#ffffff'],
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
        <div className="p-6 bg-[#0c0a0e] border-2 border-black shadow-brutal text-pink-200 space-y-3">
          <div className="flex items-center gap-2">
            <WifiOff className="w-6 h-6 text-amber-400" />
            <h3 className="font-display font-black text-base text-felid-ivory uppercase">
              IDENTIFICATION MODEL NOT AVAILABLE
            </h3>
          </div>
          <p className="text-xs text-felid-muted font-mono leading-relaxed">
            {result.uncertainty_note ||
              'No real identification model is installed, so no prediction was attempted.'}
          </p>
          <p className="text-[11px] text-felid-muted font-mono leading-relaxed">
            Felineye does not fall back to random, hash-based, or heuristic predictions. When the
            model is unavailable the honest answer is that no identification was performed.
          </p>
          {result.model_setup_hint && (
            <code className="block p-2.5 bg-black/60 border border-[#332c3a] text-[10px] text-felid-accent font-mono break-all">
              {result.model_setup_hint}
            </code>
          )}
        </div>
      );
    }

    if (result.status === 'processing_error') {
      return (
        <div className="p-6 bg-[#0c0a0e] border-2 border-black shadow-brutal text-pink-200 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-felid-accent" />
            <h3 className="font-display font-black text-base text-felid-ivory uppercase">
              PROCESSING ERROR
            </h3>
          </div>
          <p className="text-xs text-felid-muted font-mono leading-relaxed">
            {result.uncertainty_note ||
              'The inference provider failed before producing a result. No prediction or discovery XP was produced.'}
          </p>
        </div>
      );
    }

    if (result.status === 'non_feline_detected') {
      return (
        <div className="p-6 bg-[#0c0a0e] border-2 border-black shadow-brutal text-pink-200 space-y-2 text-center">
          <FileQuestion className="w-10 h-10 text-felid-accent mx-auto mb-2" />
          <h3 className="font-display font-black text-lg text-felid-ivory uppercase">
            NO FELINE DETECTED
          </h3>
          <p className="text-xs text-felid-muted max-w-lg mx-auto font-mono leading-relaxed">
            {result.uncertainty_note ||
              'The image was not found to contain a cat or wild felid with sufficient evidence, so it was not matched to a species.'}
          </p>
        </div>
      );
    }

    if (result.status === 'unable_to_identify') {
      return (
        <div className="p-6 bg-[#0c0a0e] border-2 border-black shadow-brutal text-pink-200 space-y-2">
          <div className="flex items-center gap-2 text-felid-accent">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-display font-black text-base text-felid-ivory uppercase">
              UNABLE TO IDENTIFY — RESULT WITHHELD
            </h3>
          </div>
          <p className="text-xs text-felid-muted font-mono leading-relaxed">
            {result.uncertainty_note ||
              'The available evidence was insufficient or conflicting. No species is asserted; the closest candidates are listed for comparison only.'}
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 bg-[#141218] border-2 border-black shadow-brutal flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`w-3 h-3 ${
              isIdentified ? 'bg-felid-accent' : 'bg-amber-400'
            }`}
          />
          <span className="font-black text-felid-ivory uppercase">
            {STATUS_LABELS[result.status] ?? result.status.replace(/_/g, ' ')}
          </span>
          <span className="text-felid-muted">· {scoreSemanticsLabel(result.score_semantics)}</span>
          {result.is_mock && (
            <span className="px-2 py-0.5 bg-amber-400 text-black font-black border border-black">
              NOT REAL AI
            </span>
          )}
          {!result.is_calibrated && (
            <span className="px-2 py-0.5 bg-[#0c0a0e] text-felid-muted border border-black">
              UNCALIBRATED
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-felid-muted text-[11px]">
          {result.model_name && (
            <span className="flex items-center gap-1 bg-[#0c0a0e] px-2 py-0.5 border border-black">
              <BrainCircuit className="w-3 h-3 text-felid-accent" />
              {result.model_name}
              {result.model_license ? ` · ${result.model_license}` : ''}
            </span>
          )}
          <span className="flex items-center gap-1 bg-[#0c0a0e] px-2 py-0.5 border border-black">
            <Clock className="w-3 h-3 text-felid-accent" />
            {result.processing_time_ms}ms measured
          </span>
          {typeof gate?.feline_probability === 'number' && (
            <span className="bg-[#0c0a0e] px-2 py-0.5 border border-black">
              GATE: {gate.top_label ?? 'unknown'} ·{' '}
              {(gate.feline_probability * 100).toFixed(1)}% feline mass
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono font-black text-felid-accent uppercase">
          <PawPrint className="w-3.5 h-3.5" />
          <span>LOCAL VISION MODEL // ABSTENTION-AWARE PIPELINE</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-felid-ivory uppercase tracking-tight">
          FELINE <span className="text-felid-accent underline decoration-4 underline-offset-4">PAW SCANNER</span>
        </h1>
        <p className="text-xs sm:text-sm text-felid-muted max-w-xl mx-auto font-mono leading-relaxed">
          Upload a feline photo to rank it against 40 wild species and the domestic cat. Scores are
          model similarities, not calibrated probabilities. When evidence is weak, conflicting, or
          breed-level, Felineye abstains instead of forcing a species.
        </p>
      </div>

      {/* Upload Zone & Interactive Scanner Preview */}
      <div className="relative">
        <ImageDropzone
          onImageSelected={handleImageSelected}
          selectedImage={selectedFile}
          onClear={handleClear}
          isLoading={isLoading}
        />

        {/* Cinematic Scanner Overlay while running inference */}
        {isLoading && <ScannerEffect />}
      </div>

      {/* Action Button (Komi Store Tactile CTA Style) */}
      {selectedFile && !result && !isLoading && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={runIdentification}
            className="px-8 py-4 bg-felid-accent hover:bg-felid-accent-hover text-black font-mono font-black text-sm uppercase border-2 border-black shadow-brutal brutal-press inline-flex items-center gap-2.5"
          >
            <PawPrint className="w-5 h-5" />
            <span>ANALYZE FELINE MORPHOLOGY</span>
          </button>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 bg-red-950/70 border-2 border-black shadow-brutal text-pink-200 text-xs font-mono flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-felid-accent shrink-0 mt-0.5" />
          <div>
            <strong className="block font-black uppercase mb-0.5">IDENTIFICATION FAILED // REQUEST REJECTED</strong>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Identification Results Section */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Journal outcome banner */}
          {discoveryNotice && (
            <div className="p-4 bg-[#141218] border-2 border-black shadow-brutal text-pink-100 text-xs font-mono flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-felid-accent border-2 border-black flex items-center justify-center text-black font-black text-base shadow-brutal-sm">
                  {discoveryNotice.kind === 'new_species' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="font-black text-felid-accent block uppercase text-sm">
                    {discoveryNotice.kind === 'new_species' && 'NEW SPECIES LOGGED IN FIELD JOURNAL!'}
                    {discoveryNotice.kind === 'new_photo' && 'NEW PHOTO LOGGED — SPECIES ALREADY DISCOVERED'}
                    {discoveryNotice.kind === 'repeat_image' && 'THIS PHOTO WAS ALREADY ANALYSED'}
                  </span>
                  <span className="text-felid-ivory-dim">
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
                onClick={() => setActivePage('collection')}
                className="px-4 py-2 bg-felid-accent text-black font-mono font-black text-xs border-2 border-black shadow-brutal-sm brutal-press uppercase"
              >
                VIEW JOURNAL
              </button>
            </div>
          )}

          {/* Development simulation warning (honesty requirement) */}
          {result.is_mock && (
            <div className="p-3.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-felid-muted text-xs font-mono flex items-center gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-felid-accent" />
              <span>
                <strong className="text-felid-ivory uppercase">DEVELOPMENT SIMULATION ACTIVE:</strong>{' '}
                The explicit mock provider is running. These are deterministic test ranks, not real
                AI predictions, and they cannot award discovery XP.
              </span>
            </div>
          )}

          {/* Outcome State Header */}
          {renderOutcomeHeader()}

          {/* Advisory note for identified results that still carry a caveat,
              e.g. domestic cat identified at species level but breed left undetermined. */}
          {isIdentified && result.uncertainty_note && (
            <div className="p-3.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-felid-muted text-xs font-mono flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-felid-accent mt-0.5" />
              <span>
                <strong className="text-felid-ivory uppercase">ADVISORY:</strong>{' '}
                {result.uncertainty_note}
              </span>
            </div>
          )}

          {/* Candidate Predictions List */}
          {result.candidates.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-black">
                <h3 className="font-display font-black text-xl text-felid-ivory uppercase">
                  {isIdentified ? 'RANKED MODEL CANDIDATES' : 'CANDIDATES FOR COMPARISON (NOT ASSERTED)'}
                </h3>
                <span className="text-xs text-felid-muted font-mono font-bold">
                  {result.candidates.length} TAXA RANKED
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
              className="px-6 py-3 bg-[#1d1922] hover:bg-[#26222d] text-felid-ivory text-xs font-mono font-bold uppercase border-2 border-black shadow-brutal brutal-press inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-felid-accent" />
              Upload Another Cat Photo
            </button>
          </div>

          {/* Scientific Disclaimer */}
          <p className="text-[11px] text-felid-muted text-center max-w-xl mx-auto italic font-mono">
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
