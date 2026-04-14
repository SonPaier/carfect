import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import {
  DEFAULT_VIEW_CONFIG,
  getViewConfig,
  mergeViewConfig,
  toggleInSet,
} from './useCalendarConfig';

// ---------- Pure function tests ----------

describe('getViewConfig', () => {
  it('returns defaults when config is empty', () => {
    const result = getViewConfig({}, 'day');
    expect(result).toEqual(DEFAULT_VIEW_CONFIG);
  });

  it('returns defaults when view has no config', () => {
    const config = { week: { grouping_mode: 'employee' as const } };
    const result = getViewConfig(config, 'day');
    expect(result).toEqual(DEFAULT_VIEW_CONFIG);
  });

  it('merges partial config with defaults', () => {
    const config = { day: { grouping_mode: 'employee' as const, compact_mode: true } };
    const result = getViewConfig(config, 'day');
    expect(result.grouping_mode).toBe('employee');
    expect(result.compact_mode).toBe(true);
    expect(result.show_notes_in_bars).toBe(false); // default
    expect(result.hidden_stations).toEqual([]); // default
  });

  it('returns stored hidden_stations', () => {
    const config = { week: { hidden_stations: ['s1', 's2'] } };
    const result = getViewConfig(config, 'week');
    expect(result.hidden_stations).toEqual(['s1', 's2']);
  });

  it('handles all three view modes independently', () => {
    const config = {
      day: { grouping_mode: 'employee' as const },
      week: { grouping_mode: 'none' as const },
      month: { compact_mode: true },
    };
    expect(getViewConfig(config, 'day').grouping_mode).toBe('employee');
    expect(getViewConfig(config, 'week').grouping_mode).toBe('none');
    expect(getViewConfig(config, 'month').grouping_mode).toBe('station'); // default
    expect(getViewConfig(config, 'month').compact_mode).toBe(true);
  });
});

describe('mergeViewConfig', () => {
  it('creates new view entry on empty config', () => {
    const result = mergeViewConfig({}, 'day', { grouping_mode: 'employee' });
    expect(result.day?.grouping_mode).toBe('employee');
    expect(result.day?.compact_mode).toBe(false); // filled from defaults
  });

  it('preserves other views when updating one', () => {
    const config = {
      day: { grouping_mode: 'employee' as const, compact_mode: true, show_notes_in_bars: false, hidden_stations: [] },
      week: { grouping_mode: 'none' as const, compact_mode: false, show_notes_in_bars: true, hidden_stations: [] },
    };
    const result = mergeViewConfig(config, 'week', { compact_mode: true });
    expect(result.day?.grouping_mode).toBe('employee'); // unchanged
    expect(result.week?.compact_mode).toBe(true); // updated
    expect(result.week?.grouping_mode).toBe('none'); // preserved
    expect(result.week?.show_notes_in_bars).toBe(true); // preserved
  });

  it('preserves existing fields in the same view', () => {
    const config = {
      month: { grouping_mode: 'none' as const, compact_mode: true, show_notes_in_bars: false, hidden_stations: ['s1'] },
    };
    const result = mergeViewConfig(config, 'month', { show_notes_in_bars: true });
    expect(result.month?.grouping_mode).toBe('none');
    expect(result.month?.compact_mode).toBe(true);
    expect(result.month?.show_notes_in_bars).toBe(true);
    expect(result.month?.hidden_stations).toEqual(['s1']);
  });
});

describe('toggleInSet', () => {
  it('adds item to empty array', () => {
    expect(toggleInSet([], 'a')).toEqual(['a']);
  });

  it('adds item to existing array', () => {
    const result = toggleInSet(['a', 'b'], 'c');
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).toContain('c');
    expect(result).toHaveLength(3);
  });

  it('removes item if already present', () => {
    const result = toggleInSet(['a', 'b', 'c'], 'b');
    expect(result).toContain('a');
    expect(result).not.toContain('b');
    expect(result).toContain('c');
    expect(result).toHaveLength(2);
  });

  it('handles single item removal', () => {
    expect(toggleInSet(['a'], 'a')).toEqual([]);
  });

  it('does not produce duplicates when adding', () => {
    const result = toggleInSet(['a'], 'b');
    expect(result).toEqual(['a', 'b']);
  });
});

// ---------- Hook integration tests ----------

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'instances') {
        return {
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
          update: mockUpdate.mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    }),
  },
}));

import { useCalendarConfig } from './useCalendarConfig';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useCalendarConfig hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({
      data: { calendar_config: {} },
      error: null,
    });
  });

  it('returns defaults when DB config is empty', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCalendarConfig('test-instance'),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.getGroupingMode('day')).toBe('station');
      expect(result.current.getCompactMode('day')).toBe(false);
      expect(result.current.getShowNotesInBars('day')).toBe(false);
      expect(result.current.getHiddenStations('day').size).toBe(0);
    });
  });

  it('reads stored config from DB per view', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        calendar_config: {
          day: { grouping_mode: 'employee', compact_mode: true },
          week: { grouping_mode: 'none', show_notes_in_bars: true },
        },
      },
      error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCalendarConfig('test-instance'),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.getGroupingMode('day')).toBe('employee');
      expect(result.current.getCompactMode('day')).toBe(true);
      expect(result.current.getGroupingMode('week')).toBe('none');
      expect(result.current.getShowNotesInBars('week')).toBe(true);
      // month not configured → defaults
      expect(result.current.getGroupingMode('month')).toBe('station');
    });
  });

  it('does not fetch when instanceId is null', async () => {
    const wrapper = createWrapper();
    renderHook(() => useCalendarConfig(null), { wrapper });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('exposes setter functions', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCalendarConfig('test-instance'),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.getGroupingMode('day')).toBe('station');
    });

    // Verify all setters are functions
    expect(typeof result.current.setGroupingMode).toBe('function');
    expect(typeof result.current.toggleCompactMode).toBe('function');
    expect(typeof result.current.toggleShowNotesInBars).toBe('function');
    expect(typeof result.current.toggleStationVisibility).toBe('function');
    expect(typeof result.current.showAllStations).toBe('function');
  });

  it('reads hidden_stations as a Set', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        calendar_config: {
          week: { hidden_stations: ['s1', 's2'] },
        },
      },
      error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCalendarConfig('test-instance'),
      { wrapper },
    );

    await waitFor(() => {
      const hidden = result.current.getHiddenStations('week');
      expect(hidden).toBeInstanceOf(Set);
      expect(hidden.size).toBe(2);
      expect(hidden.has('s1')).toBe(true);
      expect(hidden.has('s2')).toBe(true);
    });
  });
});
