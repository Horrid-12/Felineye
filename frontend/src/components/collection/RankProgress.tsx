import React from 'react';
import {
  Compass,
  Flame,
  Crown,
  Eye,
  Mountain,
  Waves,
  ShieldCheck,
  PawPrint,
  Cat,
} from 'lucide-react';
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
    case 'Eye':
      return <Eye className="w-5 h-5 text-felid-highlight-ink" />;
    case 'Footprints':
      return <PawPrint className="w-5 h-5 text-felid-highlight-ink" />;
    case 'Compass':
      return <Compass className="w-5 h-5 text-felid-highlight-ink" />;
    case 'Sunrise':
      return <Cat className="w-5 h-5 text-felid-highlight-ink" />;
    case 'Flame':
      return <Flame className="w-5 h-5 text-felid-highlight-ink" />;
    case 'Crown':
      return <Crown className="w-5 h-5 text-felid-highlight-ink" />;
    case 'Mountain':
      return <Mountain className="w-5 h-5 text-felid-highlight-ink" />;
    case 'Waves':
      return <Waves className="w-5 h-5 text-felid-highlight-ink" />;
    case 'ShieldCheck':
      return <ShieldCheck className="w-5 h-5 text-felid-highlight-ink" />;
    default:
      return <PawPrint className="w-5 h-5 text-felid-highlight-ink" />;
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
  const completionPercent = totalSpeciesCount
    ? Math.round((discoveryCount / totalSpeciesCount) * 100)
    : 0;

  return (
    <div className="journal-plate p-6 mb-8 space-y-5">
      {/* Top Banner & Rank Profile */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-5 border-b border-felid-border">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-felid-highlight/15 border border-felid-highlight/45 rounded-sm flex items-center justify-center shrink-0">
            {getIconComponent(currentRank.badge_icon)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-medium tracking-wider px-2 py-0.5 rounded-sm bg-felid-highlight/20 text-felid-highlight-ink border border-felid-highlight/45">
                Rank {currentRank.rank}
              </span>
              <span className="text-xs text-felid-muted-ink font-mono">{totalXp} Total XP</span>
            </div>
            <h2 className="font-display font-semibold text-xl text-felid-ink mt-1">
              {currentRank.title}
            </h2>
            <p className="text-xs sm:text-sm text-felid-muted-ink font-sans mt-0.5">
              {currentRank.description}
            </p>
          </div>
        </div>

        {/* Understated Metric Ledger */}
        <div className="w-full md:w-auto grid grid-cols-2 gap-3">
          <div className="journal-inset px-4 py-3 text-center">
            <span className="text-xl font-medium text-felid-ink font-mono block">
              {discoveryCount}{' '}
              <span className="text-xs text-felid-muted-ink font-normal">/ {totalSpeciesCount || 0}</span>
            </span>
            <span className="text-[10px] font-mono text-felid-muted-ink uppercase tracking-wider">
              Felids Logged
            </span>
          </div>

          <div className="journal-inset px-4 py-3 text-center">
            <span className="text-xl font-medium text-felid-pomegranate-ink font-mono block">
              {completionPercent}%
            </span>
            <span className="text-[10px] font-mono text-felid-muted-ink uppercase tracking-wider">
              Atlas Complete
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar to Next Rank in Burnished Gold -> Pomegranate */}
      {nextRank && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-felid-muted-ink">
              Next Tier: <strong className="text-felid-ink font-medium">{nextRank.title}</strong>
            </span>
            <span className="text-felid-highlight-ink font-medium">
              {nextMin - totalXp} XP needed
            </span>
          </div>
          <div className="w-full h-2.5 bg-felid-elevated border border-felid-border rounded-sm overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-felid-highlight-line to-felid-pomegranate-line transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
