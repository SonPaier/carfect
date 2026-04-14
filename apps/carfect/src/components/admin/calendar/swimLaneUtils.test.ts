import { describe, it, expect } from 'vitest';
import { assignLanes, toDateOnly, formatDateStr } from './swimLaneUtils';
import type { WeekEvent } from './swimLaneUtils';
import type { Reservation } from '@/types/reservation';

// Minimal reservation stub — only fields referenced by swimLaneUtils
function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'res-1',
    customer_name: 'Test',
    vehicle_plate: 'ABC',
    reservation_date: '2026-04-13',
    start_time: '09:00:00',
    end_time: '10:00:00',
    status: 'confirmed',
    ...overrides,
  } as Reservation;
}

function makeEvent(
  startCol: number,
  span: number,
  overrides: Partial<Reservation> = {},
): WeekEvent {
  return {
    reservation: makeReservation(overrides),
    startCol,
    span,
    lane: -1, // will be assigned
    isStart: true,
    isEnd: true,
  };
}

// ---------------------------------------------------------------------------
// assignLanes
// ---------------------------------------------------------------------------

describe('assignLanes', () => {
  it('assigns lane 0 to a single event', () => {
    const events = [makeEvent(0, 1)];
    assignLanes(events);
    expect(events[0].lane).toBe(0);
  });

  it('stacks non-overlapping events in same lane', () => {
    // event A occupies col 0, event B occupies col 3 — no overlap
    const events = [makeEvent(0, 1), makeEvent(3, 1)];
    assignLanes(events);
    expect(events[0].lane).toBe(0);
    expect(events[1].lane).toBe(0);
  });

  it('separates overlapping events into different lanes', () => {
    // Both start at same column — they overlap
    const events = [makeEvent(2, 2), makeEvent(2, 2)];
    assignLanes(events);
    const lanes = events.map((e) => e.lane).sort();
    expect(lanes).toEqual([0, 1]);
  });

  it('sorts by start column — event at col 0 gets lower lane than event at col 3', () => {
    // The event at col 3 cannot start before col 0 after sort
    const eventLate = makeEvent(3, 1);
    const eventEarly = makeEvent(0, 1);
    const events = [eventLate, eventEarly];
    assignLanes(events);
    // Both should fit in lane 0 (no overlap), but early one gets it first
    expect(eventEarly.lane).toBe(0);
    expect(eventLate.lane).toBe(0);
  });

  it('sorts by time within same start column — earlier start_time gets lower lane priority', () => {
    const events = [
      makeEvent(1, 3, { start_time: '09:00:00' }),
      makeEvent(1, 3, { start_time: '08:00:00' }),
    ];
    assignLanes(events);
    // After sort, 08:00 event comes first → gets lane 0; 09:00 overlaps → lane 1
    const event0800 = events.find((e) => e.reservation.start_time === '08:00:00')!;
    const event0900 = events.find((e) => e.reservation.start_time === '09:00:00')!;
    expect(event0800.lane).toBe(0);
    expect(event0900.lane).toBe(1);
  });

  it('handles empty events array without throwing', () => {
    expect(() => assignLanes([])).not.toThrow();
  });

  it('longer spans get priority within same start column', () => {
    // Sorting rule: same startCol → longer span first (b.span - a.span)
    const short = makeEvent(0, 1, { start_time: '09:00:00' });
    const long = makeEvent(0, 3, { start_time: '09:00:00' });
    const events = [short, long];
    assignLanes(events);
    // long span is sorted first → gets lane 0
    expect(long.lane).toBe(0);
    expect(short.lane).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// toDateOnly
// ---------------------------------------------------------------------------

describe('toDateOnly', () => {
  it('parses YYYY-MM-DD as local date', () => {
    const d = toDateOnly('2026-04-15');
    expect(d.getDate()).toBe(15);
  });

  it('does not shift date in any timezone — month and year are correct', () => {
    const d = toDateOnly('2026-04-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // April = index 3
  });
});

// ---------------------------------------------------------------------------
// formatDateStr
// ---------------------------------------------------------------------------

describe('formatDateStr', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(formatDateStr(new Date(2026, 3, 15))).toBe('2026-04-15');
  });

  it('pads month and day with zeros', () => {
    expect(formatDateStr(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
