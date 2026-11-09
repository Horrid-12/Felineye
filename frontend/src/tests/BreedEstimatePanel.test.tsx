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
  it('renders the breed as a closest visual match, not a pedigree claim', () => {
    render(
      <BreedEstimatePanel
        breed={britishShorthair}
        candidates={[britishShorthair, ragdoll]}
        note="Closest visual match: British Shorthair (97% similarity). This is not pedigree verification."
        onSelectBreed={vi.fn()}
      />
    );

    expect(screen.getByText('British Shorthair')).toBeDefined();
    expect(screen.getByText('97%')).toBeDefined();
    expect(screen.getByText('CLOSEST VISUAL MATCH')).toBeDefined();
    expect(screen.getByText('DOMESTIC BREED // CLOSEST MATCH')).toBeDefined();
    expect(screen.getByText('VISUAL SIMILARITY SCORE')).toBeDefined();
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

  it('still lists the closest curated classes when no breed is asserted', () => {
    const handleSelect = vi.fn();
    render(
      <BreedEstimatePanel
        breed={null}
        candidates={[ragdoll]}
        note="Breed evidence is below the conservative confidence threshold (Ragdoll at 78%). Breed is not asserted."
        onSelectBreed={handleSelect}
      />
    );

    expect(screen.getByText('CLOSEST CURATED BREED CLASSES')).toBeDefined();
    expect(screen.getByText('15% visual similarity')).toBeDefined();

    fireEvent.click(screen.getByText('Ragdoll'));
    expect(handleSelect).toHaveBeenCalledWith('ragdoll');
  });

  it('shows a breed group as uncertain and never as a confirmed breed', () => {
    const tonkinese: BreedPrediction = {
      ...britishShorthair,
      breed_id: 'tonkinese',
      common_name: 'Tonkinese',
      score_percentage: 72,
      confidence_score: 0.72,
      model_label: 'Tonkinese',
    };
    const siamese: BreedPrediction = {
      ...britishShorthair,
      breed_id: 'siamese',
      common_name: 'Siamese',
      score_percentage: 84,
      confidence_score: 0.84,
      model_label: 'Siamese',
    };
    render(
      <BreedEstimatePanel
        breed={null}
        candidates={[siamese, tonkinese]}
        note="Cannot be reliably separated; visual appearance cannot establish pedigree."
        groupName="Colourpoint group (Tonkinese / Siamese / Balinese)"
        groupCandidates={[siamese, tonkinese]}
        onSelectBreed={vi.fn()}
      />
    );

    expect(screen.getByText('BREED GROUP — UNCERTAIN')).toBeDefined();
    expect(screen.getByText('POSSIBLE BREED GROUP — CANNOT DISTINGUISH RELIABLY')).toBeDefined();
    expect(screen.getAllByText('Tonkinese').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Siamese').length).toBeGreaterThan(0);
    expect(screen.getAllByText('72% visual similarity').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/visual appearance cannot establish pedigree/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('CLOSEST VISUAL MATCH')).toBeNull();
    expect(screen.queryByText('Breed Profile')).toBeNull();
  });

  it('renders nothing when there is no breed evidence at all', () => {
    const { container } = render(
      <BreedEstimatePanel breed={null} candidates={[]} onSelectBreed={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });
});
