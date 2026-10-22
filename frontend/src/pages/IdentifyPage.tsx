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
  Info
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

      // If valid identification, check and record discovery unlock!
      if (
        (res.status === 'high_confidence' || res.status === 'moderate_confidence') &&
        res.top_candidate
      ) {
        const top = res.top_candidate;
        // Base XP: 150 for high confidence, 100 for moderate
        const xpAmount = res.status === 'high_confidence' ? 150 : 100;
        const unlockRes = unlockDiscovery(top.species_id, top.confidence_score, xpAmount);

        if (unlockRes.isNew) {
          setUnlockedNotice({
            isNew: true,
            xp: unlockRes.earnedXp,
            name: top.common_name,
          });
          // Fire celebratory wildlife confetti!
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#e5a93b', '#f59e0b', '#10b981', '#ffffff'],
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
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-felid-ivory tracking-tight">
          AI Feline <span className="text-felid-accent">Identification</span>
        </h1>
        <p className="text-sm text-felid-muted max-w-xl mx-auto leading-relaxed">
          Upload any photograph of a feline to detect its probable species, evaluate diagnostic features, and record discoveries in your field journal.
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

      {/* Action Button */}
      {selectedFile && !result && !isLoading && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={runIdentification}
            className="px-8 py-3.5 rounded-xl bg-felid-accent hover:bg-felid-accent-hover text-black font-semibold text-sm inline-flex items-center gap-2 shadow-forest-glow transition-all hover:scale-[1.02] focus:outline-none"
          >
            <Sparkles className="w-4 h-4" />
            Analyze Feline Morphology
          </button>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">Identification Failed</strong>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Identification Results Section */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* New Discovery Unlock Banner */}
          {unlockedNotice && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-600/80 text-emerald-200 text-sm flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-emerald-300 block">
                    New Species Logged in Field Journal!
                  </span>
                  <span className="text-xs text-emerald-100">
                    Discovered {unlockedNotice.name} · Awarded +{unlockedNotice.xp} Discovery XP
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActivePage('collection')}
                className="px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-xs text-white border border-emerald-600 transition-colors"
              >
                View Journal
              </button>
            </div>
          )}

          {/* Development Mock Warning Banner (Honesty Requirement) */}
          {result.is_mock && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Development Simulation Provider Active:</strong> Offline test heuristic active. These results are demonstration ranks and not authentic production AI predictions.
              </span>
            </div>
          )}

          {/* Outcome State Header */}
          {result.status === 'non_felid_detected' ? (
            <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-2 text-center">
              <FileQuestion className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <h3 className="font-display font-bold text-lg text-amber-300">
                Non-Felid Image Detected
              </h3>
              <p className="text-xs text-amber-200/90 max-w-lg mx-auto leading-relaxed">
                The neural model could not identify diagnostic feline cranial geometry, slit/round pupils, ear contours, or coat patterns. Please upload a clear photo containing a cat or wild felid.
              </p>
            </div>
          ) : result.status === 'uncertain' ? (
            <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-700/60 text-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-display font-bold text-base">
                  High Ambiguity / Uncertain Identification
                </h3>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {result.uncertainty_note ||
                  'The model detected feline features but cannot definitively distinguish among candidate species. The closest matches are listed below for your evaluation.'}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-felid-surface border border-felid-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-felid-ivory capitalize">
                  {result.status.replace('_', ' ')} Match
                </span>
                <span className="text-felid-muted">· Semantics: {result.score_semantics}</span>
              </div>
              <div className="flex items-center gap-3 text-felid-muted font-mono text-[11px]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-felid-accent" />
                  {result.processing_time_ms}ms
                </span>
                <span>Entropy: {result.entropy}</span>
              </div>
            </div>
          )}

          {/* Candidate Predictions List */}
          {result.candidates.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-felid-ivory flex items-center justify-between">
                <span>Ranked Candidates</span>
                <span className="text-xs text-felid-muted font-normal font-sans">
                  {result.candidates.length} taxa identified
                </span>
              </h3>

              <div className="space-y-3">
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
              className="px-6 py-2.5 rounded-xl bg-felid-surface hover:bg-felid-surface-hover text-felid-ivory text-xs font-medium border border-felid-border inline-flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-felid-accent" />
              Upload Another Photo
            </button>
          </div>

          {/* Scientific Disclaimer */}
          <p className="text-[11px] text-felid-muted text-center max-w-xl mx-auto italic">
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
