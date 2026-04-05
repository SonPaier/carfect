import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

// Must mock supabase before importing the module under test
vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  calculateMonthlySummary,
  formatMinutesToTime,
  useTimeEntries,
  useTimeEntriesForMonth,
  useTimeEntriesForDateRange,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
} from './useTimeEntries';
import type { TimeEntry } from './useTimeEntries';

// ============================================================
// Helpers
// ============================================================

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function createWrapperWithClient(gcTime = 0) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

const INSTANCE_ID = 'inst-1';

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

  it('maps contain exactly as many keys as unique employees', () => {
    const entries: TimeEntry[] = [
      makeEntry({ id: 'e1', employee_id: 'emp-1', total_minutes: 30 }),
      makeEntry({ id: 'e2', employee_id: 'emp-2', total_minutes: 30 }),
      makeEntry({ id: 'e3', employee_id: 'emp-3', total_minutes: 30 }),
    ];
    const result = calculateMonthlySummary(entries);
    expect(result.size).toBe(3);
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

  it('formats large values correctly', () => {
    // 24 hours = 1440 minutes
    expect(formatMinutesToTime(1440)).toBe('24h 0min');
  });

  it('returns "0h 0min" for negative values', () => {
    expect(formatMinutesToTime(-90)).toBe('0h 0min');
  });
});

// ============================================================
// useTimeEntries
// ============================================================

