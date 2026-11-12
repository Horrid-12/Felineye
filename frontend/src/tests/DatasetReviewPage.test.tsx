import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { DatasetReviewPage } from '../pages/DatasetReviewPage';
import { api } from '../services/api';

const candidates = [
  { id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', breed_id: 'siamese', status: 'pending', title: 'File:siamese 1', author: 'Jane', license: 'CC BY-SA 4.0', source: 'wikimedia-commons', width: 600, height: 600, bytes: 1000, sha256: 'a'.repeat(64), special_check: 'point-colour', image_url: '/api/dataset-review/candidates/aaaa/image' },
  { id: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', breed_id: 'siamese', status: 'pending', title: 'File:siamese 2', author: 'Jane', license: 'CC BY-SA 4.0', source: 'wikimedia-commons', width: 600, height: 600, bytes: 1000, sha256: 'b'.repeat(64), special_check: 'point-colour', image_url: '/api/dataset-review/candidates/bbbb/image' },
];
const stats = { total: 2, total_verified: 0, required_reviewers: 1, per_breed: { siamese: { total: 2, verified: 0, rejected: 0, ambiguous: 0, contested: 0, pending: 2, reviewed: 0, unreviewed: 2, awaiting_second: 0, mine: 0, approval_rate: 0, rejection_rate: 0, ambiguity_rate: 0 } }, special_checks: {} };

const gaps = {
  generated: '2026-11-10', target_per_breed: 30,
  priority_order: ['siamese', 'manx'],
  priority_tiers: { siamese: 1, manx: 1 },
  total_eligible: 13, total_remaining: 47, estimated_candidates_needed: 222,
  per_breed: {
    siamese: { breed_id: 'siamese', priority: 1, priority_tier: 1, collected: 25, reviewed: 25, decided: 25, verified: 4, rejected: 20, ambiguous: 1, contested: 0, pending: 0, eligible: 4, remaining: 26, target: 30, completion_pct: 13.3, yield_rate: 0.16, estimated_candidates_needed: 163, ineligible_verified: 0, excluded_unknown: 7, excluded_non_photographic: 11, asset_types: { animal_photograph: 4 } },
    manx: { breed_id: 'manx', priority: 2, priority_tier: 1, collected: 25, reviewed: 25, decided: 25, verified: 9, rejected: 15, ambiguous: 1, contested: 0, pending: 0, eligible: 9, remaining: 21, target: 30, completion_pct: 30, yield_rate: 0.36, estimated_candidates_needed: 59, ineligible_verified: 0, excluded_unknown: 0, excluded_non_photographic: 0, asset_types: { animal_photograph: 9 } },
  },
};

beforeEach(() => {
  [api.datasetLogin, api.getDatasetStats, api.getDatasetCandidates, api.submitDatasetReview, api.getDatasetGaps]
    .forEach((fn) => { if (typeof (fn as any).mockClear === 'function') (fn as any).mockClear(); });
  vi.spyOn(api, 'datasetLogin').mockResolvedValue({ reviewer: 'reviewer-a', session: 'sess' } as any);
  vi.spyOn(api, 'getDatasetStats').mockResolvedValue(stats as any);
  vi.spyOn(api, 'getDatasetGaps').mockResolvedValue(gaps as any);
  vi.spyOn(api, 'getDatasetCandidates').mockResolvedValue({ total: 2, page: 1, page_size: 100, items: candidates } as any);
  vi.spyOn(api, 'submitDatasetReview').mockResolvedValue({ review: {} as any, status: 'pending' } as any);
});

it('login unlocks dashboard with stats and breed filter', async () => {
  render(<DatasetReviewPage />);
  await act(async () => { fireEvent.change(screen.getByTestId('reviewer-input'), { target: { value: 'reviewer-a' } }); });
  await act(async () => { fireEvent.click(screen.getByText('Sign in')); });
  expect(await screen.findByLabelText('Review dashboard')).toBeTruthy();
  expect(screen.getByTestId('review-stats')).toBeTruthy();
  expect(screen.getByTestId('filter-breed')).toBeTruthy();
  expect(api.datasetLogin).toHaveBeenCalledWith('reviewer-a');
});

it('image loads through an authenticated fetch (not a bare img src)', async () => {
  const blobUrl: string[] = [];
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn((b: Blob) => { const u = 'blob:mock'; blobUrl.push(u); return u; }), revokeObjectURL: vi.fn() });
  const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(new Response(new Blob(['x']), { status: 200 }) as any);
  render(<DatasetReviewPage />);
  await act(async () => { fireEvent.change(screen.getByTestId('reviewer-input'), { target: { value: 'reviewer-a' } }); });
  await act(async () => { fireEvent.click(screen.getByText('Sign in')); });
  await act(async () => { fireEvent.click(screen.getByText('Review workspace')); });
  const img = await screen.findByAltText('File:siamese 1');
  expect((img as HTMLImageElement).src).toBe('blob:mock');
  expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/dataset-review/candidates/'), expect.objectContaining({
    headers: { Authorization: 'Bearer sess' },
  }));
  vi.unstubAllGlobals();
});

