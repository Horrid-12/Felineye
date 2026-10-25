import React from 'react';
import { PawPrint, MapPin, ArrowRight } from 'lucide-react';
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
      className="group relative border-2 border-black bg-[#141218] hover:bg-[#1d1922] transition-all shadow-brutal hover:shadow-brutal-lg cursor-pointer flex flex-col brutal-press"
    >
      {/* Photo Container with Optical Crosshairs */}
      <div className="relative h-48 w-full overflow-hidden bg-[#0c0a0e] border-b-2 border-black">
        <img
          src={species.thumbnail_url}
          alt={species.common_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Viewfinder crosshairs in corners */}
        <div className="absolute top-1 left-1 text-felid-accent font-mono text-[9px] pointer-events-none">+</div>
        <div className="absolute top-1 right-1 text-felid-accent font-mono text-[9px] pointer-events-none">+</div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <ConservationBadge status={species.conservation_status} />

          {/* Discovery Stamp */}
          {discovered ? (
            <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider bg-felid-accent text-black border-2 border-black shadow-brutal-sm flex items-center gap-1">
              <PawPrint className="w-2.5 h-2.5" /> LOGGED
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-mono font-black bg-black text-felid-ivory border-2 border-black shadow-brutal-sm">
              +{species.xp_reward} XP
            </span>
          )}
        </div>

        {/* Lineage Subtitle Banner */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex flex-wrap items-center gap-1">
          <span className="text-[9px] font-mono font-black tracking-widest uppercase bg-black/80 px-2 py-0.5 border border-[#332c3a] text-felid-accent inline-block">
            {species.subfamily} · {species.genus}
          </span>
          <span className="text-[9px] font-mono font-black tracking-widest uppercase bg-felid-accent text-black px-2 py-0.5 border border-black inline-block">
            {species.category === 'domestic_species' ? 'DOMESTIC SPECIES' : 'WILD SPECIES'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-display font-black text-base text-felid-ivory uppercase group-hover:text-felid-accent transition-colors">
            {species.common_name}
          </h3>
          <p className="text-xs italic text-felid-muted font-serif">
            {species.scientific_name}
          </p>
        </div>

        {/* Geographic Range Preview */}
        {species.geographic_range && (
          <p className="text-xs text-felid-muted font-mono line-clamp-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-felid-accent shrink-0" />
            <span>{species.geographic_range}</span>
          </p>
        )}

        {/* Habitat Tags & Action */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t-2 border-black">
          <div className="flex flex-wrap gap-1">
            {species.habitats.slice(0, 2).map((h, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[9px] font-mono bg-[#0c0a0e] text-felid-muted border border-[#332c3a]"
              >
                {h}
              </span>
            ))}
          </div>

          <span className="text-xs font-mono font-bold text-felid-accent flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
            <span>INSPECT</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
