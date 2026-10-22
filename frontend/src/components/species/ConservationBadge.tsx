import React from 'react';

interface Props {
  status: string;
  className?: string;
  showTitle?: boolean;
}

export const ConservationBadge: React.FC<Props> = ({ status, className = '', showTitle = false }) => {
  const code = status.toUpperCase();

  const getStyle = () => {
    switch (code) {
      case 'CR':
        return {
          bg: 'bg-red-950/80 border-red-700 text-red-300',
          dot: 'bg-red-500',
          title: 'Critically Endangered',
        };
      case 'EN':
        return {
          bg: 'bg-orange-950/80 border-orange-700 text-orange-300',
          dot: 'bg-orange-500',
          title: 'Endangered',
        };
      case 'VU':
        return {
          bg: 'bg-amber-950/80 border-amber-700 text-amber-300',
          dot: 'bg-amber-400',
          title: 'Vulnerable',
        };
      case 'NT':
        return {
          bg: 'bg-yellow-950/70 border-yellow-700 text-yellow-300',
          dot: 'bg-yellow-400',
          title: 'Near Threatened',
        };
      case 'LC':
        return {
          bg: 'bg-emerald-950/80 border-emerald-700 text-emerald-300',
          dot: 'bg-emerald-500',
          title: 'Least Concern',
        };
      case 'DOMESTIC':
        return {
          bg: 'bg-cyan-950/70 border-cyan-700 text-cyan-300',
          dot: 'bg-cyan-400',
          title: 'Domesticated',
        };
      default:
        return {
          bg: 'bg-neutral-900 border-neutral-700 text-neutral-300',
          dot: 'bg-neutral-500',
          title: 'Unassessed',
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${className}`}
      title={style.title}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
      <span>{code}</span>
      {showTitle && <span className="opacity-80">· {style.title}</span>}
    </span>
  );
};
