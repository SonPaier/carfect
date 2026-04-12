import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCalendarOverlap } from './useCalendarOverlap';
import type { Reservation } from '@/types/reservation';

// Helper: minimal reservation
function buildReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'res-1',
    instance_id: 'inst-1',
    station_id: 'st-1',
    reservation_date: '2026-04-13',
    end_date: null,
    start_time: '09:00:00',
    end_time: '11:00:00',
    status: 'confirmed',
    customer_name: 'Test',
    customer_phone: null,
    customer_email: null,
    vehicle_plate: 'ABC1234',
    vehicle_brand: null,
    vehicle_model: null,
    service: null,
    services_data: [],
    price: null,
    price_netto: null,
    admin_notes: null,
    customer_notes: null,
    confirmation_code: null,
    created_at: '2026-04-13T00:00:00Z',
    car_size: null,
    assigned_employee_ids: [],
    offer_number: null,
    ...overrides,
  } as Reservation;
}

interface Break {
  id: string;
  station_id: string;
  break_date: string;
  start_time: string;
  end_time: string;
  note: string | null;
}

// Default hook options
function createHookOptions(overrides: Record<string, unknown> = {}) {
  return {
    reservations: [] as Reservation[],
    breaks: [] as Break[],
    getDisplayTimesForDate: (res: Reservation, _dateStr: string) => ({
      displayStart: res.start_time,
      displayEnd: res.end_time,
    }),
    getWorkingHoursForDate: (_dateStr: string) => ({
      startTime: '08:00',
      closeTime: '17:00',
    }),
    getBreaksForStationAndDate: (_stationId: string, _dateStr: string) => [] as Break[],
    isDateClosed: (_dateStr: string) => false,
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'calendar.noFreeTime') return 'Brak wolnego czasu';
      if (key === 'calendar.freeMinutes') return `${params?.minutes}min`;
      if (key === 'calendar.freeHours') return `${params?.hours}h`;
      if (key === 'calendar.freeHoursMinutes') return `${params?.hours}h ${params?.minutes}min`;
      return key;
    },
    ...overrides,
  };
}