describe('useTimeEntries', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('returns empty array and does not fetch when instanceId is null', () => {
    const { result } = renderHook(() => useTimeEntries(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('fetches time entries for a valid instanceId', async () => {
    const entries = [
      makeEntry({ id: 'e1', total_minutes: 60 }),
      makeEntry({ id: 'e2', total_minutes: 90 }),
    ];
    mockSupabaseQuery('time_entries', { data: entries, error: null });

    const { result } = renderHook(() => useTimeEntries(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].id).toBe('e1');
  });

  it('returns empty array when Supabase returns null data', async () => {
    mockSupabaseQuery('time_entries', { data: null, error: null });

    const { result } = renderHook(() => useTimeEntries(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('propagates Supabase error', async () => {
    mockSupabaseQuery('time_entries', {
      data: null,
      error: { message: 'DB connection failed' },
    });

    const { result } = renderHook(() => useTimeEntries(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect((result.current.error as Error).message).toBe('DB connection failed');
  });

  it('is not fetching after successful query', async () => {
    mockSupabaseQuery('time_entries', { data: [], error: null });

    const { result } = renderHook(() => useTimeEntries(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('fetches entries filtered by employeeId when provided', async () => {
    const entries = [makeEntry({ employee_id: 'emp-5' })];
    mockSupabaseQuery('time_entries', { data: entries, error: null });

    const { result } = renderHook(() => useTimeEntries(INSTANCE_ID, 'emp-5'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].employee_id).toBe('emp-5');
  });

  it('fetches entries with dateFrom and dateTo filters', async () => {
    const entries = [makeEntry({ entry_date: '2026-03-01' })];
    mockSupabaseQuery('time_entries', { data: entries, error: null });

    const { result } = renderHook(
      () => useTimeEntries(INSTANCE_ID, null, '2026-03-01', '2026-03-31'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
  });
});

// ============================================================
// useTimeEntriesForMonth
// ============================================================

describe('useTimeEntriesForMonth', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('fetches entries for the given year and month', async () => {
    const entries = [makeEntry({ entry_date: '2026-03-15', total_minutes: 480 })];
    mockSupabaseQuery('time_entries', { data: entries, error: null });

    const { result } = renderHook(
      () => useTimeEntriesForMonth(INSTANCE_ID, 2026, 2), // month index 2 = March
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
  });

  it('does not fetch when instanceId is null', () => {
    const { result } = renderHook(() => useTimeEntriesForMonth(null, 2026, 2), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('returns empty array when no entries exist for the month', async () => {
    mockSupabaseQuery('time_entries', { data: null, error: null });

    const { result } = renderHook(
      () => useTimeEntriesForMonth(INSTANCE_ID, 2026, 0), // January
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

// ============================================================
// useTimeEntriesForDateRange
// ============================================================

describe('useTimeEntriesForDateRange', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('fetches entries for the specified date range', async () => {
    const entries = [
      makeEntry({ id: 'e1', entry_date: '2026-04-01' }),
      makeEntry({ id: 'e2', entry_date: '2026-04-05' }),
    ];
    mockSupabaseQuery('time_entries', { data: entries, error: null });

    const { result } = renderHook(
      () => useTimeEntriesForDateRange(INSTANCE_ID, '2026-04-01', '2026-04-30'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
  });

  it('does not fetch when instanceId is null', () => {
    const { result } = renderHook(
      () => useTimeEntriesForDateRange(null, '2026-04-01', '2026-04-30'),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
  });

  it('returns empty array when no entries exist in the range', async () => {
    mockSupabaseQuery('time_entries', { data: null, error: null });

    const { result } = renderHook(
      () => useTimeEntriesForDateRange(INSTANCE_ID, '2026-01-01', '2026-01-31'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

// ============================================================
// useCreateTimeEntry
// ============================================================

describe('useCreateTimeEntry', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('starts in idle state (not pending)', () => {
    const { result } = renderHook(() => useCreateTimeEntry(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
  });

  it('throws when instanceId is null', async () => {
    const { result } = renderHook(() => useCreateTimeEntry(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          employee_id: 'emp-1',
          entry_date: '2026-03-17',
        });
      }),
    ).rejects.toThrow('No instance ID');
  });

  it('creates a time entry and returns the new record', async () => {
    const newEntry = makeEntry({ id: 'new-entry-id', total_minutes: 480 });
    // insert → select resets currentMethod to 'select' → single uses 'time_entries:select'
    mockSupabaseQuery('time_entries', { data: newEntry, error: null });

    const { result } = renderHook(() => useCreateTimeEntry(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.mutateAsync({
        employee_id: 'emp-1',
        entry_date: '2026-03-17',
        start_time: '08:00',
        end_time: '16:00',
      });
    });

    expect(returnValue).toEqual(newEntry);
  });

  it('throws on Supabase insert error', async () => {
    mockSupabaseQuery('time_entries', {
      data: null,
      error: { message: 'Insert failed' },
    });

    const { result } = renderHook(() => useCreateTimeEntry(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          employee_id: 'emp-1',
          entry_date: '2026-03-17',
        });
      }),
    ).rejects.toThrow('Insert failed');
  });

  it('invalidates time_entries queries after successful create', async () => {
    const { queryClient, wrapper } = createWrapperWithClient();
    const newEntry = makeEntry({ id: 'new-entry-id' });
    mockSupabaseQuery('time_entries', { data: newEntry, error: null });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTimeEntry(INSTANCE_ID), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        employee_id: 'emp-1',
        entry_date: '2026-03-17',
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['time_entries', INSTANCE_ID] }),
      );
    });
  });
});

// ============================================================
// useUpdateTimeEntry
// ============================================================

describe('useUpdateTimeEntry', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('starts in idle state (not pending)', () => {
    const { result } = renderHook(() => useUpdateTimeEntry(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
  });

  it('updates a time entry and returns the updated record', async () => {
    const updatedEntry = makeEntry({ id: 'entry-1', end_time: '17:00', total_minutes: 540 });
    // update → eq → select resets to 'select' → single uses 'time_entries:select'
    mockSupabaseQuery('time_entries', { data: updatedEntry, error: null });

    const { result } = renderHook(() => useUpdateTimeEntry(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.mutateAsync({
        id: 'entry-1',
        end_time: '17:00',
      });
    });

    expect(returnValue).toEqual(updatedEntry);
  });

  it('throws on Supabase update error', async () => {
    mockSupabaseQuery('time_entries', {
      data: null,
      error: { message: 'Update failed' },
    });

    const { result } = renderHook(() => useUpdateTimeEntry(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          id: 'entry-1',
          end_time: '17:00',
        });
      }),
    ).rejects.toThrow('Update failed');
  });

  it('invalidates time_entries queries after successful update', async () => {
    const { queryClient, wrapper } = createWrapperWithClient();
    const updatedEntry = makeEntry({ id: 'entry-1', end_time: '17:00' });
    mockSupabaseQuery('time_entries', { data: updatedEntry, error: null });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTimeEntry(INSTANCE_ID), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'entry-1', end_time: '17:00' });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['time_entries', INSTANCE_ID] }),
      );
    });
  });
});

// ============================================================
// useDeleteTimeEntry
// ============================================================

describe('useDeleteTimeEntry', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('starts in idle state (not pending)', () => {
    const { result } = renderHook(() => useDeleteTimeEntry(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
  });

  it('deletes a time entry successfully without throwing', async () => {
    // delete → eq → then uses 'time_entries:delete'
    mockSupabaseQuery('time_entries', { data: null, error: null }, 'delete');

    const { result } = renderHook(() => useDeleteTimeEntry(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync('entry-1');
      }),
    ).resolves.not.toThrow();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('throws on Supabase delete error', async () => {
    mockSupabaseQuery(
      'time_entries',
      {
        data: null,
        error: { message: 'Delete failed' },
      },
      'delete',
    );

    const { result } = renderHook(() => useDeleteTimeEntry(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync('entry-1');
      }),
    ).rejects.toThrow('Delete failed');
  });

  it('invalidates time_entries queries after successful delete', async () => {
    const { queryClient, wrapper } = createWrapperWithClient();
    mockSupabaseQuery('time_entries', { data: null, error: null }, 'delete');

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteTimeEntry(INSTANCE_ID), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('entry-1');
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['time_entries', INSTANCE_ID] }),
      );
    });
  });
});
