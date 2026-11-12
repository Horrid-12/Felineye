import React from 'react';
import { ShieldCheck, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { ObservationItem } from '../../types';

interface Props {
  observation: ObservationItem;
}

export const ObservationCard: React.FC<Props> = ({ observation }) => {
  return (
    <article className="journal-plate-interactive overflow-hidden flex flex-col">
      {/* Specimen Field Photo */}
      <div className="relative h-48 w-full bg-felid-elevated overflow-hidden border-b border-felid-border">
        {observation.image_url ? (
          <img
            src={observation.image_url}
            alt={observation.species_name}
            className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-felid-muted-ink uppercase tracking-wider">
            No specimen photo attached
          </div>
        )}

        {/* Conservation badge: coordinates obscured */}
        {observation.coordinates_obscured && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-felid-surface/95 text-felid-cobalt-ink font-mono font-medium text-[10px] border border-felid-cobalt/45 rounded-sm shadow-sm inline-flex items-center gap-1 backdrop-blur-[2px]">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span>Generalized Coords</span>
          </div>
        )}

        {/* Quality Grade Seal */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-felid-surface/95 text-felid-pomegranate-ink font-mono font-medium text-[10px] border border-felid-pomegranate/40 rounded-sm shadow-sm uppercase backdrop-blur-[2px]">
          {observation.quality_grade}
        </div>
      </div>

      {/* Archival Field Note Ledger */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-felid-muted-ink mb-1">
            <span>Field Note</span>
            <span className="truncate max-w-[110px]">#{observation.id}</span>
          </div>
          <h4 className="font-display font-semibold text-base text-felid-ink leading-snug">
            {observation.species_name}
          </h4>
          <p className="text-xs italic text-felid-muted-ink font-serif mt-0.5">
            {observation.scientific_name}
          </p>
        </div>

        {/* Structured field-note metadata rows */}
        <dl className="space-y-2 pt-2.5 border-t border-felid-border/75 text-xs">
          <div className="flex items-start gap-2">
            <dt className="sr-only">Broad location</dt>
            <MapPin className="w-3.5 h-3.5 text-felid-cobalt-ink shrink-0 mt-0.5" />
            <dd className="text-felid-ink/90 font-sans leading-snug">
              <span className="block text-[9px] font-mono uppercase tracking-wider text-felid-muted-ink">
                Locality
              </span>
              {observation.broad_location}
            </dd>
          </div>

          {observation.observed_on && (
            <div className="flex items-start gap-2 font-mono text-[11px] text-felid-muted-ink">
              <dt className="sr-only">Observed on</dt>
              <Calendar className="w-3.5 h-3.5 text-felid-pomegranate-ink shrink-0 mt-0.5" />
              <dd>
                <span className="block text-[9px] font-mono uppercase tracking-wider text-felid-muted-ink">
                  Recorded
                </span>
                Logged {observation.observed_on}
              </dd>
            </div>
          )}
        </dl>

        {/* Source Citation Footer */}
        <div className="pt-2.5 border-t border-felid-border/80 flex items-center justify-between text-xs font-mono">
          <span className="text-[10px] text-felid-muted-ink uppercase tracking-wider">
            {observation.source}
          </span>
          <a
            href={observation.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-felid-cobalt-ink hover:underline font-medium"
          >
            <span>Record</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
};
