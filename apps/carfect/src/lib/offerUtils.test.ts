import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicOfferUrl, getLowestPrice } from './offerUtils';

describe('getPublicOfferUrl', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset window.location mock
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation },
    });
  });

  it('converts admin subdomain to public subdomain', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        hostname: 'armcar.admin.carfect.pl',
        origin: 'https://armcar.admin.carfect.pl',
      },
    });

    expect(getPublicOfferUrl('abc123')).toBe('https://armcar.carfect.pl/offers/abc123');
  });

  it('keeps public subdomain as-is', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        hostname: 'armcar.carfect.pl',
        origin: 'https://armcar.carfect.pl',
      },
    });

    expect(getPublicOfferUrl('token456')).toBe('https://armcar.carfect.pl/offers/token456');
  });

  it('uses origin on localhost', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        hostname: 'localhost',
        origin: 'http://localhost:8080',
      },
    });

    expect(getPublicOfferUrl('dev-token')).toBe('http://localhost:8080/offers/dev-token');
  });

  it('handles different instance slugs', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        hostname: 'detailing-pro.admin.carfect.pl',
        origin: 'https://detailing-pro.admin.carfect.pl',
      },
    });

    expect(getPublicOfferUrl('xyz')).toBe('https://detailing-pro.carfect.pl/offers/xyz');
  });
});

describe('getLowestPrice', () => {
  it('returns 0 for null product', () => {
    expect(getLowestPrice(null)).toBe(0);
  });

  it('returns 0 for undefined product', () => {
    expect(getLowestPrice(undefined)).toBe(0);
  });

  it('uses price_from when available', () => {
    expect(
      getLowestPrice({
        price_from: 100,
        price_small: 200,
        price_medium: 300,
        default_price: 400,
      }),
    ).toBe(100);
  });

  it('uses min of size prices when no price_from', () => {
    expect(
      getLowestPrice({
        price_from: null,
        price_small: 300,
        price_medium: 200,
        price_large: 400,
      }),
    ).toBe(200);
  });

  it('filters out null size prices', () => {
    expect(
      getLowestPrice({
        price_from: null,
        price_small: null,
        price_medium: 250,
        price_large: null,
      }),
    ).toBe(250);
  });

  it('falls back to default_price when no sizes', () => {
    expect(
      getLowestPrice({
        price_from: null,
        price_small: null,
        price_medium: null,
        price_large: null,
        default_price: 150,
      }),
    ).toBe(150);
  });

  it('returns 0 when everything is null', () => {
    expect(
      getLowestPrice({
        price_from: null,
        price_small: null,
        price_medium: null,
        price_large: null,
        default_price: null,
      }),
    ).toBe(0);
  });

  it('works with partial product (only default_price)', () => {
    expect(getLowestPrice({ default_price: 99 })).toBe(99);
  });

  it('works with empty object', () => {
    expect(getLowestPrice({})).toBe(0);
  });

  it('prefers price_from=0 over size prices', () => {
    expect(
      getLowestPrice({
        price_from: 0,
        price_small: 100,
        default_price: 200,
      }),
    ).toBe(0);
  });
});
