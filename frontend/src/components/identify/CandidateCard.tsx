import React from 'react';
import { ArrowRight, PawPrint, Scale, Info } from 'lucide-react';
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
      className={`rounded-2xl border transition-all p-4 ${
        isTop
          ? 'bg-felid-surface border-felid-accent/60 shadow-pink-glow ring-1 ring-felid-accent/30'
          : 'bg-felid-surface/60 border-felid-border hover:border-felid-border-light hover:bg-felid-surface'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Rank Number & Thumbnail */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-felid-pine border border-felid-border shadow-sm">
            <img
              src={candidate.thumbnail_url}
              alt={candidate.common_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <span
            className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${
              isTop
                ? 'bg-felid-accent text-black border-felid-accent shadow-sm'
                : 'bg-felid-pine text-felid-muted border-felid-border'
            }`}
          >
            #{rank}
          </span>
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div>
              <h4 className="font-display font-bold text-base text-felid-ivory truncate">
                {candidate.common_name}
              </h4>
              <p className="text-xs italic text-felid-muted font-serif">
                {candidate.scientific_name}
              </p>
            </div>
            <ConservationBadge status={candidate.conservation_status} />
          </div>

          {/* Confidence Score Bar in Pink Quartz */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-felid-muted flex items-center gap-1 font-mono text-[11px]">
                {isTop && <PawPrint className="w-3 h-3 text-felid-accent" />}
                Morphological Match
              </span>
              <span className="font-mono font-bold text-felid-accent">
                {candidate.score_percentage}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-felid-pine overflow-hidden border border-felid-border/50">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isTop
                    ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-pink-400'
                    : 'bg-felid-border-light'
                }`}
                style={{ width: `${candidate.score_percentage}%` }}
              />
            </div>
          </div>

          {/* Rationale if present */}
          {candidate.rationale && (
            <p className="mt-2 text-xs text-felid-ivory-dim/80 bg-felid-pine/50 rounded-lg p-2 border border-felid-border/40">
              <span className="text-felid-accent font-mono text-[10px] uppercase">Traits:</span>{' '}
              {candidate.rationale}
            </p>
          )}

          {/* Actions */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-felid-border/40">
            <button
              type="button"
              onClick={() => onViewDetails(candidate.species_id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-felid-pine hover:bg-felid-surface-hover text-felid-ivory text-xs font-medium border border-felid-border transition-all hover:border-felid-accent/50"
            >
              <Info className="w-3.5 h-3.5 text-felid-accent" />
              Cat Profile
              <ArrowRight className="w-3 h-3 opacity-60" />
            </button>

            {onCompareSimilar && (
              <button
                type="button"
                onClick={() => onCompareSimilar(candidate.species_id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-felid-pine hover:bg-felid-surface-hover text-felid-muted hover:text-felid-ivory text-xs font-medium border border-felid-border transition-colors"
              >
                <Scale className="w-3.5 h-3.5" />
                Compare Similar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
