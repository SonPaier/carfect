/**
 * TDD: Variant pricing resolution
 *
 * Variants inherit price from parent product by default.
 * A variant can override the price with a positive number.
 * null, undefined, 0, negative → inherit parent price.
 */
import { describe, it, expect } from 'vitest';
import { resolveVariantPrice } from './variantPricing';

describe('resolveVariantPrice', () => {
  const PARENT_PRICE = 150;

  // ── Inherit parent price (no override) ──

  it('returns parent price when variant price is undefined', () => {
    expect(resolveVariantPrice(undefined, PARENT_PRICE)).toBe(150);
  });

  it('returns parent price when variant price is null', () => {
    expect(resolveVariantPrice(null, PARENT_PRICE)).toBe(150);
  });

  it('returns parent price when variant price is 0', () => {
    expect(resolveVariantPrice(0, PARENT_PRICE)).toBe(150);
  });

  it('returns parent price when variant price is negative', () => {
    expect(resolveVariantPrice(-10, PARENT_PRICE)).toBe(150);
  });

  // ── Override with positive value ──

  it('returns variant price when explicitly set to positive', () => {
    expect(resolveVariantPrice(200, PARENT_PRICE)).toBe(200);
  });

  it('returns variant price when lower than parent', () => {
    expect(resolveVariantPrice(99.50, PARENT_PRICE)).toBe(99.50);
  });

  it('returns variant price when higher than parent', () => {
    expect(resolveVariantPrice(300, PARENT_PRICE)).toBe(300);
  });

  it('returns variant price for small positive value', () => {
    expect(resolveVariantPrice(0.01, PARENT_PRICE)).toBe(0.01);
  });

  // ── Edge cases ──

  it('returns parent price when parent is 0 and variant is null', () => {
    expect(resolveVariantPrice(null, 0)).toBe(0);
  });

  it('returns variant price even when parent is 0', () => {
    expect(resolveVariantPrice(50, 0)).toBe(50);
  });

  it('handles floating point precision', () => {
    expect(resolveVariantPrice(19.99, 150)).toBe(19.99);
  });

  it('returns NaN parent price as-is when variant is null (garbage in)', () => {
    expect(resolveVariantPrice(null, NaN)).toBeNaN();
  });
});

describe('variant price in order calculations', () => {
  it('order line uses variant override price for total', () => {
    const price = resolveVariantPrice(80, 100);
    expect(price * 3).toBe(240); // 80 * 3, not 100 * 3
  });

  it('order line uses parent price when variant has no override', () => {
    const price = resolveVariantPrice(null, 100);
    expect(price * 3).toBe(300);
  });

  it('discount applies to resolved variant price', () => {
    const price = resolveVariantPrice(80, 100);
    const lineNet = price * 2;
    const afterDiscount = lineNet * (1 - 10 / 100);
    expect(afterDiscount).toBe(144); // 80 * 2 * 0.9
  });
});
