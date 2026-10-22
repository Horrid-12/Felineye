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
      className={`rounded-xl border p-4 flex items-start gap-4 transition-all ${
        unlocked
          ? 'bg-felid-surface border-felid-accent/50 shadow-forest-glow'
          : 'bg-felid-surface/40 border-felid-border opacity-70'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
          unlocked
            ? 'bg-felid-pine border-felid-accent/60 shadow-sm'
            : 'bg-felid-pine/60 border-felid-border'
        }`}
      >
        {unlocked ? getIconComponent(badge.icon) : <Lock className="w-5 h-5 text-felid-muted/60" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display font-bold text-sm text-felid-ivory truncate">
            {badge.title}
          </h4>
          {unlocked ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3 h-3" /> Unlocked
            </span>
          ) : (
            <span className="text-[10px] font-mono text-felid-muted">
              {Math.min(progressCount, badge.required_count)} / {badge.required_count}
            </span>
          )}
        </div>

        <p className="text-xs text-felid-muted mt-1 leading-relaxed">
          {badge.description}
        </p>

        {/* Progress meter for locked badge */}
        {!unlocked && (
          <div className="mt-2.5 w-full h-1.5 rounded-full bg-felid-pine overflow-hidden border border-felid-border/50">
            <div
              className="h-full rounded-full bg-felid-accent/60"
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
