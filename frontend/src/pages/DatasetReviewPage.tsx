import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  X,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ImageOff,
  RefreshCw,
  CircleDot,
  ClipboardCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetCandidate, DatasetStats, DatasetGaps } from '../types';
import { AlertBanner, PageHeader } from '../components/ui/JournalPrimitives';

const SELECT_CLS =
  'ml-1.5 bg-felid-surface border border-felid-border-strong rounded-sm px-2.5 py-1.5 text-xs font-mono text-felid-ink focus:outline-none focus:border-felid-cobalt focus:ring-1 focus:ring-felid-cobalt';
const CARD = 'journal-plate p-4';
const ICON_BTN =
  'p-2 bg-felid-surface border border-felid-border-strong rounded-sm text-felid-ink hover:bg-felid-hover hover:border-felid-cobalt/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt';
const LABEL = 'text-[10px] font-mono font-medium uppercase tracking-wider';

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  pending: {
    pill: 'bg-felid-elevated text-felid-muted-ink border-felid-border-strong',
    dot: 'bg-felid-muted',
  },
  verified: {
    pill: 'bg-felid-cobalt/15 text-felid-cobalt-ink border-felid-cobalt/45',
    dot: 'bg-felid-cobalt-line',
  },
  rejected: {
    pill: 'bg-felid-pomegranate/15 text-felid-pomegranate-ink border-felid-pomegranate/45',
    dot: 'bg-felid-pomegranate-line',
  },
  ambiguous: {
    pill: 'bg-felid-highlight/15 text-felid-highlight-ink border-felid-highlight/50',
    dot: 'bg-felid-highlight-line',
  },
  contested: {
    pill: 'bg-felid-pomegranate text-felid-on-pomegranate border-felid-pomegranate',
    dot: 'bg-felid-on-pomegranate',
  },
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-sm font-mono text-[10px] font-medium uppercase ${style.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};

interface StatsProps {
  stats: DatasetStats | null;
  session: string;
  onStats: (s: DatasetStats) => void;
}

