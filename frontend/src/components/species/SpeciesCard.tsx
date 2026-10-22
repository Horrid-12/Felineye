import React from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import { SpeciesSummary } from '../../types';
import { ConservationBadge } from './ConservationBadge';
import { useCollectionStore } from '../../store/useCollectionStore';

interface Props {
  species: SpeciesSummary;
  onClick: (slug: string) => void;
}

export const SpeciesCard: React.FC<Props> = ({ species, onClick }) => {
  const { isDiscovered } = useCollectionStore();
  const discovered = isDiscovered(species.id);

  return (
    <div
      onClick={() => onClick(species.id)}
      className="group relative rounded-2xl overflow-hidden border border-felid-border bg-felid-surface/70 hover:bg-felid-surface hover:border-felid-accent/50 transition-all duration-300 hover:shadow-card cursor-pointer flex flex-col"
    >
      {/* Photo Container */}
      <div className="relative h-48 w-full overflow-hidden bg-felid-pine">
        <img
          src={species.thumbnail_url}
          alt={species.common_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-felid-surface via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <ConservationBadge status={species.conservation_status} />

          {/* Discovery Stamp */}
          {discovered ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-felid-accent/90 text-black shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Logged
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-felid-muted border border-white/10 backdrop-blur-sm">
              +{species.xp_reward} XP
            </span>
          )}
        </div>

        {/* Lineage Subtitle */}
        <div className="absolute bottom-2 left-3 right-3">
          <span className="text-[10px] font-mono tracking-wider uppercase text-felid-accent/90">
            {species.subfamily} · {species.genus}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-display font-bold text-base text-felid-ivory group-hover:text-felid-accent transition-colors">
            {species.common_name}
          </h3>
          <p className="text-xs italic text-felid-muted font-serif">
            {species.scientific_name}
          </p>
        </div>

        {/* Geographic Range Preview */}
        {species.geographic_range && (
          <p className="text-xs text-felid-muted/90 line-clamp-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-felid-accent/70 shrink-0" />
            <span>{species.geographic_range}</span>
          </p>
        )}

        {/* Habitat Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-felid-border/50">
          {species.habitats.slice(0, 3).map((h, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[10px] bg-felid-pine text-felid-muted border border-felid-border/60"
            >
              {h}
            </span>
          ))}
          {species.habitats.length > 3 && (
            <span className="text-[10px] text-felid-muted self-center">
              +{species.habitats.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
