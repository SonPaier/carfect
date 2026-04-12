import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionSummaryCard } from './SubscriptionSummaryCard';
import type { SubscriptionSummary } from './billing.types';

const baseSummary: SubscriptionSummary = {
  monthlyPrice: 99,
  stationLimit: 3,
  status: 'active',
  isTrial: false,
  trialExpiresAt: null,
  currentPeriodStart: '2026-04-01',
  currentPeriodEnd: '2026-04-30',
  nextBillingDate: '2026-05-01',
  smsUsed: 40,
  smsLimit: 100,
};

describe('SubscriptionSummaryCard', () => {
  it('renders monthly price with VAT info', () => {
    render(<SubscriptionSummaryCard summary={baseSummary} />);
    expect(screen.getByText(/99 zł netto \/ mies\./)).toBeInTheDocument();
    expect(screen.getByText('powiększone o 23% VAT')).toBeInTheDocument();
  });

  it('renders station count', () => {
    render(<SubscriptionSummaryCard summary={baseSummary} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders active status badge', () => {
    render(<SubscriptionSummaryCard summary={baseSummary} />);
    expect(screen.getByText('Aktywna')).toBeInTheDocument();
  });

  it('renders inactive status badge', () => {
    render(<SubscriptionSummaryCard summary={{ ...baseSummary, status: 'inactive' }} />);
    expect(screen.getByText('Nieaktywna')).toBeInTheDocument();
  });

  it('renders current period dates formatted as DD.MM.YYYY', () => {
    render(<SubscriptionSummaryCard summary={baseSummary} />);
    // currentPeriodEnd=2026-04-30, display shows day before: 29.04.2026
    // Appears in both "Obecny okres" and SMS label
    const periodTexts = screen.getAllByText(/01\.04\.2026.*29\.04\.2026/);
    expect(periodTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders next billing date', () => {
    render(<SubscriptionSummaryCard summary={baseSummary} />);
    expect(screen.getByText('01.05.2026')).toBeInTheDocument();
  });

  it('renders SMS usage within limit', () => {
    render(<SubscriptionSummaryCard summary={baseSummary} />);
    expect(screen.getByText('40 / 100')).toBeInTheDocument();
  });

  it('shows SMS overage cost when over limit', () => {
    render(<SubscriptionSummaryCard summary={{ ...baseSummary, smsUsed: 120, smsLimit: 100 }} />);
    expect(screen.getByText(/\+20 SMS ponad limit = 2,40 zł netto/)).toBeInTheDocument();
  });

  it('does not show overage when within limit', () => {
    render(<SubscriptionSummaryCard summary={baseSummary} />);
    expect(screen.queryByText(/ponad limit/)).not.toBeInTheDocument();
  });

  it('does not show overage when SMS exactly at limit (boundary)', () => {
    render(<SubscriptionSummaryCard summary={{ ...baseSummary, smsUsed: 100, smsLimit: 100 }} />);
    expect(screen.getByText('100 / 100')).toBeInTheDocument();
    expect(screen.queryByText(/ponad limit/)).not.toBeInTheDocument();
  });

  it('renders dash for null dates', () => {
    render(
      <SubscriptionSummaryCard
        summary={{ ...baseSummary, currentPeriodStart: null, currentPeriodEnd: null, nextBillingDate: null }}
      />,
    );
    // formatDate(null) returns '—'
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });
});
