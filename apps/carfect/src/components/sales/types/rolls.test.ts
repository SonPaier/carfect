import { describe, it, expect } from 'vitest';
import {
  rollWidthM,
  mbToM2,
  m2ToMb,
  formatRollSize,
  formatMbM2,
  formatMbM2Lines,
} from './rolls';

describe('rollWidthM', () => {
  it('converts 1520 mm to 1.52 m', () => {
    expect(rollWidthM({ widthMm: 1520 })).toBe(1.52);
  });

  it('returns 0 for widthMm = 0', () => {
    expect(rollWidthM({ widthMm: 0 })).toBe(0);
  });
});

describe('mbToM2', () => {
  it('converts 10 mb at 1520 mm width to 15.2 m²', () => {
    expect(mbToM2(10, 1520)).toBeCloseTo(15.2, 5);
  });

  it('returns 0 for 0 mb', () => {
    expect(mbToM2(0, 1520)).toBe(0);
  });

  it('handles very large values', () => {
    expect(mbToM2(1000, 1520)).toBeCloseTo(1520, 5);
  });
});

describe('m2ToMb', () => {
  it('converts 15.2 m² at 1520 mm width to 10 mb', () => {
    expect(m2ToMb(15.2, 1520)).toBeCloseTo(10, 5);
  });

  it('returns 0 for 0 m²', () => {
    expect(m2ToMb(0, 1520)).toBe(0);
  });

  it('returns 0 when widthMm is 0 (division by zero guard)', () => {
    expect(m2ToMb(15.2, 0)).toBe(0);
  });

  it('returns 0 when widthMm is negative', () => {
    expect(m2ToMb(15.2, -100)).toBe(0);
  });
});

describe('mbToM2 edge cases', () => {
  it('returns 0 when widthMm is 0', () => {
    expect(mbToM2(10, 0)).toBe(0);
  });

  it('returns 0 when widthMm is negative', () => {
    expect(mbToM2(10, -500)).toBe(0);
  });
});

describe('mbToM2 + m2ToMb roundtrip', () => {
  it('roundtrips: mb → m2 → mb', () => {
    const original = 7.5;
    const widthMm = 1520;
    const m2 = mbToM2(original, widthMm);
    const recovered = m2ToMb(m2, widthMm);
    expect(recovered).toBeCloseTo(original, 10);
  });
});

describe('formatRollSize', () => {
  it('formats width and length with units', () => {
    expect(formatRollSize(1520, 50)).toBe('1520mm × 50m');
  });

  it('formats decimal length values', () => {
    expect(formatRollSize(1000, 12.5)).toBe('1000mm × 12.5m');
  });
});

describe('formatMbM2', () => {
  it('formats mb and m2 on one line', () => {
    expect(formatMbM2(10, 1520)).toBe('10.0 mb / 15.20 m²');
  });

  it('formats decimal mb values', () => {
    expect(formatMbM2(5.5, 1000)).toBe('5.5 mb / 5.50 m²');
  });
});

describe('formatMbM2Lines', () => {
  it('returns separate mb and m2 strings', () => {
    const result = formatMbM2Lines(10, 1520);
    expect(result.mb).toBe('10.0 mb');
    expect(result.m2).toBe('15.20 m²');
  });

  it('handles very large values without losing precision in formatting', () => {
    const result = formatMbM2Lines(1000, 1520);
    expect(result.mb).toBe('1000.0 mb');
    expect(result.m2).toBe('1520.00 m²');
  });
});
