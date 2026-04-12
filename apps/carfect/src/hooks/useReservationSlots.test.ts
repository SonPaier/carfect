import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReservationSlots } from './useReservationSlots';
import type { DateRange } from 'react-day-picker';

const DEFAULT_OPTIONS = {
  open: true,
  isReservationMode: true,
  isEditMode: false,
  totalDurationMinutes: 0,
  onSlotPreviewChange: undefined,
};

describe('useReservationSlots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with a single empty slot', () => {
    const { result } = renderHook(() => useReservationSlots(DEFAULT_OPTIONS));

    expect(result.current.slots).toHaveLength(1);
    expect(result.current.slots[0].startTime).toBe('');
    expect(result.current.slots[0].endTime).toBe('');
    expect(result.current.slots[0].stationId).toBeNull();
    expect(result.current.slots[0].dateRange).toBeUndefined();
  });

  it('initializes reservationType as single', () => {
    const { result } = renderHook(() => useReservationSlots(DEFAULT_OPTIONS));

    expect(result.current.reservationType).toBe('single');
  });

  it('setManualStartTime updates slots[0].startTime', () => {
    const { result } = renderHook(() => useReservationSlots(DEFAULT_OPTIONS));

    act(() => {
      result.current.setManualStartTime('10:00');
    });

    expect(result.current.manualStartTime).toBe('10:00');
    expect(result.current.slots[0].startTime).toBe('10:00');
  });

  it('setManualEndTime updates slots[0].endTime', () => {
    const { result } = renderHook(() => useReservationSlots(DEFAULT_OPTIONS));

    act(() => {
      result.current.setManualEndTime('11:00');
    });

    expect(result.current.manualEndTime).toBe('11:00');
    expect(result.current.slots[0].endTime).toBe('11:00');
  });

  it('setManualStationId updates slots[0].stationId', () => {
    const { result } = renderHook(() => useReservationSlots(DEFAULT_OPTIONS));

    act(() => {
      result.current.setManualStationId('station-abc');
    });

    expect(result.current.manualStationId).toBe('station-abc');
    expect(result.current.slots[0].stationId).toBe('station-abc');
  });

  it('setDateRange updates slots[0].dateRange', () => {
    const { result } = renderHook(() => useReservationSlots(DEFAULT_OPTIONS));
    const range: DateRange = { from: new Date('2026-04-10'), to: new Date('2026-04-10') };

    act(() => {
      result.current.setDateRange(range);
    });

    expect(result.current.dateRange).toEqual(range);
    expect(result.current.slots[0].dateRange).toEqual(range);
  });

  it('auto-calculates end time when start time is set and duration > 0', () => {
    const { result, rerender } = renderHook(
      (opts) => useReservationSlots(opts),
      {
        initialProps: {
          ...DEFAULT_OPTIONS,
          totalDurationMinutes: 60,
        },
      },
    );

    act(() => {
      result.current.setManualStartTime('09:00');
    });

    // Re-render to trigger the effect
    rerender({ ...DEFAULT_OPTIONS, totalDurationMinutes: 60 });

    expect(result.current.manualEndTime).toBe('10:00');
  });

  it('does NOT auto-calculate end time when userModifiedEndTime is true', () => {
    const { result, rerender } = renderHook(
      (opts) => useReservationSlots(opts),
      {
        initialProps: {
          ...DEFAULT_OPTIONS,
          totalDurationMinutes: 60,
        },
      },
    );

    act(() => {
      result.current.setManualStartTime('09:00');
      result.current.setManualEndTime('14:00');
      result.current.setUserModifiedEndTime(true);
    });

    // Trigger re-render
    rerender({ ...DEFAULT_OPTIONS, totalDurationMinutes: 60 });

    // End time should remain user-set value, not auto-calculated 10:00
    expect(result.current.manualEndTime).toBe('14:00');
  });

  it('setManualStationId accepts null', () => {
    const { result } = renderHook(() => useReservationSlots(DEFAULT_OPTIONS));

    act(() => {
      result.current.setManualStationId('station-xyz');
    });
    expect(result.current.manualStationId).toBe('station-xyz');

    act(() => {
      result.current.setManualStationId(null);
    });
    expect(result.current.manualStationId).toBeNull();
  });
});
