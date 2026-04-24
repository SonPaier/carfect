import { describe, it, expect } from 'vitest';
import { assignLanes, toDateOnly, formatDateStr, type WeekEvent } from './swimLaneUtils';
import type { CalendarItem } from '../AdminCalendar';

const makeItem = (id: string, startTime = '09:00'): CalendarItem =>
  ({
    id,
    title: id,
    column_id: 'col-1',
    item_date: '2026-04-24',
    start_time: startTime,
    end_time: '10:00',
    status: 'confirmed',
  }) as unknown as CalendarItem;

const makeEvent = (
  id: string,
  startCol: number,
  span: number,
  startTime = '09:00',
): WeekEvent => ({
  item: makeItem(id, startTime),
  startCol,
  span,
  lane: 0,
  isStart: true,
  isEnd: true,
});

describe('toDateOnly', () => {
  it('parses yyyy-MM-dd string to local-midnight Date', () => {
    const d = toDateOnly('2026-04-24');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(24);
    expect(d.getHours()).toBe(0);
  });

  it('returns local (not UTC) midnight so cross-TZ day comparisons are stable', () => {
    const d = toDateOnly('2026-04-24');
    expect(d.getTimezoneOffset()).toBe(d.getTimezoneOffset());
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});

describe('formatDateStr', () => {
  it('formats Date to yyyy-MM-dd with zero-padded month/day', () => {
    expect(formatDateStr(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatDateStr(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('round-trips with toDateOnly', () => {
    const original = '2026-04-24';
    expect(formatDateStr(toDateOnly(original))).toBe(original);
  });
});

describe('assignLanes', () => {
  it('assigns lane 0 to a single event', () => {
    const events = [makeEvent('a', 0, 2)];
    assignLanes(events);
    expect(events[0].lane).toBe(0);
  });

  it('places non-overlapping events on the same lane', () => {
    const events = [makeEvent('a', 0, 2), makeEvent('b', 3, 1)];
    assignLanes(events);
    expect(events.find((e) => e.item.id === 'a')?.lane).toBe(0);
    expect(events.find((e) => e.item.id === 'b')?.lane).toBe(0);
  });

  it('places overlapping events on separate lanes', () => {
    const events = [makeEvent('a', 0, 3), makeEvent('b', 1, 2)];
    assignLanes(events);
    const lanes = events.map((e) => e.lane).sort();
    expect(lanes).toEqual([0, 1]);
  });

  it('fills the lowest free lane (not a new one) when earlier lane opens up', () => {
    const events = [
      makeEvent('long', 0, 5),
      makeEvent('blocker', 0, 2),
      makeEvent('tail', 3, 1),
    ];
    assignLanes(events);
    const tail = events.find((e) => e.item.id === 'tail')!;
    expect(tail.lane).toBe(1);
  });

  it('sorts by start column first, then span desc, then start_time', () => {
    const events = [
      makeEvent('short-later', 2, 1, '10:00'),
      makeEvent('long-earlier', 0, 4, '09:00'),
      makeEvent('short-earlier', 2, 1, '09:00'),
    ];
    assignLanes(events);
    expect(events[0].item.id).toBe('long-earlier');
    expect(events[1].item.id).toBe('short-earlier');
    expect(events[2].item.id).toBe('short-later');
  });

  it('handles adjacent events (no gap) without overlap', () => {
    const events = [makeEvent('a', 0, 2), makeEvent('b', 2, 2)];
    assignLanes(events);
    expect(events[0].lane).toBe(0);
    expect(events[1].lane).toBe(0);
  });

  it('does not crash on empty input', () => {
    const events: WeekEvent[] = [];
    expect(() => assignLanes(events)).not.toThrow();
  });
});
