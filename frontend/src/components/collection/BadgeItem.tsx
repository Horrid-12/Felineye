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
      className={`border rounded-sm p-4 flex items-start gap-4 transition-colors ${
        unlocked
          ? 'bg-felid-surface border-felid-highlight/55 shadow-plate'
          : 'bg-felid-surface/65 border-felid-border opacity-85'
      }`}
    >
      <div
        className={`w-12 h-12 flex items-center justify-center shrink-0 rounded-sm border ${
          unlocked
            ? 'bg-felid-highlight/15 border-felid-highlight/45 text-felid-highlight-ink'
            : 'bg-felid-elevated/70 border-felid-border text-felid-muted-ink'
        }`}
      >
        {unlocked ? (
          getIconComponent(badge.icon)
        ) : (
          <Lock className="w-4 h-4 text-felid-muted-ink" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display font-semibold text-base text-felid-ink truncate">
            {badge.title}
          </h4>
          {unlocked ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-felid-pomegranate-ink font-mono font-medium uppercase bg-felid-pomegranate/15 px-2 py-0.5 border border-felid-pomegranate/40 rounded-sm shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Unlocked
            </span>
          ) : (
            <span className="text-[10px] font-mono text-felid-muted-ink bg-felid-elevated/80 px-2 py-0.5 border border-felid-border rounded-sm shrink-0">
              {Math.min(progressCount, badge.required_count)} / {badge.required_count}
            </span>
          )}
        </div>

        <p className="text-xs text-felid-muted-ink mt-1 leading-relaxed font-sans">
          {badge.description}
        </p>

        {/* Quiet progress bar in Royal Cobalt */}
        {!unlocked && (
          <div className="mt-2.5 w-full h-1.5 bg-felid-elevated border border-felid-border rounded-sm overflow-hidden">
            <div
              className="h-full bg-felid-cobalt-line transition-all duration-500"
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
