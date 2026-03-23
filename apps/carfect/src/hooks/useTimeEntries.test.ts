import { describe, it, expect, vi } from 'vitest';

// Must mock supabase before importing the module under test
vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

import { calculateMonthlySummary, formatMinutesToTime } from './useTimeEntries';
import type { TimeEntry } from './useTimeEntries';

// Helper to build a minimal TimeEntry
const makeEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry => ({
  id: 'entry-1',
  instance_id: 'inst-1',
  employee_id: 'emp-1',
  entry_date: '2026-03-17',
  entry_number: 1,
  entry_type: 'manual',
  start_time: null,
  end_time: null,
  total_minutes: null,
  is_auto_closed: null,
  created_at: null,
  updated_at: null,
  ...overrides,
});

// ============================================================
// calculateMonthlySummary
// ============================================================

describe('calculateMonthlySummary', () => {
  it('returns an empty map for an empty entries array', () => {
    const result = calculateMonthlySummary([]);
    expect(result.size).toBe(0);
  });

  it('sums total_minutes for a single employee', () => {
    const entries: TimeEntry[] = [
      makeEntry({ employee_id: 'emp-1', total_minutes: 60 }),
      makeEntry({ id: 'entry-2', employee_id: 'emp-1', total_minutes: 90 }),
    ];
    const result = calculateMonthlySummary(entries);
    expect(result.get('emp-1')?.total_minutes).toBe(150);
  });

  it('sums total_minutes separately for multiple employees', () => {
    const entries: TimeEntry[] = [
      makeEntry({ id: 'e1', employee_id: 'emp-1', total_minutes: 120 }),
      makeEntry({ id: 'e2', employee_id: 'emp-2', total_minutes: 30 }),
      makeEntry({ id: 'e3', employee_id: 'emp-1', total_minutes: 60 }),
    ];
    const result = calculateMonthlySummary(entries);
    expect(result.get('emp-1')?.total_minutes).toBe(180);
    expect(result.get('emp-2')?.total_minutes).toBe(30);
  });

  it('counts entries correctly', () => {
    const entries: TimeEntry[] = [
      makeEntry({ id: 'e1', employee_id: 'emp-1', total_minutes: 60 }),
      makeEntry({ id: 'e2', employee_id: 'emp-1', total_minutes: 90 }),
      makeEntry({ id: 'e3', employee_id: 'emp-1', total_minutes: 30 }),
    ];
    const result = calculateMonthlySummary(entries);
    expect(result.get('emp-1')?.entries_count).toBe(3);
  });

  it('treats null total_minutes as 0', () => {
    const entries: TimeEntry[] = [
      makeEntry({ id: 'e1', employee_id: 'emp-1', total_minutes: null }),
      makeEntry({ id: 'e2', employee_id: 'emp-1', total_minutes: 60 }),
    ];
    const result = calculateMonthlySummary(entries);
    expect(result.get('emp-1')?.total_minutes).toBe(60);
  });

  it('includes the correct employee_id in the summary', () => {
    const entries: TimeEntry[] = [makeEntry({ employee_id: 'emp-42', total_minutes: 45 })];
    const result = calculateMonthlySummary(entries);
    expect(result.get('emp-42')?.employee_id).toBe('emp-42');
  });

  it('handles multiple employees with null minutes', () => {
    const entries: TimeEntry[] = [
      makeEntry({ id: 'e1', employee_id: 'emp-1', total_minutes: null }),
      makeEntry({ id: 'e2', employee_id: 'emp-2', total_minutes: null }),
    ];
    const result = calculateMonthlySummary(entries);
    expect(result.get('emp-1')?.total_minutes).toBe(0);
    expect(result.get('emp-2')?.total_minutes).toBe(0);
  });
});

// ============================================================
// formatMinutesToTime
// ============================================================

describe('formatMinutesToTime', () => {
  it('returns "0h 0min" for null input', () => {
    expect(formatMinutesToTime(null)).toBe('0h 0min');
  });

  it('returns "0h 0min" for 0 minutes', () => {
    expect(formatMinutesToTime(0)).toBe('0h 0min');
  });

  it('formats exact hours correctly', () => {
    expect(formatMinutesToTime(60)).toBe('1h 0min');
  });

  it('formats hours and minutes correctly', () => {
    expect(formatMinutesToTime(90)).toBe('1h 30min');
  });

  it('formats only minutes (less than 1 hour)', () => {
    expect(formatMinutesToTime(45)).toBe('0h 45min');
  });

  it('formats multiple hours with minutes', () => {
    expect(formatMinutesToTime(150)).toBe('2h 30min');
  });

  it('formats 8 hours exactly', () => {
    expect(formatMinutesToTime(480)).toBe('8h 0min');
  });

  it('formats large values correctly', () => {
    // 24 hours = 1440 minutes
    expect(formatMinutesToTime(1440)).toBe('24h 0min');
  });

  it('formats 1 minute correctly', () => {
    expect(formatMinutesToTime(1)).toBe('0h 1min');
  });
});
