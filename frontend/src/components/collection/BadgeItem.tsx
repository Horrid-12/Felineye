import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../types';
import { getIconComponent } from './RankProgress';

interface Props {
  badge: Badge;
  unlocked: boolean;
  progressCount: number;
}

export const BadgeItem: React.FC<Props> = ({ badge, unlocked, progressCount }) => {
  return (
    <div
      className={`border-2 border-black p-4 flex items-start gap-4 transition-all ${
        unlocked
          ? 'bg-[#141218] shadow-brutal'
          : 'bg-[#141218]/50 shadow-brutal-sm opacity-70'
      }`}
    >
      <div
        className={`w-12 h-12 flex items-center justify-center shrink-0 border-2 border-black ${
          unlocked
            ? 'bg-[#0c0a0e] text-felid-accent shadow-brutal-sm'
            : 'bg-[#0c0a0e] text-felid-muted'
        }`}
      >
        {unlocked ? getIconComponent(badge.icon) : <Lock className="w-5 h-5 text-felid-muted/60" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display font-black text-sm text-felid-ivory uppercase truncate">
            {badge.title}
          </h4>
          {unlocked ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold uppercase bg-[#0c0a0e] px-2 py-0.5 border border-black">
              <CheckCircle2 className="w-3 h-3" /> UNLOCKED
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold text-felid-muted bg-[#0c0a0e] px-2 py-0.5 border border-black">
              {Math.min(progressCount, badge.required_count)} / {badge.required_count}
            </span>
          )}
        </div>

        <p className="text-xs text-felid-muted mt-1 leading-relaxed">
          {badge.description}
        </p>

        {/* Progress meter for locked badge in pink */}
        {!unlocked && (
          <div className="mt-2.5 w-full h-2 bg-[#0c0a0e] border border-black overflow-hidden">
            <div
              className="h-full bg-felid-accent"
              style={{
                width: `${Math.min(100, Math.round((progressCount / badge.required_count) * 100))}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
