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
