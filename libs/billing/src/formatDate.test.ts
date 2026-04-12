import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats date-only string as DD.MM.YYYY', () => {
    expect(formatDate('2026-04-12')).toBe('12.04.2026');
  });

  it('formats ISO timestamp as DD.MM.YYYY using UTC', () => {
    expect(formatDate('2026-04-12T00:00:00Z')).toBe('12.04.2026');
  });

  it('pads single-digit day and month', () => {
    expect(formatDate('2026-01-05')).toBe('05.01.2026');
  });

  it('handles last day of year', () => {
    expect(formatDate('2026-12-31')).toBe('31.12.2026');
  });

  it('handles first day of year', () => {
    expect(formatDate('2026-01-01')).toBe('01.01.2026');
  });

  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('returns dash for invalid date string', () => {
    expect(formatDate('invalid')).toBe('—');
  });

  it('returns dash for malformed date', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });

  // UTC boundary: '2026-04-30T23:59:59Z' should still be April 30 in UTC
  it('does not shift date across timezone boundary', () => {
    expect(formatDate('2026-04-30T23:59:59Z')).toBe('30.04.2026');
  });

  // Date-only string parsed as UTC midnight — should not shift backwards
  it('date-only string stays correct regardless of local timezone', () => {
    expect(formatDate('2026-03-01')).toBe('01.03.2026');
  });
});
