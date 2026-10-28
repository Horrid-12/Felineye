import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BreedEstimatePanel } from '../components/identify/BreedEstimatePanel';
import { BreedPrediction } from '../types';

const britishShorthair: BreedPrediction = {
  breed_id: 'british-shorthair',
  common_name: 'British Shorthair',
  scientific_name: 'Felis catus',
  confidence_score: 0.97,
  score_percentage: 97,
  category: 'domestic_breed',
  thumbnail_url: 'https://example.com/british-shorthair.jpg',
  rationale: 'Breed-classifier softmax score for British Shorthair.',
  score_semantics: 'breed_classifier_softmax',
  model_label: 'British Shorthair',
  is_estimate: true,
};

const ragdoll: BreedPrediction = {
  ...britishShorthair,
  breed_id: 'ragdoll',
  common_name: 'Ragdoll',
  score_percentage: 15,
  confidence_score: 0.15,
  model_label: 'Ragdoll',
};

describe('BreedEstimatePanel Component', () => {
  it('renders the breed estimate as an estimate, not a pedigree claim', () => {
    render(
      <BreedEstimatePanel
        breed={britishShorthair}
        candidates={[britishShorthair, ragdoll]}
        note="Breed estimate: British Shorthair (97% visual similarity). This is not pedigree verification."
        onSelectBreed={vi.fn()}
      />
    );

    expect(screen.getByText('British Shorthair')).toBeDefined();
    expect(screen.getByText('97%')).toBeDefined();
    expect(screen.getByText('BREED ESTIMATE')).toBeDefined();
    expect(screen.getByText('DOMESTIC BREED // ESTIMATE')).toBeDefined();
    expect(screen.getAllByText(/not pedigree verification/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/PEDIGREE VERIFIED/i)).toBeNull();
  });

  it('opens the breed profile when the profile button is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <BreedEstimatePanel
        breed={britishShorthair}
        candidates={[britishShorthair]}
        onSelectBreed={handleSelect}
      />
    );

    fireEvent.click(screen.getByText(/Breed Profile/i));
    expect(handleSelect).toHaveBeenCalledWith('british-shorthair');
  });

  it('lists and links to the closest curated breed classes', () => {
    const handleSelect = vi.fn();
    render(
      <BreedEstimatePanel
        breed={britishShorthair}
        candidates={[britishShorthair, ragdoll]}
        onSelectBreed={handleSelect}
      />
    );

    expect(screen.getByText('Ragdoll')).toBeDefined();
    expect(screen.getByText('15% visual similarity')).toBeDefined();

    fireEvent.click(screen.getByText('Ragdoll'));
    expect(handleSelect).toHaveBeenCalledWith('ragdoll');
  });

  it('shows a not-asserted state with the explanatory note', () => {
    render(
      <BreedEstimatePanel
        breed={null}
        candidates={[ragdoll]}
        note="The image matches the general domestic-cat class 'Calico' rather than a specific breed. Breed is not asserted."
        onSelectBreed={vi.fn()}
      />
    );

    expect(screen.getByText('BREED NOT ASSERTED')).toBeDefined();
    expect(screen.getByText(/general domestic-cat class/i)).toBeDefined();
    expect(screen.queryByText('Breed Profile')).toBeNull();
  });

  it('renders nothing when there is no breed evidence at all', () => {
    const { container } = render(
      <BreedEstimatePanel breed={null} candidates={[]} onSelectBreed={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });
});
