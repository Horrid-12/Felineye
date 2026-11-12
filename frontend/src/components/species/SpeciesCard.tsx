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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(species.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(species.id)}
      onKeyDown={handleKeyDown}
      className="group relative journal-plate-interactive overflow-hidden cursor-pointer flex flex-col text-left"
    >
      {/* Specimen Plate Image */}
      <div className="relative h-52 w-full overflow-hidden bg-felid-elevated border-b border-felid-border">
        <img
          src={species.thumbnail_url}
          alt={species.common_name}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />

        {/* Subtle bottom photo gradient for taxonomy caption legibility */}
        <div
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-felid-photo-scrim/85 via-felid-photo-scrim/35 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <ConservationBadge status={species.conservation_status} />

          {discovered ? (
            <span className="px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider bg-felid-highlight text-felid-on-highlight border border-felid-highlight rounded-sm shadow-sm inline-flex items-center gap-1">
              <PawPrint className="w-2.5 h-2.5" /> Logged
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-felid-surface/95 text-felid-ink border border-felid-border-strong rounded-sm shadow-sm">
              +{species.xp_reward} XP
            </span>
          )}
        </div>

        {/* Lineage Subtitle Strip */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-[10px] font-mono tracking-wider uppercase text-felid-photo-ink/90">
            {species.subfamily} · <em>{species.genus}</em>
          </span>
          <span
            className={`text-[9px] font-mono font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-sm border ${
              species.category === 'domestic_species'
                ? 'bg-felid-pomegranate/90 text-felid-on-pomegranate border-felid-pomegranate'
                : 'bg-felid-cobalt/90 text-felid-on-cobalt border-felid-cobalt'
            }`}
          >
            {species.category === 'domestic_species' ? 'Domestic Species' : 'Wild Species'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <h3 className="font-display font-semibold text-base text-felid-ink group-hover:text-felid-cobalt-ink transition-colors leading-snug">
            {species.common_name}
          </h3>
          <p className="text-xs italic text-felid-muted-ink font-serif mt-0.5">
            {species.scientific_name}
          </p>
        </div>

        {/* Geographic Range Preview */}
        {species.geographic_range && (
          <p className="text-xs text-felid-muted-ink font-sans line-clamp-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-felid-cobalt-ink shrink-0" />
            <span>{species.geographic_range}</span>
          </p>
        )}

        {/* Habitat Tags & Action */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-felid-border/80">
          <div className="flex flex-wrap gap-1">
            {species.habitats.slice(0, 2).map((h, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] font-mono bg-felid-elevated/70 text-felid-muted-ink border border-felid-border rounded-sm"
              >
                {h}
              </span>
            ))}
          </div>

          <span className="text-xs font-sans font-semibold text-felid-cobalt-ink inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Inspect</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
