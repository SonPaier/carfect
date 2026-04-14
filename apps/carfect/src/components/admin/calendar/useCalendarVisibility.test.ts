import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarVisibility } from './useCalendarVisibility';

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]);
  }),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const stations = [
  { id: 'st-1', name: 'Station 1' },
  { id: 'st-2', name: 'Station 2' },
  { id: 'st-3', name: 'Station 3' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCalendarVisibility', () => {
  it('returns all stations as visible when none are hidden', () => {
    const { result } = renderHook(() =>
      useCalendarVisibility({ viewMode: 'week', stations }),
    );
    expect(result.current.visibleStations).toHaveLength(stations.length);
  });

  it('hides a toggled station', () => {
    const { result } = renderHook(() =>
      useCalendarVisibility({ viewMode: 'week', stations }),
    );

    act(() => {
      result.current.toggleStationVisibility('st-2');
    });

    const visibleIds = result.current.visibleStations.map((s) => s.id);
    expect(visibleIds).not.toContain('st-2');
    expect(visibleIds).toContain('st-1');
    expect(visibleIds).toContain('st-3');
  });

  it('showAllStations resets hidden set — all stations become visible again', () => {
    const { result } = renderHook(() =>
      useCalendarVisibility({ viewMode: 'week', stations }),
    );

    act(() => {
      result.current.toggleStationVisibility('st-1');
      result.current.toggleStationVisibility('st-3');
    });

    expect(result.current.visibleStations).toHaveLength(1);

    act(() => {
      result.current.showAllStations();
    });

    expect(result.current.visibleStations).toHaveLength(stations.length);
    expect(result.current.hasHiddenStations).toBe(false);
  });

  it('per-view visibility — hiding in day mode does not affect week mode', () => {
    // Mount in day mode and hide a station
    const dayHook = renderHook(
      ({ viewMode }) => useCalendarVisibility({ viewMode, stations }),
      { initialProps: { viewMode: 'day' as const } },
    );

    act(() => {
      dayHook.result.current.toggleStationVisibility('st-1');
    });

    // Switch to week mode — should see all stations
    dayHook.rerender({ viewMode: 'week' as const });

    const visibleIds = dayHook.result.current.visibleStations.map((s) => s.id);
    expect(visibleIds).toContain('st-1');
    expect(visibleIds).toHaveLength(stations.length);
  });

  it('showNotesInBars defaults to false when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useCalendarVisibility({ viewMode: 'week', stations }),
    );
    expect(result.current.showNotesInBars).toBe(false);
  });

  it('toggleShowNotesInBars switches false → true', () => {
    const { result } = renderHook(() =>
      useCalendarVisibility({ viewMode: 'week', stations }),
    );

    expect(result.current.showNotesInBars).toBe(false);

    act(() => {
      result.current.toggleShowNotesInBars();
    });

    expect(result.current.showNotesInBars).toBe(true);
  });

  it('toggleShowNotesInBars switches true → false on second call', () => {
    const { result } = renderHook(() =>
      useCalendarVisibility({ viewMode: 'week', stations }),
    );

    act(() => {
      result.current.toggleShowNotesInBars();
    });
    act(() => {
      result.current.toggleShowNotesInBars();
    });

    expect(result.current.showNotesInBars).toBe(false);
  });

  it('hasHiddenStations is true when at least one station is hidden', () => {
    const { result } = renderHook(() =>
      useCalendarVisibility({ viewMode: 'week', stations }),
    );

    act(() => {
      result.current.toggleStationVisibility('st-1');
    });

    expect(result.current.hasHiddenStations).toBe(true);
  });

  it('re-toggling a hidden station makes it visible again', () => {
    const { result } = renderHook(() =>
      useCalendarVisibility({ viewMode: 'week', stations }),
    );

    act(() => {
      result.current.toggleStationVisibility('st-2');
    });
    expect(result.current.visibleStations.map((s) => s.id)).not.toContain('st-2');

    act(() => {
      result.current.toggleStationVisibility('st-2');
    });
    expect(result.current.visibleStations.map((s) => s.id)).toContain('st-2');
  });
});
