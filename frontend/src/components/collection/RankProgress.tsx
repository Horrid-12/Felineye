import React from 'react';
import { Award, Compass, Sunrise, Flame, Crown, Eye, Mountain, Waves, ShieldCheck, Snowflake, PawPrint, Cat } from 'lucide-react';
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
    case 'Footprints': return <PawPrint className="w-5 h-5 text-felid-accent" />;
    case 'Compass': return <Compass className="w-5 h-5 text-felid-accent" />;
    case 'Sunrise': return <Cat className="w-5 h-5 text-felid-accent" />;
    case 'Flame': return <Flame className="w-5 h-5 text-felid-accent" />;
    case 'Crown': return <Crown className="w-5 h-5 text-felid-accent" />;
    case 'Snowflake': return <Snowflake className="w-5 h-5 text-felid-accent" />;
    case 'Mountain': return <Mountain className="w-5 h-5 text-felid-accent" />;
    case 'Waves': return <Waves className="w-5 h-5 text-felid-accent" />;
    case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-felid-accent" />;
    default: return <PawPrint className="w-5 h-5 text-felid-accent" />;
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
  const completionPercent = totalSpeciesCount ? Math.round((discoveryCount / totalSpeciesCount) * 100) : 0;

  return (
    <div className="border-2 border-black bg-[#141218] p-6 shadow-brutal mb-8 space-y-6">
      
      {/* Top Banner & Rank Profile */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b-2 border-black">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#0c0a0e] border-2 border-black flex items-center justify-center shadow-brutal-sm shrink-0">
            {getIconComponent(currentRank.badge_icon)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-black tracking-wider text-black px-2 py-0.5 bg-felid-accent border border-black">
                RANK {currentRank.rank}
              </span>
              <span className="text-xs text-felid-muted font-mono">{totalXp} TOTAL XP</span>
            </div>
            <h2 className="font-display font-black text-2xl text-felid-ivory uppercase mt-1">
              {currentRank.title}
            </h2>
            <p className="text-xs text-felid-muted font-mono mt-0.5">
              {currentRank.description}
            </p>
          </div>
        </div>

        {/* Promptify-Style Metric Tiles (Reference 1) */}
        <div className="w-full md:w-auto grid grid-cols-2 gap-3">
          <div className="bg-[#0c0a0e] border-2 border-black p-3 text-center shadow-brutal-sm">
            <span className="text-2xl font-black text-felid-ivory font-mono block">
              {discoveryCount} <span className="text-xs text-felid-muted font-normal">/ {totalSpeciesCount || 41}</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-felid-muted uppercase">FELIDS LOGGED</span>
          </div>

          <div className="bg-[#0c0a0e] border-2 border-black p-3 text-center shadow-brutal-sm">
            <span className="text-2xl font-black text-felid-accent font-mono block">
              {completionPercent}%
            </span>
            <span className="text-[10px] font-mono font-bold text-felid-muted uppercase">ATLAS COMPLETE</span>
          </div>
        </div>
      </div>

      {/* Progress Bar to Next Rank in Neo-Brutalist Frame */}
      {nextRank && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-felid-muted">
              NEXT TIER: <strong className="text-felid-ivory uppercase">{nextRank.title}</strong>
            </span>
            <span className="text-felid-accent">
              {nextMin - totalXp} XP NEEDED
            </span>
          </div>
          <div className="w-full h-3.5 bg-[#0c0a0e] border-2 border-black overflow-hidden shadow-brutal-sm">
            <div
              className="h-full bg-gradient-to-r from-pink-600 via-rose-500 to-pink-400 transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
