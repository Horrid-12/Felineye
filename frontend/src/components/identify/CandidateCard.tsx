import React, { useState } from 'react';
import { ArrowRight, Cat, PawPrint, Scale, Info, Target } from 'lucide-react';
import { CandidatePrediction } from '../../types';
import { ConservationBadge } from '../species/ConservationBadge';

const CATEGORY_LABELS: Record<string, string> = {
  wild_species: 'WILD SPECIES',
  domestic_species: 'DOMESTIC CAT',
  domestic_breed: 'DOMESTIC BREED',
  hybrid: 'HYBRID',
};

const SCORE_SEMANTICS_LABELS: Record<string, string> = {
  bioclip_image_text_cosine_similarity: 'IMAGE–TEXT SIMILARITY',
  imagenet_softmax_class_score: 'IMAGENET CLASS SCORE',
  simulated_rank_distribution: 'SIMULATED RANK (NOT AI)',
};

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
  const [imgFailed, setImgFailed] = useState(false);
  const category =
    candidate.category ?? (candidate.is_wild ? 'wild_species' : 'domestic_species');
  const scoreLabel = candidate.score_semantics
    ? SCORE_SEMANTICS_LABELS[candidate.score_semantics] ??
      candidate.score_semantics.replace(/_/g, ' ').toUpperCase()
    : 'MODEL SCORE';

  return (
    <div
      className={`border rounded-sm transition-all p-5 relative ${
        isTop
          ? 'bg-felid-surface border-felid-cobalt/65 shadow-plate-hover'
          : 'bg-felid-surface/85 border-felid-border shadow-plate hover:border-felid-border-strong'
      }`}
    >
      {/* Top banner for the asserted species-level match */}
      {isTop && (
        <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-0.5 bg-felid-cobalt text-felid-on-cobalt font-mono font-medium text-[10px] rounded-sm uppercase tracking-wider">
          <Target className="w-3 h-3" />
          <span>TOP MODEL CANDIDATE</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Rank Number & Thumbnail Viewport */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden bg-felid-elevated border border-felid-border-strong rounded-sm relative group flex items-center justify-center">
            {candidate.thumbnail_url && !imgFailed ? (
              <img
                src={candidate.thumbnail_url}
                alt={candidate.common_name}
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <Cat className="w-8 h-8 text-felid-muted-ink" aria-hidden="true" />
            )}
          </div>

          <span
            className={`absolute -top-2 -left-2 px-2 py-0.5 text-xs font-medium font-mono border rounded-sm shadow-sm ${
              isTop
                ? 'bg-felid-highlight text-felid-on-highlight border-felid-highlight'
                : 'bg-felid-elevated text-felid-ink border-felid-border-strong'
            }`}
          >
            #{rank}
          </span>
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 className="font-display font-semibold text-lg text-felid-ink leading-tight">
                {candidate.common_name}
              </h4>
              <p className="text-xs italic text-felid-muted-ink font-serif mt-0.5">
                {candidate.scientific_name}
              </p>
              <span
                className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-sm border ${
                  category === 'wild_species'
                    ? 'bg-felid-elevated/80 text-felid-cobalt-ink border-felid-border'
                    : 'bg-felid-pomegranate/15 text-felid-pomegranate-ink border-felid-pomegranate/40'
                }`}
              >
                {CATEGORY_LABELS[category] ?? category}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ConservationBadge status={candidate.conservation_status} />
              <div className="bg-felid-elevated/80 text-felid-muted-ink border border-felid-border rounded-sm px-2 py-0.5 font-mono font-medium text-[10px] uppercase">
                MODEL ESTIMATE
              </div>
            </div>
          </div>

          {/* Model score bar */}
          <div className="pt-0.5">
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="text-felid-muted-ink inline-flex items-center gap-1.5 text-[11px]">
                {isTop && <PawPrint className="w-3.5 h-3.5 text-felid-cobalt-ink" />}
                <span>{scoreLabel}</span>
              </span>
              <span className="font-medium text-felid-cobalt-ink">
                {candidate.score_percentage}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-felid-elevated border border-felid-border rounded-sm overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  isTop
                    ? 'bg-gradient-to-r from-felid-cobalt-line to-felid-pomegranate-line'
                    : 'bg-felid-cobalt-line/80'
                }`}
                style={{ width: `${candidate.score_percentage}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-felid-muted-ink font-mono">
              Not a calibrated probability. Weak or close scores are reported as an abstention, not
              a confirmation.
            </p>
          </div>

          {/* Model rationale block */}
          {candidate.rationale && (
            <div className="journal-inset p-3 text-xs space-y-1">
              <span className="text-felid-cobalt-ink font-mono font-medium text-[10px] uppercase tracking-wider block">
                Model Rationale
              </span>
              <p className="text-felid-ink/90 leading-relaxed font-sans">
                {candidate.rationale}
              </p>
            </div>
          )}

          {/* Action Triggers */}
          <div className="pt-2.5 flex flex-wrap items-center gap-2.5 border-t border-felid-border/80">
            <button
              type="button"
              onClick={() => onViewDetails(candidate.species_id)}
              className="btn-primary py-2 px-3.5 text-xs"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Cat Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onCompareSimilar && (
              <button
                type="button"
                onClick={() => onCompareSimilar(candidate.species_id)}
                className="btn-secondary py-2 px-3.5 text-xs"
              >
                <Scale className="w-3.5 h-3.5 text-felid-pomegranate-ink" />
                <span>Compare Similar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
