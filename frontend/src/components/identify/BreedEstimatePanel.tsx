import React from 'react';
import { ArrowRight, Cat, Info, ShieldQuestion } from 'lucide-react';
import { BreedPrediction } from '../../types';

interface Props {
  breed?: BreedPrediction | null;
  candidates?: BreedPrediction[];
  note?: string | null;
  onSelectBreed: (slug: string) => void;
}

const CAVEAT =
  'Visual breed estimate from a dedicated classifier. It is not pedigree verification, ' +
  'does not change the species result, and does not award breed XP.';

export const BreedEstimatePanel: React.FC<Props> = ({
  breed,
  candidates = [],
  note,
  onSelectBreed,
}) => {
  const alternatives = candidates.filter((candidate) => candidate.breed_id !== breed?.breed_id);

  if (!breed && alternatives.length === 0) return null;

  return (
    <section className="bg-[#141218] border-2 border-black shadow-brutal p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-[10px] font-mono font-black uppercase tracking-wider text-felid-accent">
          {breed ? <Cat className="w-3.5 h-3.5" /> : <ShieldQuestion className="w-3.5 h-3.5" />}
          <span>{breed ? 'BREED ESTIMATE' : 'BREED NOT ASSERTED'}</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase text-felid-muted">
          VISUAL SIMILARITY // NOT PEDIGREE VERIFICATION
        </span>
      </div>

      {breed && (
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden bg-[#0c0a0e] border-2 border-black shadow-brutal-sm">
            <img
              src={breed.thumbnail_url}
              alt={breed.common_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h4 className="font-display font-black text-xl text-felid-ivory uppercase tracking-tight">
                {breed.common_name}
              </h4>
              <p className="text-xs italic text-felid-muted font-serif">
                {breed.scientific_name}
              </p>
              <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider border border-black bg-felid-accent text-black">
                DOMESTIC BREED // ESTIMATE
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="text-felid-muted text-[11px]">BREED-CLASSIFIER SCORE</span>
                <span className="font-bold text-felid-accent">
                  {breed.score_percentage}%
                </span>
              </div>
              <div className="w-full h-3 bg-[#0c0a0e] border-2 border-black overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-600 via-rose-500 to-pink-400 transition-all duration-700"
                  style={{ width: `${breed.score_percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0c0a0e] border-2 border-black p-3 text-xs flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 text-felid-accent mt-0.5" />
        <p className="text-felid-muted leading-relaxed font-mono">
          {note || CAVEAT}
        </p>
      </div>

      {alternatives.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-felid-muted block">
            CLOSEST CURATED BREED CLASSES
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            {alternatives.map((candidate) => (
              <button
                key={candidate.breed_id}
                type="button"
                onClick={() => onSelectBreed(candidate.breed_id)}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-[#1d1922] hover:bg-[#26222d] text-left border-2 border-black shadow-brutal-sm brutal-press"
              >
                <span className="min-w-0">
                  <span className="block font-display font-black text-xs text-felid-ivory uppercase truncate">
                    {candidate.common_name}
                  </span>
                  <span className="block text-[10px] font-mono text-felid-muted">
                    {candidate.score_percentage}% visual similarity
                  </span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-felid-accent" />
              </button>
            ))}
          </div>
        </div>
      )}

      {breed && (
        <div className="pt-2 border-t-2 border-black">
          <button
            type="button"
            onClick={() => onSelectBreed(breed.breed_id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-felid-accent hover:bg-felid-accent-hover text-black text-xs font-mono font-black border-2 border-black shadow-brutal-sm brutal-press"
          >
            <Cat className="w-3.5 h-3.5" />
            Breed Profile
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      )}
    </section>
  );
};
