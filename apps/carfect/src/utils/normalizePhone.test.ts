import { describe, it, expect } from 'vitest';
import { normalizePhone } from '@shared/utils';

describe('normalizePhone E.164 consistency', () => {
  it('normalizes 9-digit Polish number', () => {
    expect(normalizePhone('733854184')).toBe('+48733854184');
  });

  it('normalizes number with +48 prefix', () => {
    expect(normalizePhone('+48733854184')).toBe('+48733854184');
  });

  it('normalizes number with 48 prefix (no +)', () => {
    expect(normalizePhone('48733854184')).toBe('+48733854184');
  });

  it('normalizes number with 0048 prefix', () => {
    expect(normalizePhone('0048733854184')).toBe('+48733854184');
  });

  it('normalizes number with spaces', () => {
    expect(normalizePhone('733 854 184')).toBe('+48733854184');
  });

  it('normalizes number with dashes', () => {
    expect(normalizePhone('733-854-184')).toBe('+48733854184');
  });

  it('preserves international number', () => {
    const result = normalizePhone('+49171123456');
    expect(result).toContain('+49');
  });

  it('all Polish formats produce same output', () => {
    const formats = ['733854184', '+48733854184', '48733854184', '0048733854184', '733 854 184'];
    const results = formats.map((f) => normalizePhone(f));
    // All should produce +48733854184
    for (const r of results) {
      expect(r).toBe('+48733854184');
    }
  });
});
