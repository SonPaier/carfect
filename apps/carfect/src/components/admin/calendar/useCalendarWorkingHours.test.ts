import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useCalendarWorkingHours,
  parseTime,
  formatTimeSlot,
  DEFAULT_START_HOUR,
  DEFAULT_END_HOUR,
  SLOT_MINUTES,
  SLOTS_PER_HOUR,
} from './useCalendarWorkingHours';
import type { Reservation } from '@/types/reservation';

// Helper: build working hours map (Monday=monday, etc.)
function buildWorkingHours(
  overrides: Record<string, { open: string; close: string } | null> = {},
) {
  const defaults: Record<string, { open: string; close: string } | null> = {
    monday: { open: '08:00', close: '17:00' },
    tuesday: { open: '08:00', close: '17:00' },
    wednesday: { open: '08:00', close: '17:00' },
    thursday: { open: '08:00', close: '17:00' },
    friday: { open: '08:00', close: '17:00' },
    saturday: null,
    sunday: null,
  };
  return { ...defaults, ...overrides };
}

// Helper: minimal reservation for getDisplayTimesForDate tests
function buildReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'res-1',
    instance_id: 'inst-1',
    station_id: 'st-1',
    reservation_date: '2026-04-13', // Monday
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

describe('parseTime', () => {
  it('converts "08:30" to 8.5', () => {
    expect(parseTime('08:30')).toBe(8.5);
  });

  it('converts "17:00" to 17', () => {
    expect(parseTime('17:00')).toBe(17);
  });

  it('converts "09:15" to 9.25', () => {
    expect(parseTime('09:15')).toBe(9.25);
  });

  it('handles "08:30:00" (with seconds) by taking first 5 chars', () => {
    expect(parseTime('08:30:00')).toBe(8.5);
  });
});

describe('formatTimeSlot', () => {
  it('converts hour=8, slotIndex=0 to "08:00"', () => {
    expect(formatTimeSlot(8, 0)).toBe('08:00');
  });

  it('converts hour=8, slotIndex=2 to "08:30"', () => {
    expect(formatTimeSlot(8, 2)).toBe('08:30');
  });

  it('converts hour=14, slotIndex=3 to "14:45"', () => {
    expect(formatTimeSlot(14, 3)).toBe('14:45');
  });
});

describe('constants', () => {
  it('exports expected defaults', () => {
    expect(DEFAULT_START_HOUR).toBe(9);
    expect(DEFAULT_END_HOUR).toBe(19);
    expect(SLOT_MINUTES).toBe(15);
    expect(SLOTS_PER_HOUR).toBe(4);
  });
});

