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
  category: 'wild_species',
  rationale: 'BioCLIP image-text similarity for Panthera uncia.',
  xp_reward: 400,
  score_semantics: 'bioclip_image_text_cosine_similarity',
};

describe('CandidateCard Component', () => {
  it('renders the candidate details and model score without a CONFIRMED label', () => {
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
    expect(screen.getByText('IMAGE–TEXT SIMILARITY')).toBeDefined();
    expect(screen.queryByText('CONFIRMED')).toBeNull();
    expect(screen.getByText('TOP MODEL CANDIDATE')).toBeDefined();
  });

  it('does not claim the top candidate is verified', () => {
    render(
      <CandidateCard
        candidate={mockCandidate}
        rank={1}
        isTop={true}
        onViewDetails={vi.fn()}
      />
    );

    expect(screen.queryByText(/CONFIRMED/i)).toBeNull();
    expect(screen.getAllByText(/not a calibrated probability/i).length).toBeGreaterThan(0);
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

    const button = screen.getByText(/Cat Profile/i);
    fireEvent.click(button);
    expect(handleViewDetails).toHaveBeenCalledWith('panthera-uncia');
  });

  it('uses neutral comparison styling for non-asserted candidates', () => {
    render(
      <CandidateCard
        candidate={mockCandidate}
        rank={2}
        isTop={false}
        onViewDetails={vi.fn()}
      />
    );

    expect(screen.queryByText('TOP MODEL CANDIDATE')).toBeNull();
    expect(screen.getByText('MODEL ESTIMATE')).toBeDefined();
  });
});
