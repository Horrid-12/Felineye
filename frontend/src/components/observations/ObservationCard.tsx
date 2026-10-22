import React from 'react';
import { ShieldCheck, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { ObservationItem } from '../../types';

interface Props {
  observation: ObservationItem;
}

export const ObservationCard: React.FC<Props> = ({ observation }) => {
  return (
    <div className="rounded-2xl border border-felid-border bg-felid-surface/60 hover:bg-felid-surface hover:border-felid-border-light transition-all overflow-hidden flex flex-col shadow-sm">
      {/* Observation Photo */}
      <div className="relative h-48 w-full bg-felid-pine overflow-hidden">
        {observation.image_url ? (
          <img
            src={observation.image_url}
            alt={observation.species_name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-felid-muted">
            No photograph attached
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-felid-surface via-transparent to-black/20" />

        {/* Security badge: coordinates obscured */}
        {observation.coordinates_obscured && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm border border-emerald-500/40 text-[10px] text-emerald-300 font-medium inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Generalized Coordinates</span>
          </div>
        )}

        {/* Quality Grade */}
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-mono text-amber-300 border border-amber-500/30 uppercase">
          {observation.quality_grade}
        </div>
      </div>

      {/* Observation Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="font-display font-bold text-base text-felid-ivory">
            {observation.species_name}
          </h4>
          <p className="text-xs italic text-felid-muted font-serif">
            {observation.scientific_name}
          </p>
        </div>

        <div className="space-y-1.5 text-xs text-felid-muted">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-felid-accent shrink-0 mt-0.5" />
            <span className="text-felid-ivory-dim leading-tight">
              {observation.broad_location}
            </span>
          </div>

          {observation.observed_on && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-felid-muted shrink-0" />
              <span>Observed: {observation.observed_on}</span>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="pt-3 border-t border-felid-border/50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-felid-muted font-mono">{observation.source}</span>
          <a
            href={observation.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-felid-accent hover:text-felid-accent-hover font-medium transition-colors"
          >
            Original Record <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
