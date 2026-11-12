import React, { useState } from 'react';
import { CatalogMeta } from '../../types';

/**
 * Measured real-photo sweep from Documentation/Breed-Validation.md
 * (n = 86 audited Wikimedia Commons photos, TTA enabled, margin = 0.10).
 */
const BREED_THRESHOLD_SWEEP = [
  { floor: 0.40, asserted: 50, correct: 38, wrong: 12, coverage: 58.1, precision: 76.0 },
  { floor: 0.45, asserted: 48, correct: 37, wrong: 11, coverage: 55.8, precision: 77.1 },
  { floor: 0.50, asserted: 44, correct: 36, wrong: 8, coverage: 51.2, precision: 81.8 },
  { floor: 0.60, asserted: 37, correct: 31, wrong: 6, coverage: 43.0, precision: 83.8 },
  { floor: 0.70, asserted: 36, correct: 31, wrong: 5, coverage: 41.9, precision: 86.1 },
  { floor: 0.80, asserted: 32, correct: 28, wrong: 4, coverage: 37.2, precision: 87.5 },
  { floor: 0.90, asserted: 18, correct: 18, wrong: 0, coverage: 20.9, precision: 100.0 },
  { floor: 0.95, asserted: 11, correct: 11, wrong: 0, coverage: 12.8, precision: 100.0 },
];

const OUTCOME_SEGMENTS = [
  { label: 'Asserted match', count: 32, pct: 37.2, colorClass: 'bg-felid-cobalt-line', dotClass: 'bg-felid-cobalt-line' },
  { label: 'Low confidence abstention', count: 36, pct: 41.9, colorClass: 'bg-felid-muted', dotClass: 'bg-felid-muted' },
  { label: 'Outside curated catalogue', count: 10, pct: 11.6, colorClass: 'bg-felid-highlight-line', dotClass: 'bg-felid-highlight-line' },
  { label: 'Generic coat class', count: 8, pct: 9.3, colorClass: 'bg-felid-pomegranate-line', dotClass: 'bg-felid-pomegranate-line' },
];

