import React from 'react';

interface Props {
  status: string;
  className?: string;
  showTitle?: boolean;
}

export const ConservationBadge: React.FC<Props> = ({
  status,
  className = '',
  showTitle = false,
}) => {
  const code = status.toUpperCase();

  const getStyle = () => {
    switch (code) {
      case 'CR':
        return {
          pill: 'bg-felid-pomegranate text-felid-on-pomegranate border-felid-pomegranate',
          dot: 'bg-felid-on-pomegranate',
          title: 'Critically Endangered',
        };
      case 'EN':
        return {
          pill: 'bg-felid-surface/95 text-felid-pomegranate-ink border-felid-pomegranate/70',
          dot: 'bg-felid-pomegranate-line',
          title: 'Endangered',
        };
      case 'VU':
        return {
          pill: 'bg-felid-surface/95 text-felid-highlight-ink border-felid-highlight/70',
          dot: 'bg-felid-highlight-line',
          title: 'Vulnerable',
        };
      case 'NT':
        return {
          pill: 'bg-felid-surface/95 text-felid-cobalt-ink border-felid-cobalt/70',
          dot: 'bg-felid-cobalt-line',
          title: 'Near Threatened',
        };
      case 'LC':
        return {
          pill: 'bg-felid-surface/95 text-felid-muted-ink border-felid-border-strong',
          dot: 'bg-felid-muted',
          title: 'Least Concern',
        };
      case 'DOMESTIC':
        return {
          pill: 'bg-felid-surface/95 text-felid-cobalt-ink border-felid-cobalt/55',
          dot: 'bg-felid-highlight-line',
          title: 'Domesticated',
        };
      default:
        return {
          pill: 'bg-felid-surface/95 text-felid-muted-ink border-felid-border-strong',
          dot: 'bg-felid-muted',
          title: 'Unassessed',
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-sm border shadow-sm backdrop-blur-[2px] ${style.pill} ${className}`}
      title={style.title}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
      <span>{code}</span>
      {showTitle && <span className="opacity-85">· {style.title}</span>}
    </span>
  );
};
