import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CandidateCard } from '../components/identify/CandidateCard';
import { CandidatePrediction } from '../types';

const mockCandidate: CandidatePrediction = {
  species_id: 'panthera-uncia',
  common_name: 'Snow Leopard',
  scientific_name: 'Panthera uncia',
  confidence_score: 0.88,
  score_percentage: 88,
  is_wild: true,
  conservation_status: 'VU',
  thumbnail_url: 'https://example.com/snow-leopard.jpg',
  rationale: 'Characteristic smoky-grey rosetted coat detected.'
};

describe('CandidateCard Component', () => {
  it('renders top candidate details and confidence bar', () => {
    const handleViewDetails = vi.fn();
    render(
      <CandidateCard
        candidate={mockCandidate}
        rank={1}
        isTop={true}
        onViewDetails={handleViewDetails}
      />
    );

    expect(screen.getByText('Snow Leopard')).toBeDefined();
    expect(screen.getByText('Panthera uncia')).toBeDefined();
    expect(screen.getByText('88%')).toBeDefined();
    expect(screen.getByText('#1')).toBeDefined();
  });

  it('triggers onViewDetails callback when profile button clicked', () => {
    const handleViewDetails = vi.fn();
    render(
      <CandidateCard
        candidate={mockCandidate}
        rank={1}
        isTop={true}
        onViewDetails={handleViewDetails}
      />
    );

    const button = screen.getByText(/Species Profile/i);
    fireEvent.click(button);
    expect(handleViewDetails).toHaveBeenCalledWith('panthera-uncia');
  });
});