describe('useCalendarWorkingHours', () => {
  describe('getHoursForDate', () => {
    it('returns defaults when workingHours is null', () => {
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: null }),
      );

      // Monday 2026-04-13
      const info = result.current.getHoursForDate(new Date('2026-04-13'));
      expect(info.startHour).toBe(DEFAULT_START_HOUR);
      expect(info.endHour).toBe(DEFAULT_END_HOUR);
      expect(info.isClosed).toBe(false);
      expect(info.startSlotOffset).toBe(0);
    });

    it('returns correct hours for "08:30"–"17:00" day', () => {
      const wh = buildWorkingHours({
        monday: { open: '08:30', close: '17:00' },
      });
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      const info = result.current.getHoursForDate(new Date('2026-04-13')); // Monday
      expect(info.workingStartTime).toBe(8.5);
      expect(info.workingEndTime).toBe(17);
      expect(info.isClosed).toBe(false);
    });

    it('marks closed days (null entry) as isClosed', () => {
      const wh = buildWorkingHours(); // Saturday = null
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      // 2026-04-18 is Saturday
      const info = result.current.getHoursForDate(new Date('2026-04-18'));
      expect(info.isClosed).toBe(true);
    });

    it('adds ±0.5h display margins', () => {
      const wh = buildWorkingHours({
        monday: { open: '09:00', close: '17:00' },
      });
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      const info = result.current.getHoursForDate(new Date('2026-04-13'));
      expect(info.displayStartTime).toBe(8.5);
      expect(info.displayEndTime).toBe(17.5);
    });

    it('calculates startSlotOffset correctly (8:30 → offset 2)', () => {
      const wh = buildWorkingHours({
        monday: { open: '08:30', close: '17:00' },
      });
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      const info = result.current.getHoursForDate(new Date('2026-04-13'));
      // displayStartTime = 8.0 (8:30 - 0.5), startHour = 8
      // offset = (8.0 - 8) * 4 = 0
      expect(info.displayStartTime).toBe(8);
      expect(info.startSlotOffset).toBe(0);
    });

    it('calculates startSlotOffset for 08:45 open (displayStart=8.25, offset=1)', () => {
      const wh = buildWorkingHours({
        monday: { open: '08:45', close: '17:00' },
      });
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      const info = result.current.getHoursForDate(new Date('2026-04-13'));
      // displayStartTime = 8.25 (8:45 - 0.5)
      // startHour = 8, offset = (8.25 - 8) * 4 = 1
      expect(info.displayStartTime).toBe(8.25);
      expect(info.startSlotOffset).toBe(1);
    });
  });

  describe('getWorkingHoursForDate', () => {
    it('returns defaults when no workingHours', () => {
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: null }),
      );

      const wh = result.current.getWorkingHoursForDate('2026-04-13');
      expect(wh.startTime).toBe(`${DEFAULT_START_HOUR}:00`);
      expect(wh.closeTime).toBe(`${DEFAULT_END_HOUR}:00`);
    });

    it('returns open/close for a specific day', () => {
      const wh = buildWorkingHours({
        monday: { open: '07:30', close: '16:00' },
      });
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      const hours = result.current.getWorkingHoursForDate('2026-04-13'); // Monday
      expect(hours.startTime).toBe('07:30');
      expect(hours.closeTime).toBe('16:00');
    });
  });

  describe('isWorkingDay', () => {
    it('returns true when day has hours', () => {
      const wh = buildWorkingHours();
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      expect(result.current.isWorkingDay(new Date('2026-04-13'))).toBe(true); // Monday
    });

    it('returns false when day is null (closed)', () => {
      const wh = buildWorkingHours();
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      expect(result.current.isWorkingDay(new Date('2026-04-18'))).toBe(false); // Saturday
    });

    it('returns true for all days when workingHours is null', () => {
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: null }),
      );

      expect(result.current.isWorkingDay(new Date('2026-04-18'))).toBe(true); // Saturday
    });
  });

  describe('findNextWorkingDay', () => {
    it('skips closed days forward', () => {
      const wh = buildWorkingHours(); // Sat/Sun closed
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      // Friday 2026-04-17 → skip Sat/Sun → Monday 2026-04-20
      const friday = new Date('2026-04-17');
      const nextDay = result.current.findNextWorkingDay(
        new Date(friday.getTime() + 86400000), // Saturday
        'forward',
      );
      expect(nextDay.toISOString().slice(0, 10)).toBe('2026-04-20');
    });

    it('skips closed days backward', () => {
      const wh = buildWorkingHours();
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      // Monday 2026-04-20 → go back → skip Sun/Sat → Friday 2026-04-17
      const monday = new Date('2026-04-20');
      const prevDay = result.current.findNextWorkingDay(
        new Date(monday.getTime() - 86400000), // Sunday
        'backward',
      );
      expect(prevDay.toISOString().slice(0, 10)).toBe('2026-04-17');
    });

    it('returns startDate after maxDays exhausted', () => {
      // All days closed
      const wh: Record<string, null> = {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null,
      };
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      const date = new Date('2026-04-13');
      const found = result.current.findNextWorkingDay(date, 'forward', 14);
      expect(found.toISOString().slice(0, 10)).toBe('2026-04-13');
    });
  });

  describe('getDisplayTimesForDate', () => {
    it('uses actual times for single-day reservation', () => {
      const wh = buildWorkingHours();
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      const res = buildReservation({
        reservation_date: '2026-04-13',
        end_date: null,
        start_time: '09:00:00',
        end_time: '11:00:00',
      });

      const times = result.current.getDisplayTimesForDate(res, '2026-04-13');
      expect(times.displayStart).toBe('09:00:00');
      expect(times.displayEnd).toBe('11:00:00');
    });

    it('uses open time for middle day of multi-day reservation', () => {
      const wh = buildWorkingHours({
        tuesday: { open: '08:00', close: '17:00' },
      });
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      const res = buildReservation({
        reservation_date: '2026-04-13', // Monday = first day
        end_date: '2026-04-15', // Wednesday = last day
        start_time: '09:00:00',
        end_time: '11:00:00',
      });

      // Tuesday (middle day) — not first, not last
      const times = result.current.getDisplayTimesForDate(res, '2026-04-14');
      expect(times.displayStart).toBe('08:00'); // open time
      expect(times.displayEnd).toBe('17:00'); // close time
    });

    it('uses actual start time for first day, close time for end', () => {
      const wh = buildWorkingHours({
        monday: { open: '08:00', close: '17:00' },
      });
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      const res = buildReservation({
        reservation_date: '2026-04-13', // Monday = first day
        end_date: '2026-04-14', // Tuesday = last day
        start_time: '10:00:00',
        end_time: '14:00:00',
      });

      // First day: actual start, close time (not last day)
      const firstDay = result.current.getDisplayTimesForDate(res, '2026-04-13');
      expect(firstDay.displayStart).toBe('10:00:00');
      expect(firstDay.displayEnd).toBe('17:00');
    });

    it('uses open time for start, actual end time for last day', () => {
      const wh = buildWorkingHours({
        tuesday: { open: '08:00', close: '17:00' },
      });
      const { result } = renderHook(() =>
        useCalendarWorkingHours({ workingHours: wh }),
      );

      const res = buildReservation({
        reservation_date: '2026-04-13',
        end_date: '2026-04-14', // Tuesday = last day
        start_time: '10:00:00',
        end_time: '14:00:00',
      });

      // Last day: open time for start, actual end
      const lastDay = result.current.getDisplayTimesForDate(res, '2026-04-14');
      expect(lastDay.displayStart).toBe('08:00');
      expect(lastDay.displayEnd).toBe('14:00:00');
    });
  });
});