describe('useCalendarOverlap', () => {
  describe('getOverlapInfo', () => {
    it('returns no overlap for single reservation', () => {
      const res = buildReservation({ id: 'r1' });
      const { result } = renderHook(() => useCalendarOverlap(createHookOptions()));

      const info = result.current.getOverlapInfo(res, [res], '2026-04-13');
      expect(info.hasOverlap).toBe(false);
      expect(info.total).toBe(1);
    });

    it('detects two overlapping reservations', () => {
      const r1 = buildReservation({ id: 'r1', start_time: '09:00:00', end_time: '11:00:00' });
      const r2 = buildReservation({ id: 'r2', start_time: '10:00:00', end_time: '12:00:00' });
      const all = [r1, r2];

      const { result } = renderHook(() => useCalendarOverlap(createHookOptions()));

      const info1 = result.current.getOverlapInfo(r1, all, '2026-04-13');
      expect(info1.hasOverlap).toBe(true);
      expect(info1.total).toBe(2);

      const info2 = result.current.getOverlapInfo(r2, all, '2026-04-13');
      expect(info2.hasOverlap).toBe(true);
      expect(info2.total).toBe(2);
    });

    it('builds transitive groups (A↔B, B↔C → group of 3)', () => {
      const rA = buildReservation({ id: 'rA', start_time: '09:00:00', end_time: '10:30:00' });
      const rB = buildReservation({ id: 'rB', start_time: '10:00:00', end_time: '11:30:00' });
      const rC = buildReservation({ id: 'rC', start_time: '11:00:00', end_time: '12:30:00' });
      const all = [rA, rB, rC];

      const { result } = renderHook(() => useCalendarOverlap(createHookOptions()));

      // A overlaps B, B overlaps C → all in one group of 3
      const infoA = result.current.getOverlapInfo(rA, all, '2026-04-13');
      expect(infoA.hasOverlap).toBe(true);
      expect(infoA.total).toBe(3);

      const infoC = result.current.getOverlapInfo(rC, all, '2026-04-13');
      expect(infoC.hasOverlap).toBe(true);
      expect(infoC.total).toBe(3);
    });

    it('returns correct index/total for each reservation in group', () => {
      const r1 = buildReservation({ id: 'r1', start_time: '09:00:00', end_time: '11:00:00' });
      const r2 = buildReservation({ id: 'r2', start_time: '10:00:00', end_time: '12:00:00' });
      const all = [r1, r2];

      const { result } = renderHook(() => useCalendarOverlap(createHookOptions()));

      const info1 = result.current.getOverlapInfo(r1, all, '2026-04-13');
      const info2 = result.current.getOverlapInfo(r2, all, '2026-04-13');

      // r1 starts earlier → index 0, r2 → index 1
      expect(info1.index).toBe(0);
      expect(info2.index).toBe(1);
    });

    it('excludes cancelled and no_show reservations', () => {
      const r1 = buildReservation({ id: 'r1', start_time: '09:00:00', end_time: '11:00:00' });
      const r2 = buildReservation({
        id: 'r2',
        start_time: '10:00:00',
        end_time: '12:00:00',
        status: 'cancelled',
      });
      const all = [r1, r2];

      const { result } = renderHook(() => useCalendarOverlap(createHookOptions()));

      const info = result.current.getOverlapInfo(r1, all, '2026-04-13');
      expect(info.hasOverlap).toBe(false);
      expect(info.total).toBe(1);
    });

    it('sorts group by start time, then by id', () => {
      const rB = buildReservation({ id: 'rB', start_time: '10:00:00', end_time: '12:00:00' });
      const rA = buildReservation({ id: 'rA', start_time: '10:00:00', end_time: '12:00:00' });
      const rC = buildReservation({ id: 'rC', start_time: '09:00:00', end_time: '11:00:00' });
      const all = [rB, rA, rC];

      const { result } = renderHook(() => useCalendarOverlap(createHookOptions()));

      // rC starts at 9:00 → index 0, rA/rB at 10:00 sorted by id: rA=1, rB=2
      const infoC = result.current.getOverlapInfo(rC, all, '2026-04-13');
      const infoA = result.current.getOverlapInfo(rA, all, '2026-04-13');
      const infoB = result.current.getOverlapInfo(rB, all, '2026-04-13');

      expect(infoC.index).toBe(0);
      expect(infoA.index).toBe(1);
      expect(infoB.index).toBe(2);
    });
  });

  describe('getFreeTimeForStation', () => {
    it('returns null for closed day (no working hours)', () => {
      const { result } = renderHook(() =>
        useCalendarOverlap(
          createHookOptions({
            getWorkingHoursForDate: () => ({ startTime: null, closeTime: null }),
          }),
        ),
      );

      expect(result.current.getFreeTimeForStation('st-1', '2026-04-13')).toBeNull();
    });

    it('returns full working hours when no reservations or breaks', () => {
      const { result } = renderHook(() =>
        useCalendarOverlap(
          createHookOptions({
            reservations: [],
            getWorkingHoursForDate: () => ({ startTime: '08:00', closeTime: '17:00' }),
          }),
        ),
      );

      const free = result.current.getFreeTimeForStation('st-1', '2026-04-13');
      expect(free).toEqual({ hours: 9, minutes: 0 }); // 9h
    });

    it('subtracts reservation and break time', () => {
      const res = buildReservation({
        id: 'r1',
        station_id: 'st-1',
        reservation_date: '2026-04-13',
        start_time: '09:00:00',
        end_time: '11:00:00', // 2h booked
      });
      const brk: Break = {
        id: 'b1',
        station_id: 'st-1',
        break_date: '2026-04-13',
        start_time: '12:00',
        end_time: '12:30', // 30min break
        note: null,
      };

      const { result } = renderHook(() =>
        useCalendarOverlap(
          createHookOptions({
            reservations: [res],
            getWorkingHoursForDate: () => ({ startTime: '08:00', closeTime: '17:00' }),
            getBreaksForStationAndDate: () => [brk],
          }),
        ),
      );

      // 9h - 2h - 0.5h = 6.5h = 6h 30min
      const free = result.current.getFreeTimeForStation('st-1', '2026-04-13');
      expect(free).toEqual({ hours: 6, minutes: 30 });
    });

    it('clamps to 0 minutes minimum', () => {
      const res = buildReservation({
        id: 'r1',
        station_id: 'st-1',
        reservation_date: '2026-04-13',
        start_time: '08:00:00',
        end_time: '17:00:00', // 9h = full day booked
      });

      const { result } = renderHook(() =>
        useCalendarOverlap(
          createHookOptions({
            reservations: [res],
            getWorkingHoursForDate: () => ({ startTime: '08:00', closeTime: '17:00' }),
          }),
        ),
      );

      const free = result.current.getFreeTimeForStation('st-1', '2026-04-13');
      expect(free).toEqual({ hours: 0, minutes: 0 });
    });
  });

  describe('formatFreeTime', () => {
    it('returns null for past dates', () => {
      const { result } = renderHook(() => useCalendarOverlap(createHookOptions()));

      // Use a date definitely in the past
      expect(result.current.formatFreeTime('st-1', '2020-01-01')).toBeNull();
    });

    it('returns null for closed days', () => {
      const { result } = renderHook(() =>
        useCalendarOverlap(
          createHookOptions({
            isDateClosed: () => true,
          }),
        ),
      );

      expect(result.current.formatFreeTime('st-1', '2030-04-13')).toBeNull();
    });

    it('returns hours-only string when minutes = 0', () => {
      const { result } = renderHook(() =>
        useCalendarOverlap(
          createHookOptions({
            getWorkingHoursForDate: () => ({ startTime: '08:00', closeTime: '17:00' }),
          }),
        ),
      );

      // No reservations → 9h free
      const text = result.current.formatFreeTime('st-1', '2030-04-13');
      expect(text).toBe('9h');
    });

    it('returns minutes-only string when hours = 0', () => {
      const res = buildReservation({
        id: 'r1',
        station_id: 'st-1',
        reservation_date: '2030-04-15',
        start_time: '08:00:00',
        end_time: '16:30:00', // leaves 30min
      });

      const { result } = renderHook(() =>
        useCalendarOverlap(
          createHookOptions({
            reservations: [res],
            getWorkingHoursForDate: () => ({ startTime: '08:00', closeTime: '17:00' }),
          }),
        ),
      );

      const text = result.current.formatFreeTime('st-1', '2030-04-15');
      expect(text).toBe('30min');
    });
  });
});