export const PipelineFlowDiagram: React.FC = () => {
  const stages = [
    { step: '01', name: 'Ingest & EXIF', detail: 'Pillow MIME, ≥48px, EXIF strip', outcome: '4xx invalid' },
    { step: '02', name: 'Quality Gate', detail: 'Laplacian blur, exposure, contrast', outcome: 'abstain' },
    { step: '03', name: 'Dual Feline Gate', detail: 'MobileNetV2 + BioCLIP agreement', outcome: 'non_feline' },
    { step: '04', name: 'BioCLIP Ranking', detail: 'ViT-B/16 cosine vs 41 taxa', outcome: 'similarity' },
    { step: '05', name: 'Taxonomy Policy', detail: 'Drop hybrids, floor + margin check', outcome: 'unable_to_identify' },
    { step: '06', name: 'Breed ViT (opt.)', detail: 'Felis catus only · 0.80 / 0.10', outcome: 'visual match' },
  ];

  return (
    <figure className="journal-inset p-4 space-y-3" aria-label="Identification pipeline flow">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-felid-muted-ink">
        <span className="uppercase tracking-wider font-medium text-felid-ink">
          Figure 1 · Sequential Gate &amp; Abstention Pipeline
        </span>
        <span>Any gate may terminate without forcing a species</span>
      </figcaption>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stages.map((s) => (
          <div
            key={s.step}
            className="bg-felid-surface border border-felid-border rounded-sm p-3.5 flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-medium text-felid-cobalt-ink whitespace-nowrap">
                § {s.step}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-felid-elevated text-felid-muted-ink border border-felid-border whitespace-nowrap">
                {s.outcome}
              </span>
            </div>
            <div>
              <div className="font-display font-semibold text-sm text-felid-ink leading-snug">
                {s.name}
              </div>
              <p className="text-xs font-sans text-felid-muted-ink mt-0.5 leading-snug">
                {s.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
};

export const BreedValidationChart: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number>(5); // Default to shipped 0.80 floor
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const activePoint = BREED_THRESHOLD_SWEEP[activeIdx];

  // SVG coordinate space
  const width = 640;
  const height = 240;
  const pad = { top: 20, right: 24, bottom: 38, left: 44 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const xFor = (i: number) =>
    pad.left + (i / (BREED_THRESHOLD_SWEEP.length - 1)) * plotW;
  const yFor = (pct: number) => pad.top + ((100 - pct) / 100) * plotH;

  const precisionPath = BREED_THRESHOLD_SWEEP.map(
    (d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(d.precision).toFixed(1)}`,
  ).join(' ');
  const coveragePath = BREED_THRESHOLD_SWEEP.map(
    (d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(d.coverage).toFixed(1)}`,
  ).join(' ');

  const shippedX = xFor(5);

  return (
    <figure className="journal-inset p-4 sm:p-5 space-y-4" aria-label="Breed validation threshold trade-off chart">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <figcaption className="text-[11px] font-mono font-medium uppercase tracking-wider text-felid-ink">
            Figure 2 · Breed Confidence Threshold vs. Precision &amp; Coverage (n = 86 Photos)
          </figcaption>
          <p className="text-xs text-felid-muted-ink font-sans mt-0.5">
            Measured on audited Commons photos with test-time augmentation (margin 0.10). Hover or select a point to inspect counts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1.5 text-felid-cobalt-ink">
            <span className="w-2.5 h-0.5 bg-felid-cobalt-line inline-block" /> Precision (%)
          </span>
          <span className="inline-flex items-center gap-1.5 text-felid-pomegranate-ink">
            <span className="w-2.5 h-0.5 bg-felid-pomegranate-line inline-block" /> Fire rate (%)
          </span>
          <span className="inline-flex items-center gap-1.5 text-felid-highlight-ink">
            <span className="w-2 h-2 rounded-full bg-felid-highlight-line inline-block" /> Shipped 0.80
          </span>
        </div>
      </div>

      <div className="relative bg-felid-surface border border-felid-border rounded-sm p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label="Line chart plotting precision and fire rate across confidence thresholds 0.40 to 0.95"
        >
          {/* Horizontal percentage gridlines */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  className="stroke-felid-border"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-felid-muted-ink font-mono text-[10px]"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Vertical marker for shipped 0.80 floor */}
          <line
            x1={shippedX}
            y1={pad.top}
            x2={shippedX}
            y2={height - pad.bottom}
            className="stroke-felid-highlight-line/80"
            strokeDasharray="4 3"
            strokeWidth="1.5"
          />

          {/* Coverage / fire rate curve */}
          <path
            d={coveragePath}
            fill="none"
            className="stroke-felid-pomegranate-line"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Precision curve */}
          <path
            d={precisionPath}
            fill="none"
            className="stroke-felid-cobalt-line"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive nodes + X-axis labels */}
          {BREED_THRESHOLD_SWEEP.map((d, i) => {
            const x = xFor(i);
            const yP = yFor(d.precision);
            const yC = yFor(d.coverage);
            const isSelected = i === activeIdx;
            const isShipped = d.floor === 0.80;

            return (
              <g key={d.floor}>
                {isSelected && (
                  <line
                    x1={x}
                    y1={pad.top}
                    x2={x}
                    y2={height - pad.bottom}
                    className="stroke-felid-border-strong"
                    strokeWidth="1"
                  />
                )}

                <circle
                  cx={x}
                  cy={yC}
                  r={isSelected ? 5 : 3.5}
                  className="fill-felid-surface stroke-felid-pomegranate-line"
                  strokeWidth="2"
                />

                <circle
                  cx={x}
                  cy={yP}
                  r={isSelected ? 5.5 : 4}
                  className={
                    isShipped
                      ? 'fill-felid-highlight-line stroke-felid-surface'
                      : 'fill-felid-surface stroke-felid-cobalt-line'
                  }
                  strokeWidth="2"
                />

                <text
                  x={x}
                  y={height - 14}
                  textAnchor="middle"
                  className={`font-mono text-[10px] ${
                    isSelected ? 'fill-felid-ink font-medium' : 'fill-felid-muted-ink'
                  }`}
                >
                  {d.floor.toFixed(2)}
                </text>

                {focusedIdx === i && (
                  <rect
                    x={x - 19}
                    y={pad.top - 2}
                    width={38}
                    height={plotH + 26}
                    rx={2}
                    fill="none"
                    className="stroke-felid-cobalt"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                )}

                {/* Invisible accessible hit target */}
                <rect
                  x={x - 22}
                  y={pad.top}
                  width={44}
                  height={plotH + 26}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`Threshold ${d.floor.toFixed(2)}: ${d.precision}% precision, ${d.coverage}% fire rate (${d.correct} of ${d.asserted} correct)`}
                  className="cursor-pointer focus:outline-none"
                  onMouseEnter={() => setActiveIdx(i)}
                  onFocus={() => {
                    setActiveIdx(i);
                    setFocusedIdx(i);
                  }}
                  onBlur={() => setFocusedIdx((prev) => (prev === i ? null : prev))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveIdx(i);
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      setActiveIdx((prev) => Math.min(BREED_THRESHOLD_SWEEP.length - 1, prev + 1));
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      setActiveIdx((prev) => Math.max(0, prev - 1));
                    }
                  }}
                  onClick={() => setActiveIdx(i)}
                />
              </g>
            );
          })}
        </svg>

        {/* Theme-aware interactive readout tooltip bar */}
        <div
          role="status"
          className="mt-2 pt-2.5 border-t border-felid-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-felid-elevated border border-felid-border text-felid-ink font-medium">
              Floor {activePoint.floor.toFixed(2)}
              {activePoint.floor === 0.80 ? ' (Shipped default)' : ''}
            </span>
            <span className="text-felid-muted-ink">
              {activePoint.asserted}/86 asserted ({activePoint.correct} right, {activePoint.wrong} wrong)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-felid-cobalt-ink font-medium">
              Precision {activePoint.precision.toFixed(1)}%
            </span>
            <span className="text-felid-pomegranate-ink font-medium">
              Coverage {activePoint.coverage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Outcome breakdown stacked bar at shipped threshold */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-felid-muted-ink">
          <span>Disposition of 86 validation images at 0.80 / 0.10</span>
          <span>Top-1: 53.5% · Top-3: 75.6%</span>
        </div>
        <div className="h-3 w-full rounded-sm overflow-hidden border border-felid-border flex bg-felid-surface">
          {OUTCOME_SEGMENTS.map((seg) => (
            <div
              key={seg.label}
              className={`${seg.colorClass} h-full`}
              style={{ width: `${seg.pct}%` }}
              title={`${seg.label}: ${seg.count}/86 (${seg.pct}%)`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-mono text-felid-muted-ink">
          {OUTCOME_SEGMENTS.map((seg) => (
            <span key={seg.label} className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${seg.dotClass}`} />
              <span>
                {seg.label}: <strong className="text-felid-ink font-medium">{seg.count}</strong> ({seg.pct}%)
              </span>
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
};

export const CatalogCompositionChart: React.FC<{ meta: CatalogMeta | null }> = ({ meta }) => {
  const wild = meta?.wild_species_count ?? 40;
  const domestic = meta?.domestic_species_count ?? 1;
  const breeds = meta?.breed_count ?? 22;
  const hybrids = meta?.hybrid_count ?? 4;
  const maxVal = Math.max(wild, breeds, domestic, hybrids, 1);

  const rows = [
    {
      label: 'Wild Species',
      note: '40 extant wild felids (species pool)',
      count: wild,
      barClass: 'bg-felid-cobalt-line',
      textClass: 'text-felid-cobalt-ink',
    },
    {
      label: 'Domestic Species',
      note: 'Felis catus (species pool)',
      count: domestic,
      barClass: 'bg-felid-pomegranate-line',
      textClass: 'text-felid-pomegranate-ink',
    },
    {
      label: 'CFA Breeds',
      note: 'Sub-species registry (no species XP)',
      count: breeds,
      barClass: 'bg-felid-highlight-line',
      textClass: 'text-felid-highlight-ink',
    },
    {
      label: 'Hybrid Crosses',
      note: 'Excluded from counts & inference',
      count: hybrids,
      barClass: 'bg-felid-muted',
      textClass: 'text-felid-muted-ink',
    },
  ];

  return (
    <figure className="journal-inset p-4 space-y-3" aria-label="Taxonomic stratum composition chart">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-felid-muted-ink">
        <span className="uppercase tracking-wider font-medium text-felid-ink">
          Figure 3 · Catalogue Separation by Taxonomic Stratum
        </span>
        <span>Breeds &amp; hybrids never inflate the {wild + domestic}-species count</span>
      </figcaption>

      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-felid-ink font-medium">
                {row.label}{' '}
                <span className="text-felid-muted-ink font-normal font-sans text-[11px]">
                  — {row.note}
                </span>
              </span>
              <span className={`font-medium ${row.textClass}`}>{row.count}</span>
            </div>
            <div className="h-2 w-full bg-felid-surface border border-felid-border rounded-sm overflow-hidden">
              <div
                className={`h-full ${row.barClass} transition-all duration-500`}
                style={{ width: `${Math.max(3, Math.round((row.count / maxVal) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
};
