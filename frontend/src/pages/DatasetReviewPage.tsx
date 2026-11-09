import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, HelpCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { api } from '../services/api';
import { DatasetCandidate, DatasetStats } from '../types';

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

  const cards: Array<[string, number | undefined]> = [
    ['TOTAL', stats?.total], ['PENDING', totals?.pending], ['VERIFIED', totals?.verified],
    ['REJECTED', totals?.rejected], ['AMBIGUOUS', totals?.ambiguous], ['CONTESTED', totals?.contested],
  ];

  return (
    <section aria-label="Review dashboard" className="space-y-4">      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2" data-testid="review-stats">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-[#141218] border-2 border-black shadow-brutal-sm p-3">
            <div className="text-[10px] font-mono font-bold text-felid-muted">{label}</div>
            <div className="font-display text-2xl font-black text-felid-ivory">{value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-xs font-mono">Breed
          <select data-testid="filter-breed" value={filterBreed} onChange={(e) => setFilterBreed(e.target.value)}>
            <option value="">All</option>{breeds.map((b) => <option key={b} value={b}>{b}</option>)}
          </select></label>
        <label className="text-xs font-mono">Status
          <select data-testid="filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option>{['pending', 'verified', 'rejected', 'ambiguous', 'contested'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select></label>
        <label className="text-xs font-mono">Source
          <select data-testid="filter-source" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="">All</option><option value="wikimedia-commons">wikimedia-commons</option>
          </select></label>
        <span className="text-xs font-mono text-felid-muted">{total} candidates</span>
      </div>

      {stats && (
        <div className="bg-[#0c0a0e] border-2 border-black p-3">
          <h3 className="text-[10px] font-mono font-bold text-felid-muted mb-2">PER-BREED PROGRESS</h3>
          {Object.entries(stats.per_breed).map(([breed, v]) => (
            <div key={breed} className="text-xs font-mono flex flex-wrap gap-3">
              <span className="text-felid-ivory">{breed}</span>
              <span>{v.verified}/{v.total} verified · {v.pending} pending · {v.contested} contested</span>
              <span className="text-felid-muted">approve {Math.round(v.approval_rate * 100)}% · reject {Math.round(v.rejection_rate * 100)}%</span>
            </div>
          ))}
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
}

export const DatasetReviewWorkspace: React.FC<WorkspaceProps> = ({ session, reviewer, breed }) => {
  const [items, setItems] = useState<DatasetCandidate[]>([]);
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getDatasetCandidates(session, { breed, page: 1, page_size: 100 })
      .then((r) => { setItems(r.items); setIndex(0); }).catch(() => undefined);
  }, [session, breed]);

  const current = items[index] as DatasetCandidate | undefined;

  const submit = useCallback(async (decision: 'approved' | 'rejected' | 'ambiguous') => {
    if (!current) return;
    if (decision !== 'approved' && !reason.trim()) {
      setMessage('A reason is required for rejection and ambiguous decisions.');
      return;
    }
    try {
      await api.submitDatasetReview(session, current.id.slice(0, 16), {
        decision, reason: reason.trim(), expected_reviews: 0,
      });
      setReason(''); setMessage(`Recorded ${decision}. Reloading…`);
      const r = await api.getDatasetCandidates(session, { breed, page: 1, page_size: 100 });
      setItems(r.items); setIndex(0);
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
          <button type="button" aria-label="Previous" onClick={() => setIndex((i) => Math.max(0, i - 1))}><ChevronLeft /></button>
          <button type="button" aria-label="Next" onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}><ChevronRight /></button>
          <button type="button" aria-label="Zoom out" onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}><ZoomOut /></button>
          <button type="button" aria-label="Zoom in" onClick={() => setScale((s) => Math.min(4, s + 0.25))}><ZoomIn /></button>
        </div>
      </div>

      <div className="overflow-auto bg-[#0c0a0e] border-2 border-black p-2" data-testid="image-preview">
        <img src={current.image_url} alt={current.title || 'candidate'} style={{ transform: `scale(${scale})` }} className="max-h-[480px] w-full object-contain" />
      </div>

      <dl className="text-xs font-mono space-y-1">
        <div><dt className="text-felid-muted">Claimed breed (unverified)</dt><dd className="text-felid-ivory">{current.breed_id}</dd></div>
        <div><dt className="text-felid-muted">Source</dt><dd>{current.title} · {current.source}</dd></div>
        <div><dt className="text-felid-muted">Author / licence</dt><dd>{current.author} · {current.license}</dd></div>
        <div><dt className="text-felid-muted">Resolution / size</dt><dd>{current.width}×{current.height} · {current.bytes} B</dd></div>
        <div><dt className="text-felid-muted">SHA-256</dt><dd className="break-all">{current.sha256}</dd></div>
        <div><dt className="text-felid-muted">Special check</dt><dd className="text-felid-accent">{current.special_check}</dd></div>
        <div><dt className="text-felid-muted">Reviewing as</dt><dd>{reviewer}</dd></div>
      </dl>

      <label className="block text-xs font-mono">Reason (required for reject / ambiguous)
        <textarea data-testid="decision-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full bg-[#0c0a0e] border-2 border-black p-2 text-felid-ivory" />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => submit('approved')} className="px-3 py-2 bg-felid-accent text-black font-mono font-bold text-xs"><Check /> Approve (A)</button>
        <button type="button" onClick={() => submit('rejected')} className="px-3 py-2 bg-[#f43f5e] text-black font-mono font-bold text-xs"><X /> Reject (R)</button>
        <button type="button" onClick={() => submit('ambiguous')} className="px-3 py-2 bg-[#fb923c] text-black font-mono font-bold text-xs"><HelpCircle /> Ambiguous (U)</button>
      </div>
      {message && <p className="text-xs font-mono text-felid-muted" role="status">{message}</p>}
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
      setError(err?.message || 'Login failed.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display font-black text-2xl uppercase text-felid-ivory">Dataset Review</h1>
      {!session ? (
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs font-mono">Reviewer handle
            <input data-testid="reviewer-input" value={reviewer} onChange={(e) => setReviewer(e.target.value)} className="block bg-[#0c0a0e] border-2 border-black p-2 text-felid-ivory" />
          </label>
          <button type="button" onClick={login} className="px-3 py-2 bg-felid-accent text-black font-mono font-bold text-xs">Sign in</button>
          {error && <p className="text-xs font-mono text-[#f43f5e]">{error}</p>}
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <button type="button" onClick={() => setTab('dashboard')} className="px-3 py-2 bg-[#1d1922] font-mono font-bold text-xs border-2 border-black">Dashboard</button>
            <button type="button" onClick={() => setTab('review')} className="px-3 py-2 bg-[#1d1922] font-mono font-bold text-xs border-2 border-black">Review workspace</button>
            <label className="text-xs font-mono">Breed
              <select data-testid="workspace-breed" value={breed} onChange={(e) => setBreed(e.target.value)}>
                <option value="">All pilot breeds</option>
                {stats && Object.keys(stats.per_breed).map((b) => <option key={b} value={b}>{b}</option>)}
              </select></label>
          </div>
          {tab === 'dashboard'
            ? <DatasetDashboard stats={stats} session={session} onStats={setStats} />
            : <DatasetReviewWorkspace session={session} reviewer={reviewer} breed={breed} />}
        </>
      )}
    </div>
  );
};