it('review workspace navigates and submits with keyboard + button', async () => {
  render(<DatasetReviewPage />);
  await act(async () => { fireEvent.change(screen.getByTestId('reviewer-input'), { target: { value: 'reviewer-a' } }); });
  await act(async () => { fireEvent.click(screen.getByText('Sign in')); });
  await act(async () => { fireEvent.click(screen.getByText('Review workspace')); });
  expect(await screen.findByText(/Image 1 of 2/)).toBeTruthy();
  expect(screen.getByTestId('image-preview')).toBeTruthy();
  await act(async () => { fireEvent.keyDown(window, { key: 'ArrowRight' }); });
  expect(await screen.findByText(/Image 2 of 2/)).toBeTruthy();
  await act(async () => { fireEvent.keyDown(window, { key: 'ArrowLeft' }); });
  expect(await screen.findByText(/Image 1 of 2/)).toBeTruthy();
  await act(async () => { fireEvent.change(screen.getByTestId('decision-reason'), { target: { value: 'looks good' } }); });
  await act(async () => { fireEvent.keyDown(window, { key: 'a' }); });
  expect(api.submitDatasetReview).toHaveBeenCalled();
  await act(async () => { fireEvent.change(screen.getByTestId('decision-reason'), { target: { value: 'not a cat' } }); });
  await act(async () => { fireEvent.keyDown(window, { key: 'r' }); });
  expect(api.submitDatasetReview).toHaveBeenCalledTimes(2);
});

it('dashboard counts single reviews instead of only showing 125 pending', async () => {
  const progressed = {
    ...stats,
    required_reviewers: 2,
    total_reviewed: 1, total_unreviewed: 1, total_awaiting_second: 1, total_mine: 1,
    per_breed: {
      siamese: {
        ...(stats.per_breed as any).siamese,
        reviewed: 1, unreviewed: 1, awaiting_second: 1, mine: 1,
      },
    },
  };
  vi.spyOn(api, 'getDatasetStats').mockResolvedValue(progressed as any);
  render(<DatasetReviewPage />);
  await act(async () => { fireEvent.change(screen.getByTestId('reviewer-input'), { target: { value: 'reviewer-a' } }); });
  await act(async () => { fireEvent.click(screen.getByText('Sign in')); });
  const awaiting = await screen.findByText('AWAITING REVIEW');
  expect(awaiting.parentElement?.textContent).toContain('1');
  const mine = screen.getByText('YOUR DECISIONS');
  expect(mine.parentElement?.textContent).toContain('1');
});

it('a decision advances to the next unreviewed image and drops the decided row', async () => {
  let decided = false;
  const decidedRow = { ...candidates[0], review_count: 1, my_decision: 'approved' as const };
  vi.spyOn(api, 'getDatasetCandidates').mockImplementation(async (_s: string, params?: any) => {
    const items = decided ? [decidedRow, candidates[1]] : candidates;
    const filtered = params?.review_state === 'unreviewed' ? items.filter((c: any) => !c.my_decision) : items;
    return { total: filtered.length, page: 1, page_size: 100, items: filtered } as any;
  });
  render(<DatasetReviewPage />);
  await act(async () => { fireEvent.change(screen.getByTestId('reviewer-input'), { target: { value: 'reviewer-a' } }); });
  await act(async () => { fireEvent.click(screen.getByText('Sign in')); });
  await act(async () => { fireEvent.click(screen.getByText('Review workspace')); });
  expect(await screen.findByText(/Image 1 of 2/)).toBeTruthy();
  decided = true;
  await act(async () => { fireEvent.keyDown(window, { key: 'a' }); });
  expect(await screen.findByText(/Image 1 of 1/)).toBeTruthy();
  expect(screen.getByText(/File:siamese 2/)).toBeTruthy();
  expect(api.submitDatasetReview).toHaveBeenCalledWith('sess', expect.any(String), expect.objectContaining({ expected_reviews: 0 }));
});

