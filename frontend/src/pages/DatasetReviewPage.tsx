import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, HelpCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ImageOff } from 'lucide-react';
import { api } from '../services/api';
import { DatasetCandidate, DatasetStats } from '../types';

const SELECT_CLS =
  'ml-1 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm px-2 py-1 text-xs font-mono text-felid-ivory focus:outline-none';
const CARD = 'bg-[#141218] border-2 border-black shadow-brutal p-4';
const ICON_BTN =
  'p-1.5 bg-[#1d1922] border-2 border-black shadow-brutal-sm text-felid-ivory hover:bg-[#26222d] brutal-press';

interface StatsProps {
  stats: DatasetStats | null;
  session: string;
  onStats: (s: DatasetStats) => void;
}

export const DatasetDashboard: React.FC<StatsProps> = ({ stats, session, onStats }) => {
  const [breeds, setBreeds] = useState<string[]>([]);
  const [filterBreed, setFilterBreed] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [items, setItems] = useState<DatasetCandidate[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.getDatasetStats(session).then((s) => { onStats(s); setBreeds(Object.keys(s.per_breed)); }).catch(() => undefined);
  }, [session]);

  const load = useCallback(() => {
    api.getDatasetCandidates(session, { breed: filterBreed || undefined, status: filterStatus || undefined, source: filterSource || undefined, page: 1, page_size: 100 })
      .then((r) => { setItems(r.items); setTotal(r.total); })
      .catch(() => undefined);
  }, [session, filterBreed, filterStatus, filterSource]);

  useEffect(() => { load(); }, [load]);

  const totals = stats ? Object.values(stats.per_breed).reduce(
    (acc, b) => ({ verified: acc.verified + b.verified, rejected: acc.rejected + b.rejected,
      ambiguous: acc.ambiguous + b.ambiguous, contested: acc.contested + b.contested, pending: acc.pending + b.pending }),
    { verified: 0, rejected: 0, ambiguous: 0, contested: 0, pending: 0 }) : null;

  const cards: Array<[string, number | undefined, string]> = [
    ['TOTAL', stats?.total, 'text-felid-ivory'], ['PENDING', totals?.pending, 'text-felid-ivory'],
    ['VERIFIED', totals?.verified, 'text-felid-success'], ['REJECTED', totals?.rejected, 'text-[#f43f5e]'],
    ['AMBIGUOUS', totals?.ambiguous, 'text-[#fb923c]'], ['CONTESTED', totals?.contested, 'text-felid-accent'],
  ];

  return (
    <section aria-label="Review dashboard" className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="review-stats">
        {cards.map(([label, value, color]) => (
          <div key={label} className="bg-[#141218] border-2 border-black shadow-brutal-sm p-3">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-felid-muted">{label}</div>
            <div className={`font-display text-3xl font-black ${color}`}>{value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-end bg-[#141218] border-2 border-black shadow-brutal-sm p-3">
        <label className="text-xs font-mono text-felid-muted">Breed
          <select data-testid="filter-breed" value={filterBreed} onChange={(e) => setFilterBreed(e.target.value)} className={SELECT_CLS}>
            <option value="">All</option>{breeds.map((b) => <option key={b} value={b}>{b.replace(/-/g, ' ')}</option>)}
          </select></label>
        <label className="text-xs font-mono text-felid-muted">Status
          <select data-testid="filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={SELECT_CLS}>
            <option value="">All</option>{['pending', 'verified', 'rejected', 'ambiguous', 'contested'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select></label>
        <label className="text-xs font-mono text-felid-muted">Source
          <select data-testid="filter-source" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className={SELECT_CLS}>
            <option value="">All</option><option value="wikimedia-commons">wikimedia-commons</option>
          </select></label>
        <span className="text-xs font-mono font-bold text-felid-accent">{total} candidates</span>
      </div>

      {stats && (
        <div className="bg-[#0c0a0e] border-2 border-black shadow-brutal-sm p-4">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-felid-muted mb-3">PER-BREED PROGRESS</h3>
          <div className="space-y-3">
            {Object.entries(stats.per_breed).map(([breed, v]) => {
              const pct = Math.round((v.verified / Math.max(1, v.total)) * 100);
              return (
                <div key={breed} className="flex flex-wrap items-center gap-3">
                  <span className="font-display font-black text-xs text-felid-ivory uppercase w-44">{breed.replace(/-/g, ' ')}</span>
                  <div className="flex-1 min-w-[160px] h-2.5 bg-[#1d1922] border border-black overflow-hidden">
                    <div className="h-full bg-felid-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-felid-muted">{v.verified}/{v.total} verified · {v.pending} pending · {v.contested} contested</span>
                  <span className="text-xs font-mono text-felid-muted">approve {Math.round(v.approval_rate * 100)}% · reject {Math.round(v.rejection_rate * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs font-mono text-felid-muted">Filtered rows: {items.length}</p>
    </section>
  );
};

interface WorkspaceProps {
  session: string;
  reviewer: string;
  breed: string;
  onDecided?: () => void;
}

export const DatasetReviewWorkspace: React.FC<WorkspaceProps> = ({ session, reviewer, breed, onDecided }) => {
  const [items, setItems] = useState<DatasetCandidate[]>([]);
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [reason, setReason] = useState('');
  const [assetType, setAssetType] = useState('unknown');
  const [message, setMessage] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    api.getDatasetCandidates(session, { breed, page: 1, page_size: 100 })
      .then((r) => { setItems(r.items); setIndex(0); }).catch(() => undefined);
  }, [session, breed]);

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
    if (!current) return;
    if (decision !== 'approved' && !reason.trim()) {
      setMessage('A reason is required for rejection and ambiguous decisions.');
      return;
    }
    try {
      await api.submitDatasetReview(session, current.id.slice(0, 16), {
        decision, reason: reason.trim(), asset_type: assetType, expected_reviews: 0,
      });
      setReason(''); setMessage(`Recorded ${decision}.`);
      onDecided?.();  // refresh dashboard stats live
      const r = await api.getDatasetCandidates(session, { breed, page: 1, page_size: 100 });
      setItems(r.items);
      setIndex((i) => Math.min(i + 1, r.items.length - 1));  // move to NEXT, not back to first
      setMessage(`Recorded ${decision}.`);
    } catch (err: any) {
      setMessage(err?.message || 'Submission failed.');
    }
  }, [current, reason, session, breed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'a' || e.key === 'A') submit('approved');
      if (e.key === 'r' || e.key === 'R') submit('rejected');
      if (e.key === 'u' || e.key === 'U') submit('ambiguous');
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(items.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submit, items.length]);

  if (!current) return <p className="text-felid-muted font-mono text-xs">No candidates for this breed.</p>;

  return (
    <section aria-label="Review workspace" className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-mono text-felid-muted">Image {index + 1} of {items.length} · {current.id.slice(0, 16)} · status: {current.status}</span>
        <div className="flex gap-2">
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
          <div><dt className="text-felid-muted uppercase tracking-wider text-[10px]">Claimed breed (unverified)</dt><dd className="font-display font-black text-sm uppercase text-felid-ivory">{current.breed_id.replace(/-/g, ' ')}</dd></div>
          <div><dt className="text-felid-muted uppercase tracking-wider text-[10px]">Source</dt><dd className="text-felid-ivory">{current.title} · {current.source}</dd></div>
          <div><dt className="text-felid-muted uppercase tracking-wider text-[10px]">Author / licence</dt><dd>{current.author} · {current.license}</dd></div>
          <div><dt className="text-felid-muted uppercase tracking-wider text-[10px]">Resolution / size</dt><dd>{current.width}×{current.height} · {current.bytes} B</dd></div>
          <div><dt className="text-felid-muted uppercase tracking-wider text-[10px]">SHA-256</dt><dd className="break-all">{current.sha256}</dd></div>
          <div><dt className="text-felid-muted uppercase tracking-wider text-[10px]">Asset type / training</dt><dd>
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
            <span className="ml-2">{current.training_eligible ? 'training-eligible' : 'not training-eligible'}</span>
            {current.exclusion_reason && <span className="block text-[#f43f5e]">{current.exclusion_reason}</span>}
          </dd></div>
          <div><dt className="text-felid-muted uppercase tracking-wider text-[10px]">Special check</dt><dd className="text-felid-accent">{current.special_check}</dd></div>
          <div><dt className="text-felid-muted uppercase tracking-wider text-[10px]">Reviewing as</dt><dd>{reviewer}</dd></div>
        </dl>

        <div className={`${CARD} space-y-3`}>
          <label className="block text-xs font-mono text-felid-muted">Reason (required for reject / ambiguous)
            <textarea data-testid="decision-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full bg-[#0c0a0e] border-2 border-black p-2 text-felid-ivory focus:outline-none focus:border-felid-accent" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => submit('approved')} className="px-3 py-2 bg-felid-accent hover:bg-felid-accent-hover text-black font-mono font-bold text-xs border-2 border-black shadow-brutal-sm brutal-press"><Check /> Approve (A)</button>
            <button type="button" onClick={() => submit('rejected')} className="px-3 py-2 bg-[#f43f5e] hover:bg-[#fb7185] text-black font-mono font-bold text-xs border-2 border-black shadow-brutal-sm brutal-press"><X /> Reject (R)</button>
            <button type="button" onClick={() => submit('ambiguous')} className="px-3 py-2 bg-[#fb923c] hover:bg-[#fdba74] text-black font-mono font-bold text-xs border-2 border-black shadow-brutal-sm brutal-press"><HelpCircle /> Ambiguous (U)</button>
          </div>
          {message && <p className="text-xs font-mono text-felid-muted" role="status">{message}</p>}
          <p className="text-[10px] font-mono text-felid-muted">Two distinct approvals verify. Mixed decisions stay contested.</p>
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
        <p className="text-xs font-mono text-felid-muted mt-1">Two reviewers verify. One can dispute. Nothing auto-approves.</p>
      </div>
      {!session ? (
        <div className="flex flex-wrap gap-3 items-end bg-[#141218] border-2 border-black shadow-brutal p-4 max-w-lg">
          <label className="block text-xs font-mono text-felid-muted flex-1 min-w-[180px]">Reviewer handle
            <input data-testid="reviewer-input" value={reviewer} onChange={(e) => setReviewer(e.target.value)} className="mt-1 block w-full bg-[#0c0a0e] border-2 border-black p-2 text-felid-ivory focus:outline-none focus:border-felid-accent" />
          </label>
          <button type="button" onClick={login} className="px-4 py-2 bg-felid-accent hover:bg-felid-accent-hover text-black font-mono font-bold text-xs border-2 border-black shadow-brutal-sm brutal-press">Sign in</button>
          {error && <p className="w-full text-xs font-mono text-[#f43f5e]">{error}</p>}
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
          </div>

          {tab === 'dashboard'
            ? <DatasetDashboard stats={stats} session={session} onStats={setStats} />
            : <DatasetReviewWorkspace session={session} reviewer={reviewer} breed={breed} onDecided={refreshStats} />}
        </>
      )}
    </div>
  );
};
