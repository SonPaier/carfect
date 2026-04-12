import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { formatTime, getStatusBadge, getSourceLabel } from './reservationDisplay';

// Minimal TFunction mock that returns the key
const t = ((key: string, opts?: Record<string, unknown>) => {
  if (opts) return `${key}:${JSON.stringify(opts)}`;
  return key;
}) as unknown as TFunction;

describe('formatTime', () => {
  it('extracts HH:MM from a full time string', () => {
    expect(formatTime('09:30:00')).toBe('09:30');
  });

  it('returns first 5 chars of a short string', () => {
    expect(formatTime('14:00')).toBe('14:00');
  });

  it('returns empty string for empty input', () => {
    expect(formatTime('')).toBe('');
  });
});

describe('getStatusBadge', () => {
  it('renders confirmed badge', () => {
    const badge = getStatusBadge('confirmed', t);
    render(<>{badge}</>);
    expect(screen.getByText('reservations.statuses.confirmed')).toBeInTheDocument();
  });

  it('renders pending badge', () => {
    const badge = getStatusBadge('pending', t);
    render(<>{badge}</>);
    expect(screen.getByText('reservations.statuses.pending')).toBeInTheDocument();
  });

  it('renders in_progress badge', () => {
    const badge = getStatusBadge('in_progress', t);
    render(<>{badge}</>);
    expect(screen.getByText('reservations.statuses.inProgress')).toBeInTheDocument();
  });

  it('renders completed badge', () => {
    const badge = getStatusBadge('completed', t);
    render(<>{badge}</>);
    expect(screen.getByText('reservations.statuses.completed')).toBeInTheDocument();
  });

  it('renders cancelled badge', () => {
    const badge = getStatusBadge('cancelled', t);
    render(<>{badge}</>);
    expect(screen.getByText('reservations.statuses.cancelled')).toBeInTheDocument();
  });

  it('renders no_show badge', () => {
    const badge = getStatusBadge('no_show', t);
    render(<>{badge}</>);
    expect(screen.getByText('reservations.statuses.noShow')).toBeInTheDocument();
  });

  it('renders change_requested badge', () => {
    const badge = getStatusBadge('change_requested', t);
    render(<>{badge}</>);
    expect(screen.getByText('reservations.statuses.changeRequested')).toBeInTheDocument();
  });

  it('renders raw status for unknown statuses', () => {
    const badge = getStatusBadge('unknown_status', t);
    render(<>{badge}</>);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });
});

describe('getSourceLabel', () => {
  it('renders employee name when source is admin', () => {
    const badge = getSourceLabel('admin', 'Jan Kowalski', t);
    render(<>{badge}</>);
    expect(screen.getByText(/Jan Kowalski/)).toBeInTheDocument();
  });

  it('renders fallback employee label when source is null and no username', () => {
    const badge = getSourceLabel(null, null, t);
    render(<>{badge}</>);
    expect(screen.getByText(/reservations.sources.employee/)).toBeInTheDocument();
  });

  it('renders system source for online reservations', () => {
    const badge = getSourceLabel('online', null, t);
    render(<>{badge}</>);
    expect(screen.getByText(/reservations.sources.system/)).toBeInTheDocument();
  });

  it('renders system source for customer reservations', () => {
    const badge = getSourceLabel('customer', null, t);
    render(<>{badge}</>);
    expect(screen.getByText(/reservations.sources.system/)).toBeInTheDocument();
  });

  it('renders booksy source', () => {
    const badge = getSourceLabel('booksy', null, t);
    render(<>{badge}</>);
    expect(screen.getByText(/reservations.sources.booksy/)).toBeInTheDocument();
  });

  it('renders raw source for unknown sources', () => {
    const badge = getSourceLabel('some_crm', null, t);
    render(<>{badge}</>);
    expect(screen.getByText(/some_crm/)).toBeInTheDocument();
  });
});
