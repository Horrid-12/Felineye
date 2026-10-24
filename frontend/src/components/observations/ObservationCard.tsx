import React from 'react';
import { ShieldCheck, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { ObservationItem } from '../../types';

interface Props {
  observation: ObservationItem;
}

export const ObservationCard: React.FC<Props> = ({ observation }) => {
  return (
    <div className="border-2 border-black bg-[#141218] hover:bg-[#1d1922] transition-all overflow-hidden flex flex-col shadow-brutal hover:shadow-brutal-lg brutal-press">
      {/* Observation Photo */}
      <div className="relative h-48 w-full bg-[#0c0a0e] overflow-hidden border-b-2 border-black">
        {observation.image_url ? (
          <img
            src={observation.image_url}
            alt={observation.species_name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-felid-muted">
            NO SPECIMEN PHOTO ATTACHED
          </div>
        )}

        {/* Security badge: coordinates obscured */}
        {observation.coordinates_obscured && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-black text-emerald-400 font-mono font-bold text-[10px] border-2 border-black shadow-brutal-sm inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>GENERALIZED COORDS</span>
          </div>
        )}

        {/* Quality Grade in Rose Pink */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-[#f472b6] text-black font-mono font-black text-[10px] border-2 border-black shadow-brutal-sm uppercase">
          {observation.quality_grade}
        </div>
      </div>

      {/* Observation Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="font-display font-black text-base text-felid-ivory uppercase">
            {observation.species_name}
          </h4>
          <p className="text-xs italic text-felid-muted font-serif">
            {observation.scientific_name}
          </p>
        </div>

        <div className="space-y-1.5 text-xs text-felid-muted font-mono">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-felid-accent shrink-0 mt-0.5" />
            <span className="text-felid-ivory-dim leading-tight">
              {observation.broad_location}
            </span>
          </div>

          {observation.observed_on && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-felid-muted shrink-0" />
              <span>LOGGED: {observation.observed_on}</span>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="pt-3 border-t-2 border-black flex items-center justify-between text-xs font-mono">
          <span className="text-[10px] text-felid-muted font-bold uppercase">{observation.source}</span>
          <a
            href={observation.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-felid-accent hover:text-felid-accent-hover font-bold transition-colors"
          >
            RECORD <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
