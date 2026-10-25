import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCircle2,
  FileQuestion,
  ShieldAlert,
  Info,
  PawPrint,
  Cat
} from 'lucide-react';
import { IdentificationResult, ActivePage } from '../types';
import { api } from '../services/api';
import { ImageDropzone } from '../components/identify/ImageDropzone';
import { ScannerEffect } from '../components/identify/ScannerEffect';
import { CandidateCard } from '../components/identify/CandidateCard';
import { SimilarCompareModal } from '../components/identify/SimilarCompareModal';
import { useCollectionStore } from '../store/useCollectionStore';

interface Props {
  setActivePage: (page: ActivePage) => void;
  onSelectSpecies: (slug: string) => void;
}

export const IdentifyPage: React.FC<Props> = ({ setActivePage, onSelectSpecies }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [compareSlug, setCompareSlug] = useState<string | null>(null);
  const [unlockedNotice, setUnlockedNotice] = useState<{ isNew: boolean; xp: number; name: string } | null>(null);

  const { unlockDiscovery } = useCollectionStore();

  const handleImageSelected = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setErrorMsg(null);
    setUnlockedNotice(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMsg(null);
    setUnlockedNotice(null);
  };

  const runIdentification = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMsg(null);
    setUnlockedNotice(null);

    try {
      const res = await api.identifyImage(selectedFile);
      setResult(res);

      const top = res.top_candidate;
      // Breeds are never counted as discoveries; a breed call is downgraded to the domestic
      // species server-side, and hybrids are not classifiable at all.
      const discoverable =
        top !== undefined &&
        top.category !== 'domestic_breed' &&
        top.category !== 'hybrid';

      if (
        (res.status === 'high_confidence' || res.status === 'moderate_confidence') &&
        top &&
        discoverable
      ) {
        const xpAmount = res.status === 'high_confidence' ? 150 : 100;
        const unlockRes = unlockDiscovery(top.species_id, top.confidence_score, xpAmount);

        if (unlockRes.isNew) {
          setUnlockedNotice({
            isNew: true,
            xp: unlockRes.earnedXp,
            name: top.common_name,
          });
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
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete identification request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono font-black text-felid-accent uppercase">
          <PawPrint className="w-3.5 h-3.5" />
          <span>NEURAL OPTICAL INFERENCE // SHANNON ENTROPY GATE</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-felid-ivory uppercase tracking-tight">
          FELINE <span className="text-felid-accent underline decoration-4 underline-offset-4">PAW SCANNER</span>
        </h1>
        <p className="text-xs sm:text-sm text-felid-muted max-w-xl mx-auto font-mono leading-relaxed">
          Upload any feline photo to detect diagnostic features across 40 wild species and the domestic cat. Breed-level calls are never asserted from a single image; uncertain results list the closest taxa instead.
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
            <strong className="block font-black uppercase mb-0.5">IDENTIFICATION FAILED // TELEMETRY REJECTED</strong>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Identification Results Section */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* New Discovery Unlock Banner */}
          {unlockedNotice && (
            <div className="p-4 bg-[#141218] border-2 border-black shadow-brutal text-pink-100 text-xs font-mono flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-felid-accent border-2 border-black flex items-center justify-center text-black font-black text-base shadow-brutal-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-felid-accent block uppercase text-sm">
                    NEW SPECIES LOGGED IN FIELD JOURNAL!
                  </span>
                  <span className="text-felid-ivory-dim">
                    Discovered {unlockedNotice.name} // Awarded +{unlockedNotice.xp} Discovery XP
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

          {/* Development Mock Warning Banner (Honesty Requirement) */}
          {result.is_mock && (
            <div className="p-3.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-felid-muted text-xs font-mono flex items-center gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-felid-accent" />
              <span>
                <strong className="text-felid-ivory uppercase">DEVELOPMENT SIMULATION ACTIVE:</strong> Offline test heuristic active. These results are demonstration ranks and not authentic production AI predictions.
              </span>
            </div>
          )}

          {/* Outcome State Header */}
          {result.status === 'non_felid_detected' ? (
            <div className="p-6 bg-[#0c0a0e] border-2 border-black shadow-brutal text-pink-200 space-y-2 text-center">
              <FileQuestion className="w-10 h-10 text-felid-accent mx-auto mb-2" />
              <h3 className="font-display font-black text-lg text-felid-ivory uppercase">
                NON-FELID IMAGE DETECTED
              </h3>
              <p className="text-xs text-felid-muted max-w-lg mx-auto font-mono leading-relaxed">
                The neural model could not identify diagnostic feline cranial geometry, slit/round pupils, ear contours, or coat patterns. Please upload a clear photo containing a cat or wild felid.
              </p>
            </div>
          ) : result.status === 'uncertain' ? (
            <div className="p-6 bg-[#0c0a0e] border-2 border-black shadow-brutal text-pink-200 space-y-2">
              <div className="flex items-center gap-2 text-felid-accent">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-black text-base text-felid-ivory uppercase">
                  HIGH AMBIGUITY // UNCERTAIN TAXONOMIC RESOLUTION
                </h3>
              </div>
              <p className="text-xs text-felid-muted font-mono leading-relaxed">
                {result.uncertainty_note ||
                  'The model detected feline features but cannot definitively distinguish among candidate species. The closest matches are listed below for your evaluation.'}
              </p>
            </div>
          ) : (
            /* Promptify-Style Telemetry Strip */
            <div className="p-4 bg-[#141218] border-2 border-black shadow-brutal flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-felid-accent" />
                <span className="font-black text-felid-ivory uppercase">
                  {result.status.replace('_', ' ')} MATCH
                </span>
                <span className="text-felid-muted">· Semantics: {result.score_semantics}</span>
              </div>
              <div className="flex items-center gap-3 text-felid-muted text-[11px]">
                <span className="flex items-center gap-1 bg-[#0c0a0e] px-2 py-0.5 border border-black">
                  <Clock className="w-3 h-3 text-felid-accent" />
                  {result.processing_time_ms}ms
                </span>
                <span className="bg-[#0c0a0e] px-2 py-0.5 border border-black text-emerald-400 font-bold">
                  ENTROPY: {result.entropy} NATS
                </span>
              </div>
            </div>
          )}

          {/* Advisory note for otherwise-confident results that still carry a caveat,
              e.g. domestic cat identified at species level but breed left undetermined. */}
          {result.status !== 'uncertain' && result.uncertainty_note && (
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
              <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                <h3 className="font-display font-black text-xl text-felid-ivory uppercase">
                  RANKED CANDIDATES
                </h3>
                <span className="text-xs text-felid-muted font-mono font-bold">
                  {result.candidates.length} TAXA IDENTIFIED
                </span>
              </div>

              <div className="space-y-4">
                {result.candidates.map((cand, idx) => (
                  <CandidateCard
                    key={cand.species_id}
                    candidate={cand}
                    rank={idx + 1}
                    isTop={idx === 0}
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
