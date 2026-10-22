import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ConservationBadge } from '../components/species/ConservationBadge';

describe('ConservationBadge Component', () => {
  it('renders Endangered status correctly', () => {
    render(<ConservationBadge status="EN" showTitle={true} />);
    expect(screen.getByText('EN')).toBeDefined();
    expect(screen.getByText(/Endangered/i)).toBeDefined();
  });

  it('renders Vulnerable status correctly', () => {
    render(<ConservationBadge status="VU" />);
    expect(screen.getByText('VU')).toBeDefined();
  });

  it('renders Domesticated species status correctly', () => {
    render(<ConservationBadge status="DOMESTIC" showTitle={true} />);
    expect(screen.getByText('DOMESTIC')).toBeDefined();
    expect(screen.getByText(/Domesticated/i)).toBeDefined();
  });
});
