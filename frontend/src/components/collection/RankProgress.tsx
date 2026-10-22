import React from 'react';
import { Award, Footprints, Compass, Sunrise, Flame, Crown, Eye, Mountain, Waves, ShieldCheck, Snowflake } from 'lucide-react';
import { RankTier } from '../../types';

interface Props {
  currentRank: RankTier;
  nextRank: RankTier | null;
  totalXp: number;
  discoveryCount: number;
  totalSpeciesCount: number;
}

export const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Eye': return <Eye className="w-5 h-5 text-felid-accent" />;
    case 'Footprints': return <Footprints className="w-5 h-5 text-felid-accent" />;
    case 'Compass': return <Compass className="w-5 h-5 text-felid-accent" />;
    case 'Sunrise': return <Sunrise className="w-5 h-5 text-felid-accent" />;
    case 'Flame': return <Flame className="w-5 h-5 text-felid-accent" />;
    case 'Crown': return <Crown className="w-5 h-5 text-felid-accent" />;
    case 'Snowflake': return <Snowflake className="w-5 h-5 text-felid-accent" />;
    case 'Mountain': return <Mountain className="w-5 h-5 text-felid-accent" />;
    case 'Waves': return <Waves className="w-5 h-5 text-felid-accent" />;
    case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-felid-accent" />;
    default: return <Award className="w-5 h-5 text-felid-accent" />;
  }
};

export const RankProgress: React.FC<Props> = ({
  currentRank,
  nextRank,
  totalXp,
  discoveryCount,
  totalSpeciesCount,
}) => {
  const currentMin = currentRank.min_xp;
  const nextMin = nextRank ? nextRank.min_xp : currentRank.min_xp + 1000;
  const range = nextMin - currentMin;
  const progressInTier = Math.max(0, totalXp - currentMin);
  const percentage = nextRank ? Math.min(100, Math.round((progressInTier / range) * 100)) : 100;

  return (
    <div className="rounded-2xl border border-felid-border bg-felid-surface/80 p-6 shadow-card mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Current Rank Badge */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-felid-pine border border-felid-accent/40 flex items-center justify-center shadow-forest-glow shrink-0">
            {getIconComponent(currentRank.badge_icon)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-felid-accent px-2 py-0.5 rounded bg-felid-accent/10 border border-felid-accent/20">
                Rank {currentRank.rank}
              </span>
              <span className="text-xs text-felid-muted font-mono">{totalXp} Total XP</span>
            </div>
            <h2 className="font-display font-bold text-xl text-felid-ivory mt-1">
              {currentRank.title}
            </h2>
            <p className="text-xs text-felid-muted mt-0.5">
              {currentRank.description}
            </p>
          </div>
        </div>

        {/* Global Catalog Completion */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-felid-border/50">
          <div className="text-left md:text-right">
            <span className="block text-[11px] uppercase tracking-wider text-felid-muted font-mono">
              Atlas Logged
            </span>
            <span className="font-display font-bold text-lg text-felid-ivory">
              {discoveryCount} <span className="text-felid-muted text-sm font-normal">/ {totalSpeciesCount || 37}</span>
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[11px] uppercase tracking-wider text-felid-muted font-mono">
              Completion
            </span>
            <span className="font-mono font-bold text-lg text-felid-accent">
              {totalSpeciesCount ? Math.round((discoveryCount / totalSpeciesCount) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar to Next Rank */}
      {nextRank && (
        <div className="mt-6 pt-4 border-t border-felid-border/40">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-felid-muted">
              Progress to <strong className="text-felid-ivory">{nextRank.title}</strong>
            </span>
            <span className="font-mono text-felid-accent">
              {nextMin - totalXp} XP needed
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-felid-pine overflow-hidden border border-felid-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 transition-all duration-700 shadow-sm"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
