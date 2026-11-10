import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check, X, HelpCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ImageOff,
  RefreshCw, AlertTriangle, CircleDot,
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetCandidate, DatasetStats } from '../types';

const SELECT_CLS =
  'ml-1 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm px-2 py-1 text-xs font-mono text-felid-ivory focus:outline-none';
const CARD = 'bg-[#141218] border-2 border-black shadow-brutal p-4';
const ICON_BTN =
  'p-1.5 bg-[#1d1922] border-2 border-black shadow-brutal-sm text-felid-ivory hover:bg-[#26222d] brutal-press';
const LABEL = 'text-[10px] font-mono font-bold uppercase tracking-wider';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-[#1d1922] text-felid-muted border-felid-border',
  verified: 'bg-felid-success/15 text-felid-success border-felid-success/50',
  rejected: 'bg-felid-danger/15 text-felid-danger border-felid-danger/50',
  ambiguous: 'bg-felid-warning/15 text-felid-warning border-felid-warning/50',
  contested: 'bg-felid-accent/15 text-felid-accent border-felid-accent/50',
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-block px-1.5 py-0.5 border font-mono text-[10px] font-bold uppercase ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>
    {status}
  </span>
);

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

  const refreshStats = useCallback(() => {
    api.getDatasetStats(session)
      .then((s) => { onStats(s); setBreeds(Object.keys(s.per_breed)); })
      .catch(() => undefined);
  }, [session, onStats]);

  useEffect(() => { refreshStats(); }, [refreshStats]);

  const load = useCallback(() => {
    setLoading(true);
    api.getDatasetCandidates(session, {
      breed: filterBreed || undefined,
      status: filterStatus || undefined,
      review_state: filterReviewState || undefined,
      source: filterSource || undefined,
      page: 1,
      page_size: 100,
    })
      .then((r) => { setItems(r.items); setTotal(r.total); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [session, filterBreed, filterStatus, filterReviewState, filterSource]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const base = { reviewed: 0, unreviewed: 0, awaiting_second: 0, mine: 0,
      verified: 0, rejected: 0, ambiguous: 0, contested: 0, pending: 0 };
    if (!stats) return null;
    return Object.values(stats.per_breed).reduce((acc, b) => ({
      reviewed: acc.reviewed + (b.reviewed ?? 0),
      unreviewed: acc.unreviewed + (b.unreviewed ?? 0),
      awaiting_second: acc.awaiting_second + (b.awaiting_second ?? 0),
      mine: acc.mine + (b.mine ?? 0),
      verified: acc.verified + b.verified,
      rejected: acc.rejected + b.rejected,
      ambiguous: acc.ambiguous + b.ambiguous,
      contested: acc.contested + b.contested,
      pending: acc.pending + b.pending,
    }), base);
  }, [stats]);

  const cards: Array<[string, number | undefined, string]> = [
    ['TOTAL', stats?.total, 'text-felid-ivory'],
    ['UNREVIEWED', totals?.unreviewed, 'text-felid-ivory'],
    ['AWAITING REVIEW', totals?.awaiting_second, 'text-felid-accent'],
    ['YOUR DECISIONS', totals?.mine, 'text-felid-ivory'],
    ['VERIFIED', totals?.verified, 'text-felid-success'],
    ['REJECTED', totals?.rejected, 'text-felid-danger'],
    ['AMBIGUOUS', totals?.ambiguous, 'text-felid-warning'],
    ['CONTESTED', totals?.contested, 'text-felid-accent'],
  ];
  const required = stats?.required_reviewers ?? 1;

  return (
    <section aria-label="Review dashboard" className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3" data-testid="review-stats">
        {cards.map(([label, value, color]) => (
          <div key={label} className="bg-[#141218] border-2 border-black shadow-brutal-sm p-3">
            <div className={`${LABEL} text-felid-muted`}>{label}</div>
            <div className={`font-display text-3xl font-black ${color}`}>{value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm p-3">
        <AlertTriangle className="w-4 h-4 shrink-0 text-felid-accent mt-0.5" />
        <p className="text-[11px] font-mono text-felid-muted">
          {required === 1 ? (
            <>
              One reviewer decides. Approval records <b className="text-felid-ivory">verified</b>, rejection
              <b className="text-felid-ivory"> rejected</b>, ambiguity <b className="text-felid-ivory">ambiguous</b>.
              If a different reviewer later disagrees, the row becomes <b className="text-felid-ivory">contested</b>
              — never auto-resolved.
            </>
          ) : (
            <>
              A verdict needs <b className="text-felid-ivory">{required} distinct reviewers</b> to agree. Until then the
              row stays <b className="text-felid-ivory">pending</b> and appears under
              <b className="text-felid-ivory"> awaiting review</b> / <b className="text-felid-ivory">your decisions</b>.
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end bg-[#141218] border-2 border-black shadow-brutal-sm p-3">
        <label className="text-xs font-mono text-felid-muted">Breed
          <select data-testid="filter-breed" value={filterBreed} onChange={(e) => setFilterBreed(e.target.value)} className={SELECT_CLS}>
            <option value="">All</option>{breeds.map((b) => <option key={b} value={b}>{b.replace(/-/g, ' ')}</option>)}
          </select></label>
        <label className="text-xs font-mono text-felid-muted">Verdict
          <select data-testid="filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={SELECT_CLS}>
            <option value="">All</option>{['pending', 'verified', 'rejected', 'ambiguous', 'contested'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select></label>
        <label className="text-xs font-mono text-felid-muted">Progress
          <select data-testid="filter-review-state" value={filterReviewState} onChange={(e) => setFilterReviewState(e.target.value)} className={SELECT_CLS}>
            <option value="">All</option>
            <option value="unreviewed">unreviewed</option>
            <option value="awaiting_second">awaiting 2nd reviewer</option>
            <option value="mine">decided by me</option>
            <option value="not_mine">not decided by me</option>
          </select></label>
        <label className="text-xs font-mono text-felid-muted">Source
          <select data-testid="filter-source" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className={SELECT_CLS}>
            <option value="">All</option><option value="wikimedia-commons">wikimedia-commons</option>
          </select></label>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-felid-accent">{total} candidates</span>
          <button type="button" onClick={() => { refreshStats(); load(); }} className={ICON_BTN} aria-label="Refresh dashboard">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {stats && (
        <div className="bg-[#0c0a0e] border-2 border-black shadow-brutal-sm p-4">
          <h3 className={`${LABEL} text-felid-muted mb-3`}>PER-BREED PROGRESS</h3>
          <div className="space-y-3">
            {Object.entries(stats.per_breed).map(([breed, v]) => {
              const reviewed = v.reviewed ?? 0;
              const awaiting = v.awaiting_second ?? 0;
              const reviewedPct = Math.round((reviewed / Math.max(1, v.total)) * 100);
              const verifiedPct = Math.round((v.verified / Math.max(1, v.total)) * 100);
              return (
                <div key={breed} className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display font-black text-xs text-felid-ivory uppercase w-44">{breed.replace(/-/g, ' ')}</span>
                    <span className="text-xs font-mono text-felid-muted ml-auto">
                      {reviewed}/{v.total} reviewed · {awaiting} awaiting review · {v.verified} verified · {v.pending} pending
                    </span>
                  </div>
                  <div className="relative h-2.5 bg-[#1d1922] border border-black overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-felid-accent/40" style={{ width: `${reviewedPct}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-felid-success" style={{ width: `${verifiedPct}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] font-mono text-felid-muted">
                    <span>approve {Math.round(v.approval_rate * 100)}%</span>
                    <span>reject {Math.round(v.rejection_rate * 100)}%</span>
                    <span>ambiguous {Math.round(v.ambiguity_rate * 100)}%</span>
                    <span className="text-felid-accent">{v.contested} contested</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-[#141218] border-2 border-black shadow-brutal" data-testid="candidate-table">
        <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#1d1922]">
          <h3 className={`${LABEL} text-felid-muted`}>CANDIDATES</h3>
          <span className="text-[10px] font-mono text-felid-muted">{items.length} shown</span>
        </div>
        {items.length === 0 ? (
          <p className="p-4 text-xs font-mono text-felid-muted">
            {loading ? 'Loading…' : 'No candidates match these filters.'}
          </p>
        ) : (
          <ul className="divide-y divide-black/60 max-h-[420px] overflow-auto">
            {items.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 px-3 py-2 hover:bg-[#1d1922]">
                <StatusPill status={c.status} />
                <span className="font-mono text-[10px] text-felid-muted">{c.id.slice(0, 10)}</span>
                <span className="text-xs font-mono text-felid-ivory truncate max-w-[22rem]">{c.title}</span>
                <span className="text-[10px] font-mono text-felid-muted uppercase">{c.breed_id.replace(/-/g, ' ')}</span>
                <span className="text-[10px] font-mono text-felid-muted">{c.asset_type}</span>
                <span className={`text-[10px] font-mono ${c.training_eligible ? 'text-felid-success' : 'text-felid-muted'}`}>
                  {c.training_eligible ? 'training-eligible' : (c.exclusion_reason || 'not eligible')}
                </span>
                {c.my_decision && (
                  <span className="text-[10px] font-mono text-felid-accent">you: {c.my_decision}</span>
                )}
                {c.review_count ? (
                  <span className="text-[10px] font-mono text-felid-muted ml-auto">{c.review_count}/2 reviews</span>
                ) : (
                  <span className="text-[10px] font-mono text-felid-muted ml-auto flex items-center gap-1">
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

export const DatasetReviewWorkspace: React.FC<WorkspaceProps> = ({ session, reviewer, breed, required, onDecided }) => {
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
    api.getDatasetCandidates(session, { breed, page: 1, page_size: 100 })
      .then((r) => { setAllItems(r.items); })
      .catch(() => undefined);
  }, [session, breed]);

  useEffect(() => { setIndex(0); load(); }, [load]);

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

  useEffect(() => { setAssetType(current?.asset_type || 'unknown'); }, [current?.id]);

  // Load the protected image via fetch so the Bearer session is sent;
  // a plain <img src> cannot carry headers and would 401 forever.
  useEffect(() => {
    const url = current?.image_url;
    if (!url) { setImageSrc(''); setImageError(''); return; }
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
        setImageSrc(objectUrl); setImageError('');
      })
      .catch((err) => { if (!cancelled) { setImageSrc(''); setImageError(`Image failed to load (${err instanceof Error ? err.message : 'error'}).`); } });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [current?.image_url, session]);

  const submit = useCallback(async (decision: 'approved' | 'rejected' | 'ambiguous') => {
    if (!current || submitting) return;
    if (decision !== 'approved' && !reason.trim()) {
      setMessage('A reason is required for rejection and ambiguous decisions.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.submitDatasetReview(session, current.id.slice(0, 16), {
        decision, reason: reason.trim(), asset_type: assetType,
        expected_reviews: current.review_count ?? 0,
      });
      setReason('');
      setMessage(`Recorded ${decision} → ${result.status}.`);
      onDecided?.();  // refresh dashboard stats live
      const r = await api.getDatasetCandidates(session, { breed, page: 1, page_size: 100 });
      setAllItems(r.items);
      // The decided row drops out of the queue (unless "include mine"), so the
      // next unreviewed image slides into the current index.
      const nextItems = includeMine ? r.items : r.items.filter((c) => !c.my_decision);
      setIndex((i) => Math.max(0, Math.min(includeMine ? i + 1 : i, nextItems.length - 1)));
    } catch (err: any) {
      setMessage(err?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }, [current, reason, assetType, session, breed, includeMine, submitting, onDecided]);

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
        <div className={`${CARD} text-center space-y-2`} data-testid="workspace-empty">
          <Check className="w-8 h-8 mx-auto text-felid-success" />
          <p className="font-display font-black text-sm uppercase text-felid-ivory">Queue complete for this filter</p>
          <p className="text-xs font-mono text-felid-muted">
            You have reviewed every candidate here. Switch breed, or include your decisions to revisit them.
          </p>
          <label className="inline-flex items-center gap-2 text-xs font-mono text-felid-muted mt-2">
            <input type="checkbox" checked={includeMine} onChange={(e) => setIncludeMine(e.target.checked)} className="accent-felid-accent" />
            Include images I already reviewed ({allItems.length})
          </label>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Review workspace" className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="space-y-1">
          <span className="text-xs font-mono text-felid-muted">
            Image {index + 1} of {items.length} · <span className="text-felid-ivory">{current.id.slice(0, 16)}</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={current.status} />
            <span className="text-[10px] font-mono text-felid-muted">{current.review_count ?? 0}/{required} reviews</span>
            {current.my_decision && (
              <span className="text-[10px] font-mono text-felid-accent">you: {current.my_decision}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 text-[10px] font-mono text-felid-muted">
            <input type="checkbox" checked={includeMine} onChange={(e) => setIncludeMine(e.target.checked)} className="accent-felid-accent" />
            include mine
          </label>
          <button type="button" aria-label="Previous" className={ICON_BTN} onClick={() => setIndex((i) => Math.max(0, i - 1))}><ChevronLeft className="w-4 h-4" /></button>
          <button type="button" aria-label="Next" className={ICON_BTN} onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}><ChevronRight className="w-4 h-4" /></button>
          <button type="button" aria-label="Zoom out" className={ICON_BTN} onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}><ZoomOut className="w-4 h-4" /></button>
          <button type="button" aria-label="Zoom in" className={ICON_BTN} onClick={() => setScale((s) => Math.min(4, s + 0.25))}><ZoomIn className="w-4 h-4" /></button>
          <span className="text-xs font-mono text-felid-muted self-center">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      <div className="overflow-auto bg-[#0c0a0e] border-2 border-black shadow-brutal p-2 min-h-[280px] flex items-center justify-center" data-testid="image-preview">
        {imageSrc
          ? <img src={imageSrc} alt={current.title || 'candidate'} style={{ transform: `scale(${scale})` }} className="max-h-[480px] w-full object-contain" />
          : (
            <div className="text-center space-y-2">
              <ImageOff className="w-8 h-8 mx-auto text-felid-muted" />
              <p className="text-xs font-mono text-felid-muted">{imageError || 'Loading protected image…'}</p>
            </div>
          )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <dl className={`text-xs font-mono space-y-2 ${CARD}`}>
          <div><dt className={`${LABEL} text-felid-muted`}>Claimed breed (unverified)</dt><dd className="font-display font-black text-sm uppercase text-felid-ivory">{current.breed_id.replace(/-/g, ' ')}</dd></div>
          <div><dt className={`${LABEL} text-felid-muted`}>Source</dt><dd className="text-felid-ivory">{current.title} · {current.source}</dd></div>
          <div><dt className={`${LABEL} text-felid-muted`}>Author / licence</dt><dd>{current.author} · {current.license}</dd></div>
          <div><dt className={`${LABEL} text-felid-muted`}>Resolution / size</dt><dd>{current.width}×{current.height} · {current.bytes} B</dd></div>
          <div><dt className={`${LABEL} text-felid-muted`}>SHA-256</dt><dd className="break-all">{current.sha256}</dd></div>
          <div><dt className={`${LABEL} text-felid-muted`}>Asset type / training</dt><dd>
            <select data-testid="asset-type" value={assetType} onChange={(e) => setAssetType(e.target.value)} className={SELECT_CLS} aria-label="Asset type">
              <option value="unknown">unknown</option><option value="animal_photograph">animal_photograph</option>
              <option value="historical_photograph">historical_photograph</option>
              <option value="scientific_illustration">scientific_illustration</option>
              <option value="book_illustration">book_illustration</option>
              <option value="painting_or_artwork">painting_or_artwork</option>
              <option value="sculpture_or_artefact">sculpture_or_artefact</option>
              <option value="diagram_or_infographic">diagram_or_infographic</option>
              <option value="ai_generated">ai_generated</option>
            </select>
            <span className={`ml-2 font-bold ${current.training_eligible ? 'text-felid-success' : 'text-felid-muted'}`}>
              {current.training_eligible ? 'training-eligible' : 'not training-eligible'}
            </span>
            {current.exclusion_reason && <span className="block text-felid-danger">{current.exclusion_reason}</span>}
            {current.status === 'verified' && assetType === 'unknown' && (
              <span className="block text-[10px] font-mono text-felid-warning">
                Verified label, but not training-eligible — classify the asset as animal_photograph or historical_photograph.
              </span>
            )}
          </dd></div>
          <div><dt className={`${LABEL} text-felid-muted`}>Special check</dt><dd className="text-felid-accent">{current.special_check}</dd></div>
          <div><dt className={`${LABEL} text-felid-muted`}>Reviewing as</dt><dd>{reviewer}</dd></div>
        </dl>

        <div className={`${CARD} space-y-3`}>
          <label className="block text-xs font-mono text-felid-muted">Reason (required for reject / ambiguous)
            <textarea data-testid="decision-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full bg-[#0c0a0e] border-2 border-black p-2 text-felid-ivory focus:outline-none focus:border-felid-accent" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={submitting} onClick={() => submit('approved')} className="inline-flex items-center gap-1 px-3 py-2 bg-felid-accent hover:bg-felid-accent-hover text-black font-mono font-bold text-xs border-2 border-black shadow-brutal-sm brutal-press disabled:opacity-50"><Check className="w-3.5 h-3.5" /> Approve (A)</button>
            <button type="button" disabled={submitting} onClick={() => submit('rejected')} className="inline-flex items-center gap-1 px-3 py-2 bg-felid-danger hover:bg-[#fb7185] text-black font-mono font-bold text-xs border-2 border-black shadow-brutal-sm brutal-press disabled:opacity-50"><X className="w-3.5 h-3.5" /> Reject (R)</button>
            <button type="button" disabled={submitting} onClick={() => submit('ambiguous')} className="inline-flex items-center gap-1 px-3 py-2 bg-felid-warning hover:bg-[#fdba74] text-black font-mono font-bold text-xs border-2 border-black shadow-brutal-sm brutal-press disabled:opacity-50"><HelpCircle className="w-3.5 h-3.5" /> Ambiguous (U)</button>
          </div>
          {message && <p className="text-xs font-mono text-felid-muted" role="status">{message}</p>}
          <p className="text-[10px] font-mono text-felid-muted">
            {required === 1
              ? 'One reviewer decides. A conflicting second decision makes the row contested.'
              : `${required} distinct reviewers must agree. Mixed decisions stay contested.`}
          </p>
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
      setError(err?.status === 503
        ? 'Backend has no REVIEWER_SESSION_SECRET configured. Set it in the backend process environment (not .env — Felineye never loads .env) plus REVIEWER_NAMES, restart the backend, then sign in again.'
        : msg);
    }
  };

  const refreshStats = async () => {
    try { setStats(await api.getDatasetStats(session)); } catch { /* dashboard reload on next visit */ }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-felid-accent">BREED-V1 · HUMAN REVIEW</p>
        <h1 className="font-display font-black text-3xl uppercase text-felid-ivory">Dataset Review</h1>
        <p className="text-xs font-mono text-felid-muted mt-1">
          {(stats?.required_reviewers ?? 1) === 1
            ? 'One reviewer decides. Nothing auto-approves.'
            : `${stats?.required_reviewers} reviewers must agree. Nothing auto-approves.`}
        </p>
      </div>
      {!session ? (
        <div className="flex flex-wrap gap-3 items-end bg-[#141218] border-2 border-black shadow-brutal p-4 max-w-lg">
          <label className="block text-xs font-mono text-felid-muted flex-1 min-w-[180px]">Reviewer handle
            <input data-testid="reviewer-input" value={reviewer} onChange={(e) => setReviewer(e.target.value)} className="mt-1 block w-full bg-[#0c0a0e] border-2 border-black p-2 text-felid-ivory focus:outline-none focus:border-felid-accent" />
          </label>
          <button type="button" onClick={login} className="px-4 py-2 bg-felid-accent hover:bg-felid-accent-hover text-black font-mono font-bold text-xs border-2 border-black shadow-brutal-sm brutal-press">Sign in</button>
          {error && <p className="w-full text-xs font-mono text-felid-danger">{error}</p>}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <button type="button" onClick={() => setTab('dashboard')} className={`px-3 py-2 font-mono font-bold text-xs border-2 border-black shadow-brutal-sm brutal-press ${tab === 'dashboard' ? 'bg-felid-accent text-black' : 'bg-[#1d1922] text-felid-ivory'}`}>Dashboard</button>
              <button type="button" onClick={() => setTab('review')} className={`px-3 py-2 font-mono font-bold text-xs border-2 border-black shadow-brutal-sm brutal-press ${tab === 'review' ? 'bg-felid-accent text-black' : 'bg-[#1d1922] text-felid-ivory'}`}>Review workspace</button>
            </div>
            <label className="text-xs font-mono text-felid-muted">Breed
              <select data-testid="workspace-breed" value={breed} onChange={(e) => setBreed(e.target.value)} className={SELECT_CLS}>
                <option value="">All pilot breeds</option>
                {stats && Object.keys(stats.per_breed).map((b) => <option key={b} value={b}>{b.replace(/-/g, ' ')}</option>)}
              </select></label>
            <span className="text-[10px] font-mono text-felid-muted">signed in as <b className="text-felid-ivory">{reviewer}</b></span>
          </div>
          {tab === 'dashboard'
            ? <DatasetDashboard stats={stats} session={session} onStats={setStats} />
            : <DatasetReviewWorkspace session={session} reviewer={reviewer} breed={breed} required={stats?.required_reviewers ?? 1} onDecided={refreshStats} />}
        </>
      )}
    </div>
  );
};
