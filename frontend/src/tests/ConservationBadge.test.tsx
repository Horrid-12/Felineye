import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ConservationBadge } from '../components/species/ConservationBadge';

describe('ConservationBadge Component', () => {
  it('renders Critically Endangered and Endangered statuses correctly', () => {
    const { rerender } = render(<ConservationBadge status="CR" showTitle={true} />);
    expect(screen.getByText('CR')).toBeDefined();
    expect(screen.getByText(/Critically Endangered/i)).toBeDefined();

    rerender(<ConservationBadge status="EN" showTitle={true} />);
    expect(screen.getByText('EN')).toBeDefined();
    expect(screen.getByText(/Endangered/i)).toBeDefined();
  });

  it('renders Vulnerable, Near Threatened, and Least Concern statuses correctly', () => {
    const { rerender } = render(<ConservationBadge status="VU" />);
    expect(screen.getByText('VU')).toBeDefined();

    rerender(<ConservationBadge status="NT" showTitle={true} />);
    expect(screen.getByText('NT')).toBeDefined();
    expect(screen.getByText(/Near Threatened/i)).toBeDefined();

    rerender(<ConservationBadge status="LC" showTitle={true} />);
    expect(screen.getByText('LC')).toBeDefined();
    expect(screen.getByText(/Least Concern/i)).toBeDefined();
  });

  it('renders Domesticated species status correctly', () => {
    render(<ConservationBadge status="DOMESTIC" showTitle={true} />);
    expect(screen.getByText('DOMESTIC')).toBeDefined();
    expect(screen.getByText(/Domesticated/i)).toBeDefined();
  });
});
