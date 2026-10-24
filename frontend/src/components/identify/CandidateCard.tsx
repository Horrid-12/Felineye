import React from 'react';
import { ArrowRight, PawPrint, Scale, Info, Check } from 'lucide-react';
import { CandidatePrediction } from '../../types';
import { ConservationBadge } from '../species/ConservationBadge';

interface Props {
  candidate: CandidatePrediction;
  rank: number;
  isTop: boolean;
  onViewDetails: (slug: string) => void;
  onCompareSimilar?: (slug: string) => void;
}

export const CandidateCard: React.FC<Props> = ({
  candidate,
  rank,
  isTop,
  onViewDetails,
  onCompareSimilar,
}) => {
  return (
    <div
      className={`border-2 border-black transition-all p-5 ${
        isTop
          ? 'bg-[#141218] shadow-brutal-lg relative'
          : 'bg-[#1d1922] shadow-brutal hover:bg-[#26222d]'
      }`}
    >
      {/* Top Banner Tag for Top Match */}
      {isTop && (
        <div className="absolute -top-3 left-4 bg-felid-accent text-black font-mono font-black text-[10px] px-2.5 py-0.5 border-2 border-black shadow-brutal-sm uppercase flex items-center gap-1">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>PRIMARY CLASSIFICATION MATCH</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Rank Number & Thumbnail Viewport with Crosshairs */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden bg-[#0c0a0e] border-2 border-black shadow-brutal-sm relative group">
            <img
              src={candidate.thumbnail_url}
              alt={candidate.common_name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {/* Viewfinder crosshairs in corners */}
            <div className="absolute top-0.5 left-0.5 text-felid-accent font-mono text-[9px] pointer-events-none">+</div>
            <div className="absolute top-0.5 right-0.5 text-felid-accent font-mono text-[9px] pointer-events-none">+</div>
          </div>

          <span
            className={`absolute -top-2.5 -left-2.5 px-2 py-0.5 text-xs font-black font-mono border-2 border-black shadow-brutal-sm ${
              isTop
                ? 'bg-felid-accent text-black'
                : 'bg-[#0c0a0e] text-felid-muted'
            }`}
          >
            #{rank}
          </span>
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-display font-black text-lg text-felid-ivory uppercase tracking-tight">
                {candidate.common_name}
              </h4>
              <p className="text-xs italic text-felid-muted font-serif">
                {candidate.scientific_name}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ConservationBadge status={candidate.conservation_status} />
              {isTop && (
                <div className="bg-[#34d399] text-black border-2 border-black shadow-brutal-sm px-2 py-0.5 text-center font-mono font-black text-[10px] uppercase">
                  CONFIRMED
                </div>
              )}
            </div>
          </div>

          {/* Morphological Match Bar in Neo-Brutalist Slot */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="text-felid-muted flex items-center gap-1 text-[11px]">
                {isTop && <PawPrint className="w-3.5 h-3.5 text-felid-accent" />}
                CONFIDENCE EVALUATION
              </span>
              <span className="font-bold text-felid-accent">
                {candidate.score_percentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#0c0a0e] border-2 border-black overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  isTop
                    ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-pink-400'
                    : 'bg-felid-accent/60'
                }`}
                style={{ width: `${candidate.score_percentage}%` }}
              />
            </div>
          </div>

          {/* Diagnostic Traits / Rationale block */}
          {candidate.rationale && (
            <div className="bg-[#0c0a0e] border-2 border-black p-3 text-xs space-y-1">
              <span className="text-felid-accent font-mono font-black text-[10px] uppercase tracking-wider block">
                DIAGNOSTIC TRAITS & MORPHOLOGY:
              </span>
              <p className="text-felid-ivory-dim leading-relaxed">
                {candidate.rationale}
              </p>
            </div>
          )}

          {/* Tactile Action Triggers */}
          <div className="pt-2 flex flex-wrap items-center gap-2 border-t-2 border-black">
            <button
              type="button"
              onClick={() => onViewDetails(candidate.species_id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-felid-accent hover:bg-felid-accent-hover text-black text-xs font-mono font-black border-2 border-black shadow-brutal-sm brutal-press"
            >
              <Info className="w-3.5 h-3.5" />
              Cat Profile
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {onCompareSimilar && (
              <button
                type="button"
                onClick={() => onCompareSimilar(candidate.species_id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1d1922] hover:bg-[#26222d] text-felid-ivory text-xs font-mono font-bold border-2 border-black shadow-brutal-sm brutal-press"
              >
                <Scale className="w-3.5 h-3.5 text-felid-accent" />
                Compare Similar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
