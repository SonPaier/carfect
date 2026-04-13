import { describe, it, expect } from 'vitest';
import { buildHolidayMap } from './polishHolidays';

describe('buildHolidayMap', () => {
  it('returns 12 holidays for a single year', () => {
    expect(buildHolidayMap([2026]).size).toBe(12);
  });

  it('includes fixed holidays for 2026', () => {
    const map = buildHolidayMap([2026]);
    expect(map.has('2026-01-01')).toBe(true); // New Year
    expect(map.has('2026-05-01')).toBe(true); // Labour Day
    expect(map.has('2026-05-03')).toBe(true); // Constitution Day
    expect(map.has('2026-11-01')).toBe(true); // All Saints
    expect(map.has('2026-11-11')).toBe(true); // Independence Day
    expect(map.has('2026-12-25')).toBe(true); // Christmas Day 1
    expect(map.has('2026-12-26')).toBe(true); // Christmas Day 2
  });

  it('computes Easter correctly for 2026', () => {
    const map = buildHolidayMap([2026]);
    // Easter 2026 is April 5
    expect(map.has('2026-04-05')).toBe(true);
    expect(map.get('2026-04-05')).toBe('Wielkanoc');
  });

  it('computes Easter Monday for 2026', () => {
    const map = buildHolidayMap([2026]);
    // Easter Monday 2026 is April 6
    expect(map.has('2026-04-06')).toBe(true);
    expect(map.get('2026-04-06')).toBe('Pon. Wielkanocny');
  });

  it('computes Corpus Christi (Boże Ciało) for 2026', () => {
    const map = buildHolidayMap([2026]);
    // Corpus Christi = Easter + 60 days = April 5 + 60 = June 4, 2026
    expect(map.has('2026-06-04')).toBe(true);
    expect(map.get('2026-06-04')).toBe('Boże Ciało');
  });

  it('handles multiple years without duplicates', () => {
    // Each year has 12 unique holidays — 2 years = 24 entries
    const map = buildHolidayMap([2025, 2026]);
    expect(map.size).toBe(24);
  });

  it('returns empty map for empty years array', () => {
    expect(buildHolidayMap([]).size).toBe(0);
  });
});
