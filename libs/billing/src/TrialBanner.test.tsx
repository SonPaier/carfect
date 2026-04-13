import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TrialBanner } from './TrialBanner';

const FIXED_NOW = new Date('2026-04-12T10:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TrialBanner', () => {
  it('renders trial expiration date formatted as DD.MM.YYYY', () => {
    render(<TrialBanner trialExpiresAt="2026-04-30T00:00:00.000Z" contactPhone="123456789" />);
    expect(screen.getByText(/30\.04\.2026/)).toBeInTheDocument();
  });

  it('renders CTA text', () => {
    render(<TrialBanner trialExpiresAt="2026-04-30T00:00:00.000Z" contactPhone="123456789" />);
    expect(screen.getByText(/Skontaktuj się aby aktywować lub przedłużyć/)).toBeInTheDocument();
  });

  it('renders phone number as clickable tel link', () => {
    render(<TrialBanner trialExpiresAt="2026-04-30T00:00:00.000Z" contactPhone="123456789" />);
    const link = screen.getByRole('link', { name: '123456789' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'tel:123456789');
  });

  it('calculates and displays days remaining', () => {
    // From 2026-04-12 to 2026-04-30 = 18 days
    render(<TrialBanner trialExpiresAt="2026-04-30T10:00:00.000Z" contactPhone="123456789" />);
    expect(screen.getByText(/Pozostało 18 dni/)).toBeInTheDocument();
  });

  it('shows 0 days when trial already expired', () => {
    render(<TrialBanner trialExpiresAt="2026-04-10T00:00:00.000Z" contactPhone="123456789" />);
    expect(screen.getByText(/Pozostało 0 dni/)).toBeInTheDocument();
  });

  it('shows 0 days when trial expires today', () => {
    // FIXED_NOW is 2026-04-12T10:00:00Z, trial expires at 2026-04-12T00:00:00Z (earlier same day)
    render(<TrialBanner trialExpiresAt="2026-04-12T00:00:00.000Z" contactPhone="123456789" />);
    expect(screen.getByText(/Pozostało 0 dni/)).toBeInTheDocument();
  });
});
