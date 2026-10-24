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
          bg: 'bg-[#f43f5e] text-white border-black',
          dot: 'bg-white',
          title: 'Critically Endangered',
        };
      case 'EN':
        return {
          bg: 'bg-[#fb7185] text-black border-black',
          dot: 'bg-black',
          title: 'Endangered',
        };
      case 'VU':
        return {
          bg: 'bg-[#fb923c] text-black border-black',
          dot: 'bg-black',
          title: 'Vulnerable',
        };
      case 'NT':
        return {
          bg: 'bg-[#eab308] text-black border-black',
          dot: 'bg-black',
          title: 'Near Threatened',
        };
      case 'LC':
        return {
          bg: 'bg-[#34d399] text-black border-black',
          dot: 'bg-black',
          title: 'Least Concern',
        };
      case 'DOMESTIC':
        return {
          bg: 'bg-[#f472b6] text-black border-black',
          dot: 'bg-black',
          title: 'Domesticated',
        };
      default:
        return {
          bg: 'bg-[#1d1922] text-[#fdf2f8] border-black',
          dot: 'bg-[#9e94a4]',
          title: 'Unassessed',
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-black border-2 shadow-brutal-sm ${style.bg} ${className}`}
      title={style.title}
    >
      <span className={`w-1.5 h-1.5 ${style.dot} animate-pulse`} />
      <span>{code}</span>
      {showTitle && <span className="font-bold opacity-90">· {style.title}</span>}
    </span>
  );
};