export const DatasetDashboard: React.FC<StatsProps> = ({ stats, session, onStats }) => {
  const [breeds, setBreeds] = useState<string[]>([]);
  const [filterBreed, setFilterBreed] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterReviewState, setFilterReviewState] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [items, setItems] = useState<DatasetCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<DatasetGaps | null>(null);

  const refreshStats = useCallback(() => {
    api
      .getDatasetStats(session)
      .then((s) => {
        onStats(s);
        setBreeds(Object.keys(s.per_breed));
      })
      .catch(() => undefined);
    api
      .getDatasetGaps(session)
      .then((g) => setGaps(g))
      .catch(() => undefined);
  }, [session, onStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getDatasetCandidates(session, {
        breed: filterBreed || undefined,
        status: filterStatus || undefined,
        review_state: filterReviewState || undefined,
        source: filterSource || undefined,
        page: 1,
        page_size: 100,
      })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [session, filterBreed, filterStatus, filterReviewState, filterSource]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const base = {
      reviewed: 0,
      unreviewed: 0,
      awaiting_second: 0,
      mine: 0,
      verified: 0,
      rejected: 0,
      ambiguous: 0,
      contested: 0,
      pending: 0,
    };
    if (!stats) return null;
    return Object.values(stats.per_breed).reduce(
      (acc, b) => ({
        reviewed: acc.reviewed + (b.reviewed ?? 0),
        unreviewed: acc.unreviewed + (b.unreviewed ?? 0),
        awaiting_second: acc.awaiting_second + (b.awaiting_second ?? 0),
        mine: acc.mine + (b.mine ?? 0),
        verified: acc.verified + b.verified,
        rejected: acc.rejected + b.rejected,
        ambiguous: acc.ambiguous + b.ambiguous,
        contested: acc.contested + b.contested,
        pending: acc.pending + b.pending,
      }),
      base,
    );
  }, [stats]);

  const cards: Array<[string, number | undefined, string]> = [
    ['TOTAL', stats?.total, 'text-felid-ink'],
    ['UNREVIEWED', totals?.unreviewed, 'text-felid-ink'],
    ['AWAITING REVIEW', totals?.awaiting_second, 'text-felid-highlight-ink'],
    ['YOUR DECISIONS', totals?.mine, 'text-felid-cobalt-ink'],
    ['VERIFIED', totals?.verified, 'text-felid-cobalt-ink'],
    ['REJECTED', totals?.rejected, 'text-felid-pomegranate-ink'],
    ['AMBIGUOUS', totals?.ambiguous, 'text-felid-highlight-ink'],
    ['CONTESTED', totals?.contested, 'text-felid-pomegranate-ink'],
  ];
  const required = stats?.required_reviewers ?? 1;

  return (
    <section aria-label="Review dashboard" className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3" data-testid="review-stats">
        {cards.map(([label, value, color]) => (
          <div key={label} className="journal-plate p-3">
            <div className={`${LABEL} text-felid-muted-ink`}>{label}</div>
            <div className={`font-mono text-2xl font-medium mt-1 ${color}`}>{value ?? '—'}</div>
          </div>
        ))}
      </div>

      <AlertBanner tone="info">
        <span className="text-xs font-sans">
          {required === 1 ? (
            <>
              One reviewer decides. Approval records <b className="text-felid-ink">verified</b>, rejection{' '}
              <b className="text-felid-ink">rejected</b>, ambiguity <b className="text-felid-ink">ambiguous</b>.
              If a different reviewer later disagrees, the row becomes <b className="text-felid-ink">contested</b>{' '}
              — never auto-resolved.
            </>
          ) : (
            <>
              A verdict needs <b className="text-felid-ink">{required} distinct reviewers</b> to agree. Until then the
              row stays <b className="text-felid-ink">pending</b> and appears under{' '}
              <b className="text-felid-ink">awaiting review</b> / <b className="text-felid-ink">your decisions</b>.
            </>
          )}
        </span>
      </AlertBanner>

      <div className="journal-plate p-3.5 flex flex-wrap gap-3 items-center">
        <label className="text-xs font-mono text-felid-muted-ink">
          Breed
          <select
            data-testid="filter-breed"
            value={filterBreed}
            onChange={(e) => setFilterBreed(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">All</option>
            {breeds.map((b) => (
              <option key={b} value={b}>
                {b.replace(/-/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-mono text-felid-muted-ink">
          Verdict
          <select
            data-testid="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">All</option>
            {['pending', 'verified', 'rejected', 'ambiguous', 'contested'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-mono text-felid-muted-ink">
          Progress
          <select
            data-testid="filter-review-state"
            value={filterReviewState}
            onChange={(e) => setFilterReviewState(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">All</option>
            <option value="unreviewed">unreviewed</option>
            <option value="awaiting_second">awaiting 2nd reviewer</option>
            <option value="mine">decided by me</option>
            <option value="not_mine">not decided by me</option>
          </select>
        </label>
        <label className="text-xs font-mono text-felid-muted-ink">
          Source
          <select
            data-testid="filter-source"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">All</option>
            <option value="wikimedia-commons">wikimedia-commons</option>
          </select>
        </label>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-felid-cobalt-ink">
            {total} candidates
          </span>
          <button
            type="button"
            onClick={() => {
              refreshStats();
              load();
            }}
            className={ICON_BTN}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {stats && (
        <div className="journal-plate p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className={`${LABEL} text-felid-muted-ink`}>PER-BREED PROGRESS</h3>
            <div className="flex items-center gap-3 text-[11px] font-mono text-felid-muted-ink">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2 rounded-sm bg-felid-cobalt-line inline-block" aria-hidden="true" />
                verified
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2 rounded-sm bg-felid-muted/55 inline-block" aria-hidden="true" />
                reviewed
              </span>
            </div>
          </div>
          <div className="space-y-3.5">
            {Object.entries(stats.per_breed).map(([breed, v]) => {
              const reviewed = v.reviewed ?? 0;
              const awaiting = v.awaiting_second ?? 0;
              const reviewedPct = Math.round((reviewed / Math.max(1, v.total)) * 100);
              const verifiedPct = Math.round((v.verified / Math.max(1, v.total)) * 100);
              return (
                <div key={breed} className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display font-semibold text-sm text-felid-ink capitalize w-44">
                      {breed.replace(/-/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-felid-muted-ink ml-auto">
                      {reviewed}/{v.total} reviewed · {awaiting} awaiting review · {v.verified} verified · {v.pending} pending
                    </span>
                  </div>
                  <div className="relative h-2 bg-felid-elevated border border-felid-border rounded-sm overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-felid-muted/55"
                      style={{ width: `${reviewedPct}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 bg-felid-cobalt-line"
                      style={{ width: `${verifiedPct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] font-mono text-felid-muted-ink">
                    <span>approve {Math.round(v.approval_rate * 100)}%</span>
                    <span>reject {Math.round(v.rejection_rate * 100)}%</span>
                    <span>ambiguous {Math.round(v.ambiguity_rate * 100)}%</span>
                    <span className="text-felid-pomegranate-ink">{v.contested} contested</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gaps && (
        <div className="journal-plate p-4" data-testid="collection-gap">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className={`${LABEL} text-felid-muted-ink`}>COLLECTION GAP · ROUND 2</h3>
            <span className="text-[11px] font-mono text-felid-muted-ink">
              target {gaps.target_per_breed} eligible / breed · {gaps.total_remaining} still needed
            </span>
          </div>
          <div className="space-y-3.5">
            {gaps.priority_order.map((breed) => {
              const g = gaps.per_breed[breed];
              if (!g) return null;
              const pct = Math.min(100, Math.round((g.eligible / Math.max(1, g.target)) * 100));
              const topPriority = g.priority_tier === 1;
              return (
                <div key={breed} className="space-y-1.5" data-testid={`gap-${breed}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-semibold text-sm text-felid-ink capitalize w-44">
                      {breed.replace(/-/g, ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 border rounded-sm font-mono text-[10px] font-medium uppercase ${
                        topPriority
                          ? 'bg-felid-highlight/20 text-felid-highlight-ink border-felid-highlight/50'
                          : 'bg-felid-elevated text-felid-muted-ink border-felid-border'
                      }`}
                    >
                      {topPriority ? 'priority' : `tier ${g.priority_tier ?? '—'}`}
                    </span>
                    <span className="text-xs font-mono text-felid-muted-ink ml-auto">
                      {g.eligible}/{g.target} eligible ·{' '}
                      <b className={g.remaining ? 'text-felid-highlight-ink font-medium' : 'text-felid-cobalt-ink font-medium'}>
                        {g.remaining ? `${g.remaining} to go` : 'target met'}
                      </b>
                    </span>
                  </div>
                  <div className="relative h-2 bg-felid-elevated border border-felid-border rounded-sm overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 ${
                        g.remaining ? 'bg-felid-highlight-line' : 'bg-felid-cobalt-line'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] font-mono text-felid-muted-ink">
                    <span>{g.collected} collected</span>
                    <span>{g.verified} verified</span>
                    <span>{g.rejected} rejected</span>
                    <span>{g.ambiguous} ambiguous</span>
                    <span>{g.pending} pending</span>
                    <span>{g.excluded_non_photographic} non-photo excluded</span>
                    <span className="text-felid-cobalt-ink">
                      {g.estimated_candidates_needed == null
                        ? 'yield unknown — collect a sample'
                        : `~${g.estimated_candidates_needed} new candidates`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] font-mono text-felid-muted-ink leading-relaxed">
            Eligible = verified animal/historical photograph. Rejected, ambiguous, pending and
            non-photographic assets are excluded. Estimates use the pilot yield (
            {gaps.total_eligible} eligible from{' '}
            {Object.values(gaps.per_breed).reduce((n, b) => n + b.decided, 0)} decided).
          </p>
        </div>
      )}

      <div className="journal-plate overflow-hidden" data-testid="candidate-table">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-felid-border bg-felid-elevated/60">
          <h3 className={`${LABEL} text-felid-muted-ink`}>CANDIDATES</h3>
          <span className="text-[11px] font-mono text-felid-muted-ink">{items.length} shown</span>
        </div>
        {items.length === 0 ? (
          <p className="p-4 text-xs font-mono text-felid-muted-ink">
            {loading ? 'Loading…' : 'No candidates match these filters.'}
          </p>
        ) : (
          <ul className="divide-y divide-felid-border max-h-[420px] overflow-auto">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-2.5 px-4 py-2.5 hover:bg-felid-hover/70 transition-colors"
              >
                <StatusPill status={c.status} />
                <span className="font-mono text-[11px] text-felid-muted-ink">{c.id.slice(0, 10)}</span>
                <span className="text-xs font-sans font-medium text-felid-ink truncate max-w-[22rem]">
                  {c.title}
                </span>
                <span className="text-[11px] font-mono text-felid-muted-ink uppercase">
                  {c.breed_id.replace(/-/g, ' ')}
                </span>
                <span className="text-[11px] font-mono text-felid-muted-ink">{c.asset_type}</span>
                {!!c.quality_flags?.length && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border border-felid-highlight/60 text-felid-highlight-ink bg-felid-highlight/10 uppercase"
                    title="Detected by the collection quality audit; review before approving."
                  >
                    {c.quality_flags.join(' · ')}
                  </span>
                )}
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
                    c.training_eligible
                      ? 'bg-felid-cobalt/15 text-felid-cobalt-ink border-felid-cobalt/35'
                      : 'bg-felid-elevated text-felid-muted-ink border-felid-border'
                  }`}
                >
                  {c.training_eligible ? 'training-eligible' : c.exclusion_reason || 'not eligible'}
                </span>
                {c.my_decision && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-felid-elevated border border-felid-border text-felid-cobalt-ink">
                    you: {c.my_decision}
                  </span>
                )}
                {c.review_count ? (
                  <span className="text-[11px] font-mono text-felid-muted-ink ml-auto">
                    {c.review_count}/{required} reviews
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-felid-muted-ink ml-auto flex items-center gap-1">
                    <CircleDot className="w-3 h-3" /> untouched
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

interface WorkspaceProps {
  session: string;
  reviewer: string;
  breed: string;
  required: number;
  onDecided?: () => void;
}

export const DatasetReviewWorkspace: React.FC<WorkspaceProps> = ({
  session,
  reviewer,
  breed,
  required,
  onDecided,
}) => {
  const [allItems, setAllItems] = useState<DatasetCandidate[]>([]);
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [reason, setReason] = useState('');
  const [assetType, setAssetType] = useState('unknown');
  const [message, setMessage] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState('');
  const [includeMine, setIncludeMine] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api
      .getDatasetCandidates(session, { breed, page: 1, page_size: 100 })
      .then((r) => {
        setAllItems(r.items);
      })
      .catch(() => undefined);
  }, [session, breed]);

  useEffect(() => {
    setIndex(0);
    load();
  }, [load]);

  // Default: only show images this reviewer has not decided on, so the queue
  // actually shrinks as you work instead of looping over the same rows.
  const items = useMemo(
    () => (includeMine ? allItems : allItems.filter((c) => !c.my_decision)),
    [allItems, includeMine],
  );

  useEffect(() => {
    setIndex((i) => Math.max(0, Math.min(i, items.length - 1)));
  }, [items.length]);

  const current = items[index] as DatasetCandidate | undefined;

  useEffect(() => {
    setAssetType(current?.asset_type || 'unknown');
  }, [current?.id]);

  // Load the protected image via fetch so the Bearer session is sent.
  useEffect(() => {
    const url = current?.image_url;
    if (!url) {
      setImageSrc('');
      setImageError('');
      return;
    }
    let cancelled = false;
    let objectUrl = '';
    fetch(url, { headers: { Authorization: `Bearer ${session}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
        setImageError('');
      })
      .catch((err) => {
        if (!cancelled) {
          setImageSrc('');
          setImageError(
            `Image failed to load (${err instanceof Error ? err.message : 'error'}).`,
          );
        }
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [current?.image_url, session]);

  const submit = useCallback(
    async (decision: 'approved' | 'rejected' | 'ambiguous') => {
      if (!current || submitting) return;
      if (decision !== 'approved' && !reason.trim()) {
        setMessage('A reason is required for rejection and ambiguous decisions.');
        return;
      }
      setSubmitting(true);
      try {
        const result = await api.submitDatasetReview(session, current.id.slice(0, 16), {
          decision,
          reason: reason.trim(),
          asset_type: assetType,
          expected_reviews: current.review_count ?? 0,
        });
        setReason('');
        setMessage(`Recorded ${decision} → ${result.status}.`);
        onDecided?.();
        const r = await api.getDatasetCandidates(session, {
          breed,
          page: 1,
          page_size: 100,
        });
        setAllItems(r.items);
        const nextItems = includeMine ? r.items : r.items.filter((c) => !c.my_decision);
        setIndex((i) => Math.max(0, Math.min(includeMine ? i + 1 : i, nextItems.length - 1)));
      } catch (err: any) {
        setMessage(err?.message || 'Submission failed.');
      } finally {
        setSubmitting(false);
      }
    },
    [current, reason, assetType, session, breed, includeMine, submitting, onDecided],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      if (e.key === 'a' || e.key === 'A') submit('approved');
      if (e.key === 'r' || e.key === 'R') submit('rejected');
      if (e.key === 'u' || e.key === 'U') submit('ambiguous');
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(items.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submit, items.length]);

  if (!current) {
    return (
      <section aria-label="Review workspace" className="space-y-4">
        <div className={`${CARD} text-center space-y-2 py-10`} data-testid="workspace-empty">
          <Check className="w-8 h-8 mx-auto text-felid-cobalt-ink" />
          <p className="font-display font-semibold text-base text-felid-ink">
            Queue complete for this filter
          </p>
          <p className="text-xs sm:text-sm font-sans text-felid-muted-ink">
            You have reviewed every candidate here. Switch breed, or include your decisions to revisit them.
          </p>
          <label className="inline-flex items-center gap-2 text-xs font-mono text-felid-muted-ink mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMine}
              onChange={(e) => setIncludeMine(e.target.checked)}
              className="accent-felid-cobalt"
            />
            <span>Include images I already reviewed ({allItems.length})</span>
          </label>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Review workspace" className="space-y-4">
      {/* Top Specimen Bar & Navigation Controls */}
      <div className="journal-plate p-3.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-felid-muted-ink">
            <span>
              Image {index + 1} of {items.length} ·{' '}
              <span className="text-felid-ink font-medium">{current.id.slice(0, 16)}</span>
            </span>
            <span className="px-1.5 py-0.5 bg-felid-elevated border border-felid-border rounded-sm text-[10px] uppercase text-felid-ink">
              {current.breed_id.replace(/-/g, ' ')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={current.status} />
            <span className="text-[11px] font-mono text-felid-muted-ink">
              {current.review_count ?? 0}/{required} reviews
            </span>
            {current.my_decision && (
              <span className="text-[11px] font-mono text-felid-cobalt-ink">
                you: {current.my_decision}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-xs font-mono text-felid-muted-ink mr-1 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMine}
              onChange={(e) => setIncludeMine(e.target.checked)}
              className="accent-felid-cobalt"
            />
            <span>include mine</span>
          </label>
          <button
            type="button"
            aria-label="Previous"
            className={ICON_BTN}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            className={ICON_BTN}
            onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Zoom out"
              className={ICON_BTN}
              onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              className={ICON_BTN}
              onClick={() => setScale((s) => Math.min(4, s + 0.25))}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setScale(1)}
              disabled={scale === 1}
              title={scale === 1 ? 'Original fit' : 'Reset zoom to 100%'}
              className={`text-xs font-mono w-12 text-right tabular-nums transition-colors ${
                scale === 1
                  ? 'text-felid-muted-ink cursor-default'
                  : 'text-felid-cobalt-ink hover:underline cursor-pointer'
              }`}
            >
              {Math.round(scale * 100)}%
            </button>
          </div>
        </div>
      </div>

      {/* High-efficiency Split Layout: Image Viewport Left + Immediate Decisions & Metadata Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Image Visibility Viewport */}
        <div
          className="xl:col-span-7 overflow-auto bg-felid-elevated/85 border border-felid-border-strong rounded-sm shadow-plate p-3 h-[440px] lg:h-[620px] flex"
          data-testid="image-preview"
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={current.title || 'candidate'}
              style={{
                width: scale === 1 ? 'auto' : `${scale * 100}%`,
                maxWidth: scale === 1 ? '100%' : 'none',
                maxHeight: scale === 1 ? '100%' : 'none',
              }}
              className="m-auto object-contain transition-[width] duration-150"
            />
          ) : (
            <div className="m-auto text-center space-y-2">
              <ImageOff className="w-8 h-8 mx-auto text-felid-muted-ink" />
              <p className="text-xs font-mono text-felid-muted-ink">
                {imageError || 'Loading protected image…'}
              </p>
            </div>
          )}
        </div>

        {/* Immediate Decision Controls + Structured Specimen Metadata */}
        <div className="xl:col-span-5 xl:sticky xl:top-20 space-y-4">
          {/* Action Deck (always visible at top of right column) */}
          <div className={`${CARD} space-y-3`}>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => submit('approved')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-felid-cobalt hover:bg-felid-cobalt-hover text-felid-on-cobalt font-mono font-medium text-xs rounded-sm border border-felid-cobalt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-felid-bg disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Approve (A)
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submit('rejected')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-felid-pomegranate hover:bg-felid-pomegranate-hover text-felid-on-pomegranate font-mono font-medium text-xs rounded-sm border border-felid-pomegranate transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-pomegranate focus-visible:ring-offset-2 focus-visible:ring-offset-felid-bg disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Reject (R)
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submit('ambiguous')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-felid-highlight hover:opacity-90 text-felid-on-highlight font-mono font-medium text-xs rounded-sm border border-felid-highlight transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-felid-bg disabled:opacity-50"
              >
                <HelpCircle className="w-4 h-4" /> Ambiguous (U)
              </button>
            </div>

            <label className="block text-xs font-mono text-felid-muted-ink">
              Reason (required for reject / ambiguous)
              <textarea
                data-testid="decision-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="journal-input mt-1.5 bg-felid-bg/50 font-sans text-sm"
                placeholder="Note crop, species mismatch, illustration, watermark..."
              />
            </label>

            {message && (
              <p className="text-xs font-mono text-felid-cobalt-ink" role="status">
                {message}
              </p>
            )}
            <p className="text-[11px] font-mono text-felid-muted-ink">
              {required === 1
                ? 'One reviewer decides. A conflicting second decision makes the row contested.'
                : `${required} distinct reviewers must agree. Mixed decisions stay contested.`}
            </p>
          </div>

          {/* Structured Specimen Metadata Card */}
          <dl className={`text-xs space-y-3 ${CARD}`}>
            <div className="pb-2.5 border-b border-felid-border flex items-start justify-between gap-2">
              <div>
                <dt className={`${LABEL} text-felid-muted-ink`}>Claimed breed (unverified)</dt>
                <dd className="font-display font-semibold text-base capitalize text-felid-ink mt-0.5">
                  {current.breed_id.replace(/-/g, ' ')}
                </dd>
              </div>
              <span
                className={`px-2 py-0.5 border rounded-sm font-mono text-[10px] font-medium ${
                  current.training_eligible
                    ? 'bg-felid-cobalt/15 text-felid-cobalt-ink border-felid-cobalt/35'
                    : 'bg-felid-elevated text-felid-muted-ink border-felid-border'
                }`}
              >
                {current.training_eligible ? 'training-eligible' : 'not training-eligible'}
              </span>
            </div>

            <div>
              <dt className={`${LABEL} text-felid-muted-ink`}>Asset type classification</dt>
              <dd className="mt-1 space-y-1">
                <select
                  data-testid="asset-type"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="journal-select w-full py-1.5 px-2.5 text-xs font-mono"
                  aria-label="Asset type"
                >
                  <option value="unknown">unknown</option>
                  <option value="animal_photograph">animal_photograph</option>
                  <option value="historical_photograph">historical_photograph</option>
                  <option value="scientific_illustration">scientific_illustration</option>
                  <option value="book_illustration">book_illustration</option>
                  <option value="painting_or_artwork">painting_or_artwork</option>
                  <option value="sculpture_or_artefact">sculpture_or_artefact</option>
                  <option value="diagram_or_infographic">diagram_or_infographic</option>
                  <option value="ai_generated">ai_generated</option>
                </select>
                {current.exclusion_reason && (
                  <span className="block text-felid-pomegranate-ink font-mono text-[11px]">
                    {current.exclusion_reason}
                  </span>
                )}
                {current.status === 'verified' && assetType === 'unknown' && (
                  <span className="block text-[11px] font-mono text-felid-highlight-ink">
                    Verified label, but not training-eligible — classify the asset as animal_photograph or historical_photograph.
                  </span>
                )}
              </dd>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <dt className={`${LABEL} text-felid-muted-ink`}>Source</dt>
                <dd className="text-felid-ink font-sans mt-0.5 break-words">
                  {current.title} · {current.source}
                </dd>
              </div>
              <div>
                <dt className={`${LABEL} text-felid-muted-ink`}>Author / licence</dt>
                <dd className="text-felid-ink/90 font-sans mt-0.5 break-words">
                  {current.author} · {current.license}
                </dd>
              </div>
              <div>
                <dt className={`${LABEL} text-felid-muted-ink`}>Resolution / size</dt>
                <dd className="font-mono text-felid-ink mt-0.5">
                  {current.width}×{current.height} · {current.bytes} B
                </dd>
              </div>
              <div>
                <dt className={`${LABEL} text-felid-muted-ink`}>Reviewing as</dt>
                <dd className="font-mono text-felid-ink mt-0.5">{reviewer}</dd>
              </div>
            </div>

            {current.special_check && (
              <div className="journal-inset p-2.5">
                <dt className={`${LABEL} text-felid-muted-ink`}>Special check</dt>
                <dd className="text-felid-cobalt-ink font-mono mt-0.5">{current.special_check}</dd>
              </div>
            )}

            <div>
              <dt className={`${LABEL} text-felid-muted-ink`}>SHA-256</dt>
              <dd className="font-mono text-[11px] text-felid-muted-ink break-all mt-0.5">
                {current.sha256}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export const DatasetReviewPage: React.FC = () => {
  const [reviewer, setReviewer] = useState('');
  const [session, setSession] = useState('');
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [tab, setTab] = useState<'dashboard' | 'review'>('dashboard');
  const [breed, setBreed] = useState('');
  const [error, setError] = useState('');

  const login = async () => {
    try {
      const r = await api.datasetLogin(reviewer);
      setSession(r.session);
      setError('');
    } catch (err: any) {
      const msg = err?.message || 'Login failed.';
      setError(
        err?.status === 503
          ? 'Backend has no REVIEWER_SESSION_SECRET configured. Set it in backend/.env or the backend process environment plus REVIEWER_NAMES, restart the backend, then sign in again.'
          : msg,
      );
    }
  };

  const refreshStats = async () => {
    try {
      setStats(await api.getDatasetStats(session));
    } catch {
      /* dashboard reload on next visit */
    }
  };

  return (
    <div className="py-2 space-y-6">
      <PageHeader
        kicker="BREED-V1 · Human Review"
        kickerIcon={<ClipboardCheck className="w-3.5 h-3.5" />}
        title={
          <>
            Dataset <span className="italic text-felid-cobalt-ink">Review</span>
          </>
        }
        subtitle={
          (stats?.required_reviewers ?? 1) === 1
            ? 'One reviewer decides. Nothing auto-approves.'
            : `${stats?.required_reviewers} reviewers must agree. Nothing auto-approves.`
        }
      />

      {!session ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login();
          }}
          className="journal-plate p-5 space-y-3 max-w-lg"
        >
          <div className="flex flex-wrap gap-3 items-end">
            <label className="block text-xs font-mono text-felid-muted-ink flex-1 min-w-[180px]">
              Reviewer handle
              <input
                data-testid="reviewer-input"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                className="journal-input mt-1.5 bg-felid-bg/50 font-mono text-sm"
              />
            </label>
            <button
              type="submit"
              className="btn-primary py-2.5 px-4 text-xs font-mono"
            >
              Sign in
            </button>
          </div>
          {error && <AlertBanner tone="error">{error}</AlertBanner>}
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('dashboard')}
                className={`px-3.5 py-2 font-mono font-medium text-xs rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt ${
                  tab === 'dashboard'
                    ? 'bg-felid-cobalt text-felid-on-cobalt border-felid-cobalt'
                    : 'bg-felid-surface text-felid-ink border-felid-border-strong hover:bg-felid-hover'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setTab('review')}
                className={`px-3.5 py-2 font-mono font-medium text-xs rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt ${
                  tab === 'review'
                    ? 'bg-felid-cobalt text-felid-on-cobalt border-felid-cobalt'
                    : 'bg-felid-surface text-felid-ink border-felid-border-strong hover:bg-felid-hover'
                }`}
              >
                Review workspace
              </button>
            </div>
            <label className="text-xs font-mono text-felid-muted-ink">
              Breed
              <select
                data-testid="workspace-breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="">All pilot breeds</option>
                {stats &&
                  Object.keys(stats.per_breed).map((b) => (
                    <option key={b} value={b}>
                      {b.replace(/-/g, ' ')}
                    </option>
                  ))}
              </select>
            </label>
            <span className="text-xs font-mono text-felid-muted-ink">
              signed in as <b className="text-felid-ink font-medium">{reviewer}</b>
            </span>
          </div>
          {tab === 'dashboard' ? (
            <DatasetDashboard stats={stats} session={session} onStats={setStats} />
          ) : (
            <DatasetReviewWorkspace
              session={session}
              reviewer={reviewer}
              breed={breed}
              required={stats?.required_reviewers ?? 1}
              onDecided={refreshStats}
            />
          )}
        </>
      )}
    </div>
  );
};
