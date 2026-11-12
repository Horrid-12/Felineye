import React from 'react';

interface EmblemProps {
  className?: string;
}

/**
 * Artisanal geometric felid-eye & 8-point Iznik rosette medallion.
 * Uses CSS-token-aware Cobalt, Pomegranate, and Burnished Gold fills/strokes.
 */
export const FelineyeEmblem: React.FC<EmblemProps> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Outer archival folio square frame with chamfered corner ticks */}
    <rect
      x="2.5"
      y="2.5"
      width="31"
      height="31"
      rx="3"
      className="stroke-felid-border-strong fill-felid-surface"
      strokeWidth="1.25"
    />
    {/* Subtle 8-point geometric star corners in Burnished Gold */}
    <path
      d="M6.5 6.5L9 9M29.5 6.5L27 9M6.5 29.5L9 27M29.5 29.5L27 27"
      className="stroke-felid-highlight"
      strokeWidth="1.15"
      strokeLinecap="round"
    />
    {/* Felid almond eye silhouette in Royal Cobalt */}
    <path
      d="M6.5 18C9.8 12.6 13.8 10.5 18 10.5C22.2 10.5 26.2 12.6 29.5 18C26.2 23.4 22.2 25.5 18 25.5C13.8 25.5 9.8 23.4 6.5 18Z"
      className="stroke-felid-cobalt-line fill-felid-cobalt/15"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Vertical slit iris in Cobalt */}
    <ellipse
      cx="18"
      cy="18"
      rx="2.2"
      ry="5.1"
      className="fill-felid-cobalt"
    />
    {/* Pomegranate iris glint */}
    <circle cx="18" cy="18" r="1.0" className="fill-felid-pomegranate" />
    {/* Burnished Gold catchlight */}
    <circle cx="19.3" cy="15.8" r="1" className="fill-felid-highlight" />
  </svg>
);

interface RuleProps {
  className?: string;
}

/**
 * Editorial hairline divider with a restrained Cobalt, Pomegranate & Gold diamond motif.
 */
export const BotanicalRule: React.FC<RuleProps> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
    <div className="h-px flex-1 bg-felid-border" />
    <svg
      viewBox="0 0 28 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-7 h-3 shrink-0 text-felid-highlight"
    >
      <path
        d="M14 1L18.5 6L14 11L9.5 6L14 1Z"
        stroke="currentColor"
        strokeWidth="1.1"
        className="fill-felid-highlight/15"
      />
      <circle cx="4" cy="6" r="1.25" className="fill-felid-cobalt/75" />
      <circle cx="24" cy="6" r="1.25" className="fill-felid-pomegranate/75" />
    </svg>
    <div className="h-px flex-1 bg-felid-border" />
  </div>
);

interface CornersProps {
  colorClass?: string;
}

/**
 * Delicate optical specimen plate corner brackets.
 */
export const SpecimenCorners: React.FC<CornersProps> = ({
  colorClass = 'border-felid-highlight/70',
}) => (
  <>
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-2 left-2 w-3 h-3 border-t border-l ${colorClass}`}
    />
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-2 right-2 w-3 h-3 border-t border-r ${colorClass}`}
    />
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-2 left-2 w-3 h-3 border-b border-l ${colorClass}`}
    />
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-2 right-2 w-3 h-3 border-b border-r ${colorClass}`}
    />
  </>
);
