import { describe, it, expect } from 'vitest';
import { buildHolidayMap } from './polishHolidays';

describe('buildHolidayMap', () => {
  it('returns an empty map for no years', () => {
    expect(buildHolidayMap([]).size).toBe(0);
  });

  it('includes all 12 Polish public holidays for a given year', () => {
    const map = buildHolidayMap([2026]);
    expect(map.size).toBe(12);
  });

  it('includes fixed-date holidays', () => {
    const map = buildHolidayMap([2026]);
    expect(map.get('2026-01-01')).toBe('Nowy Rok');
    expect(map.get('2026-01-06')).toBe('Trzech Króli');
    expect(map.get('2026-05-01')).toBe('Święto Pracy');
    expect(map.get('2026-05-03')).toBe('3 Maja');
    expect(map.get('2026-08-15')).toBe('Wniebowzięcie NMP');
    expect(map.get('2026-11-01')).toBe('Wszystkich Świętych');
    expect(map.get('2026-11-11')).toBe('Niepodległość');
    expect(map.get('2026-12-25')).toBe('Boże Narodzenie');
    expect(map.get('2026-12-26')).toBe('2. dzień Bożego Nar.');
  });

  it('computes Easter Sunday correctly for known years', () => {
    // Reference: Easter Sunday via Anonymous Gregorian algorithm
    expect(buildHolidayMap([2024]).get('2024-03-31')).toBe('Wielkanoc');
    expect(buildHolidayMap([2025]).get('2025-04-20')).toBe('Wielkanoc');
    expect(buildHolidayMap([2026]).get('2026-04-05')).toBe('Wielkanoc');
    expect(buildHolidayMap([2027]).get('2027-03-28')).toBe('Wielkanoc');
  });

  it('computes Easter Monday as Easter + 1 day', () => {
    expect(buildHolidayMap([2026]).get('2026-04-06')).toBe('Pon. Wielkanocny');
  });

  it('computes Corpus Christi as Easter + 60 days', () => {
    // 2026-04-05 + 60 = 2026-06-04
    expect(buildHolidayMap([2026]).get('2026-06-04')).toBe('Boże Ciało');
  });

  it('handles multiple years with no key collisions', () => {
    const map = buildHolidayMap([2025, 2026]);
    expect(map.size).toBe(24);
    expect(map.get('2025-01-01')).toBe('Nowy Rok');
    expect(map.get('2026-01-01')).toBe('Nowy Rok');
  });
});