it('workspace queue hides rows rejected by another reviewer until decided images are included', async () => {
  const rejected = {
    ...candidates[0],
    status: 'rejected',
    review_count: 1,
    my_decision: null,
    quality_flags: ['greyscale'],
  };
  vi.spyOn(api, 'getDatasetCandidates').mockResolvedValue({
    total: 2, page: 1, page_size: 100, items: [rejected, candidates[1]],
  } as any);

  render(<DatasetReviewPage />);
  await act(async () => { fireEvent.change(screen.getByTestId('reviewer-input'), { target: { value: 'reviewer-a' } }); });
  await act(async () => { fireEvent.click(screen.getByText('Sign in')); });
  await act(async () => { fireEvent.click(screen.getByText('Review workspace')); });

  // Only the genuinely open row is queued; the quality-gate rejection is done.
  expect(await screen.findByText(/Image 1 of 1/)).toBeTruthy();
  expect(await screen.findByText(/File:siamese 2/)).toBeTruthy();
  expect(screen.queryByText(/File:siamese 1/)).toBeNull();

  await act(async () => { fireEvent.click(screen.getByText('include decided')); });
  expect(await screen.findByText(/Image 1 of 2/)).toBeTruthy();
  expect(await screen.findByText(/File:siamese 1/)).toBeTruthy();
});

it('dashboard shows the round-2 collection gap by priority', async () => {
  render(<DatasetReviewPage />);
  await act(async () => { fireEvent.change(screen.getByTestId('reviewer-input'), { target: { value: 'reviewer-a' } }); });
  await act(async () => { fireEvent.click(screen.getByText('Sign in')); });
  const gap = await screen.findByTestId('collection-gap');
  expect(gap.textContent).toContain('target 30 eligible / breed');
  expect(gap.textContent).toContain('47 still needed');
  const siamese = screen.getByTestId('gap-siamese');
  expect(siamese.textContent).toContain('4/30 eligible');
  expect(siamese.textContent).toContain('26 to go');
  expect(siamese.textContent).toContain('~163 new candidates');
  expect(siamese.textContent).toContain('priority');
  expect(screen.getByTestId('gap-manx').textContent).toContain('21 to go');
  expect(api.getDatasetGaps).toHaveBeenCalledWith('sess');
});

it('reason is required before reject/ambiguous can succeed client-side', async () => {
  render(<DatasetReviewPage />);
  await act(async () => { fireEvent.change(screen.getByTestId('reviewer-input'), { target: { value: 'reviewer-a' } }); });
  await act(async () => { fireEvent.click(screen.getByText('Sign in')); });
  await act(async () => { fireEvent.click(screen.getByText('Review workspace')); });
  expect(await screen.findByText(/Image 1 of 2/)).toBeTruthy();
  fireEvent.keyDown(window, { key: 'r' });
  expect(await screen.findByText(/A reason is required/)).toBeTruthy();
  expect(api.submitDatasetReview).not.toHaveBeenCalled();
});

it('candidate table uses required_reviewers denominator and zoom resizes image layout without CSS transform clipping', async () => {
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:mock-zoom'), revokeObjectURL: vi.fn() });
  vi.spyOn(window, 'fetch').mockResolvedValue(new Response(new Blob(['x']), { status: 200 }) as any);
  vi.spyOn(api, 'getDatasetCandidates').mockResolvedValue({
    total: 1,
    page: 1,
    page_size: 100,
    items: [{ ...candidates[0], status: 'verified', review_count: 1, my_decision: null }],
  } as any);

  render(<DatasetReviewPage />);
  await act(async () => { fireEvent.change(screen.getByTestId('reviewer-input'), { target: { value: 'reviewer-a' } }); });
  await act(async () => { fireEvent.click(screen.getByText('Sign in')); });

  const table = await screen.findByTestId('candidate-table');
  expect(table.textContent).toContain('1/1 reviews');
  expect(table.textContent).not.toContain('1/2 reviews');

  await act(async () => { fireEvent.click(screen.getByText('Review workspace')); });
  // A verified row is resolved, so it is not in the default queue.
  expect(await screen.findByTestId('workspace-empty')).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole('checkbox')); });
  const img = await screen.findByAltText('File:siamese 1') as HTMLImageElement;
  expect(img.style.width).toBe('auto');

  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(img.style.width).toBe('150%');
  expect(img.style.transform).toBe('');

  fireEvent.click(screen.getByRole('button', { name: '150%' }));
  expect(img.style.width).toBe('auto');
  vi.unstubAllGlobals();
});
