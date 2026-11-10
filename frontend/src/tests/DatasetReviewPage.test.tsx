import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { DatasetReviewPage } from '../pages/DatasetReviewPage';
import { api } from '../services/api';

const candidates = [
  { id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', breed_id: 'siamese', status: 'pending', title: 'File:siamese 1', author: 'Jane', license: 'CC BY-SA 4.0', source: 'wikimedia-commons', width: 600, height: 600, bytes: 1000, sha256: 'a'.repeat(64), special_check: 'point-colour', image_url: '/api/dataset-review/candidates/aaaa/image' },
  { id: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', breed_id: 'siamese', status: 'pending', title: 'File:siamese 2', author: 'Jane', license: 'CC BY-SA 4.0', source: 'wikimedia-commons', width: 600, height: 600, bytes: 1000, sha256: 'b'.repeat(64), special_check: 'point-colour', image_url: '/api/dataset-review/candidates/bbbb/image' },
];
const stats = { total: 2, total_verified: 0, per_breed: { siamese: { total: 2, verified: 0, rejected: 0, ambiguous: 0, contested: 0, pending: 2, approval_rate: 0, rejection_rate: 0, ambiguity_rate: 0 } }, special_checks: {} };

beforeEach(() => {
  [api.datasetLogin, api.getDatasetStats, api.getDatasetCandidates, api.submitDatasetReview]
    .forEach((fn) => { if (typeof (fn as any).mockClear === 'function') (fn as any).mockClear(); });
  vi.spyOn(api, 'datasetLogin').mockResolvedValue({ reviewer: 'reviewer-a', session: 'sess' } as any);
  vi.spyOn(api, 'getDatasetStats').mockResolvedValue(stats as any);
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
  const awaiting = await screen.findByText('AWAITING 2nd');
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
