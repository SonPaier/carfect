import { describe, it, expect } from 'vitest';
import { generateTimeSlots, getWorkingHoursRange, filterEndTimeOptions } from './utils';

describe('generateTimeSlots', () => {
  it('generates 15-minute slots from min to max inclusive', () => {
    const slots = generateTimeSlots('08:00', '09:00', 15);
    expect(slots).toEqual(['08:00', '08:15', '08:30', '08:45', '09:00']);
  });

  it('handles non-aligned step sizes', () => {
    const slots = generateTimeSlots('10:00', '11:00', 30);
    expect(slots).toEqual(['10:00', '10:30', '11:00']);
  });

  it('returns single slot when min equals max', () => {
    const slots = generateTimeSlots('12:00', '12:00', 15);
    expect(slots).toEqual(['12:00']);
  });
});

describe('getWorkingHoursRange', () => {
  it('returns fallback when workingHours is null', () => {
    expect(getWorkingHoursRange(null, new Date())).toEqual({ min: '06:00', max: '22:00' });
  });

  it('returns open time as min and close+1h as max', () => {
    const wh = { monday: { open: '08:00', close: '17:00' } };
    // Monday = day 1
    const monday = new Date(2026, 3, 20); // 2026-04-20 is Monday
    expect(getWorkingHoursRange(wh, monday)).toEqual({ min: '08:00', max: '18:00' });
  });

  it('caps max at 23:59 when close+1h exceeds midnight', () => {
    const wh = { monday: { open: '06:00', close: '23:30' } };
    const monday = new Date(2026, 3, 20);
    expect(getWorkingHoursRange(wh, monday)).toEqual({ min: '06:00', max: '23:59' });
  });
});

describe('filterEndTimeOptions', () => {
  const allOptions = ['08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30'];

  it('filters out times <= startTime for single-day reservations', () => {
    const result = filterEndTimeOptions(allOptions, '08:30', true);
    expect(result).toEqual(['08:45', '09:00', '09:15', '09:30']);
  });

  it('returns all options when startTime is undefined', () => {
    const result = filterEndTimeOptions(allOptions, undefined, true);
    expect(result).toEqual(allOptions);
  });

  it('returns all options for multi-day reservations regardless of startTime', () => {
    const result = filterEndTimeOptions(allOptions, '09:00', false);
    expect(result).toEqual(allOptions);
  });

  it('returns empty array when startTime is the last option', () => {
    const result = filterEndTimeOptions(allOptions, '09:30', true);
    expect(result).toEqual([]);
  });

  it('filters correctly when startTime is the first option', () => {
    const result = filterEndTimeOptions(allOptions, '08:00', true);
    expect(result).toEqual(['08:15', '08:30', '08:45', '09:00', '09:15', '09:30']);
  });

  it('returns all options when startTime is empty string', () => {
    const result = filterEndTimeOptions(allOptions, '', true);
    expect(result).toEqual(allOptions);
  });
});
