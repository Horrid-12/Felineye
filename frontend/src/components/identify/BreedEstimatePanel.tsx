import React, { useState } from 'react';
import { ArrowRight, Cat, Info, ShieldQuestion } from 'lucide-react';
import { BreedPrediction } from '../../types';

interface Props {
  breed?: BreedPrediction | null;
  candidates?: BreedPrediction[];
  note?: string | null;
  /** Confusable group — rendered distinctly from a confirmed breed. */
  groupName?: string | null;
  groupCandidates?: BreedPrediction[];
  onSelectBreed: (slug: string) => void;
}

const CAVEAT =
  'Closest visual breed match from a dedicated classifier. It is not pedigree ' +
  'verification, does not change the species result, and does not award breed XP.';

export const BreedEstimatePanel: React.FC<Props> = ({
  breed,
  candidates = [],
  note,
  groupName,
  groupCandidates = [],
  onSelectBreed,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const uncertain = !breed && (groupCandidates.length > 0 || !!groupName);
  const alternatives = candidates.filter((candidate) => candidate.breed_id !== breed?.breed_id);

  if (!breed && alternatives.length === 0 && groupCandidates.length === 0) return null;

  return (
    <section className="journal-plate p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-felid-border">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-felid-elevated/80 border border-felid-border rounded-sm text-[10px] font-mono font-medium uppercase tracking-wider text-felid-cobalt-ink">
          {breed ? <Cat className="w-3.5 h-3.5" /> : <ShieldQuestion className="w-3.5 h-3.5" />}
          <span>
            {breed
              ? 'CLOSEST VISUAL MATCH'
              : uncertain
                ? 'BREED GROUP — UNCERTAIN'
                : 'BREED NOT ASSERTED'}
          </span>
        </div>
        <span className="text-[10px] font-mono font-medium uppercase text-felid-muted-ink">
          Visual Similarity · Not Pedigree Verification
        </span>
      </div>

      {breed && (
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden bg-felid-elevated border border-felid-border-strong rounded-sm flex items-center justify-center">
            {breed.thumbnail_url && !imgFailed ? (
              <img
                src={breed.thumbnail_url}
                alt={breed.common_name}
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            ) : (
              <Cat className="w-8 h-8 text-felid-muted-ink" aria-hidden="true" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h4 className="font-display font-semibold text-xl text-felid-ink leading-tight">
                {breed.common_name}
              </h4>
              <p className="text-xs italic text-felid-muted-ink font-serif mt-0.5">
                {breed.scientific_name}
              </p>
              <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-sm border border-felid-highlight/50 bg-felid-highlight/20 text-felid-highlight-ink">
                DOMESTIC BREED // CLOSEST MATCH
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                <span className="text-felid-muted-ink text-[11px]">VISUAL SIMILARITY SCORE</span>
                <span className="font-medium text-felid-cobalt-ink">
                  {breed.score_percentage}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-felid-elevated border border-felid-border rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-felid-cobalt-line to-felid-pomegranate-line transition-all duration-700"
                  style={{ width: `${breed.score_percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="journal-inset p-3.5 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 text-felid-cobalt-ink mt-0.5" />
        <p className="text-felid-muted-ink leading-relaxed font-sans">
          {note || CAVEAT}
        </p>
      </div>

      {uncertain && groupName && (
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-felid-muted-ink block">
            POSSIBLE BREED GROUP — CANNOT DISTINGUISH RELIABLY
          </span>
          <p className="text-xs text-felid-muted-ink font-serif italic">{groupName}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {groupCandidates.map((candidate) => (
              <button
                key={candidate.breed_id}
                type="button"
                onClick={() => onSelectBreed(candidate.breed_id)}
                className="flex items-center justify-between gap-2 px-3 py-2.5 bg-felid-elevated/60 hover:bg-felid-hover text-left border border-felid-border hover:border-felid-pomegranate/60 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt"
              >
                <span className="min-w-0">
                  <span className="block font-display font-semibold text-sm text-felid-ink truncate">
                    {candidate.common_name}
                  </span>
                  <span className="block text-[11px] font-mono text-felid-muted-ink">
                    {candidate.score_percentage}% visual similarity
                  </span>
                </span>
                <ShieldQuestion className="w-4 h-4 shrink-0 text-felid-pomegranate-ink" />
              </button>
            ))}
          </div>
          <p className="text-[11px] font-mono text-felid-muted-ink leading-relaxed">
            Visual appearance cannot establish pedigree. Scores are visual
            similarity, not calibrated probabilities.
          </p>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-felid-muted-ink block">
            CLOSEST CURATED BREED CLASSES
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            {alternatives.map((candidate) => (
              <button
                key={candidate.breed_id}
                type="button"
                onClick={() => onSelectBreed(candidate.breed_id)}
                className="flex items-center justify-between gap-2 px-3 py-2.5 bg-felid-elevated/60 hover:bg-felid-hover text-left border border-felid-border hover:border-felid-cobalt/60 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt"
              >
                <span className="min-w-0">
                  <span className="block font-display font-semibold text-sm text-felid-ink truncate">
                    {candidate.common_name}
                  </span>
                  <span className="block text-[11px] font-mono text-felid-muted-ink">
                    {candidate.score_percentage}% visual similarity
                  </span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-felid-cobalt-ink" />
              </button>
            ))}
          </div>
        </div>
      )}

      {breed && (
        <div className="pt-3 border-t border-felid-border">
          <button
            type="button"
            onClick={() => onSelectBreed(breed.breed_id)}
            className="btn-primary py-2 px-3.5 text-xs"
          >
            <Cat className="w-3.5 h-3.5" />
            <span>Breed Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};
