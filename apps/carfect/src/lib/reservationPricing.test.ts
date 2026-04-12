import { describe, it, expect, vi } from 'vitest';
import {
  getServiceDuration,
  getReservationServicePrice,
  calculateTotalPrice,
  applyDiscount,
  calculateTotalDuration,
} from './reservationPricing';

vi.mock('@/utils/pricing', () => ({
  getServiceDisplayPrice: vi.fn(
    (service: { price_small: number | null; price_medium: number | null; price_large: number | null; price_from: number | null }, carSize: string) => {
      if (carSize === 'small' && service.price_small !== null) return service.price_small;
      if (carSize === 'medium' && service.price_medium !== null) return service.price_medium;
      if (carSize === 'large' && service.price_large !== null) return service.price_large;
      return service.price_from;
    },
  ),
}));

const baseService = {
  id: 'svc-1',
  duration_minutes: 60,
  duration_small: 45,
  duration_medium: 60,
  duration_large: 90,
  price_from: 100,
  price_small: 80,
  price_medium: 100,
  price_large: 150,
  category_id: 'cat-1',
};

describe('getServiceDuration', () => {
  it('returns small duration for small car size', () => {
    expect(getServiceDuration(baseService, 'small')).toBe(45);
  });

  it('returns medium duration for medium car size', () => {
    expect(getServiceDuration(baseService, 'medium')).toBe(60);
  });

  it('returns large duration for large car size', () => {
    expect(getServiceDuration(baseService, 'large')).toBe(90);
  });

  it('falls back to duration_minutes when size-specific is null', () => {
    const service = { ...baseService, duration_small: null };
    expect(getServiceDuration(service, 'small')).toBe(60);
  });

  it('falls back to 60 when all durations are null', () => {
    const service = {
      duration_minutes: null,
      duration_small: null,
      duration_medium: null,
      duration_large: null,
    };
    expect(getServiceDuration(service, 'medium')).toBe(60);
  });
});

describe('getReservationServicePrice', () => {
  it('uses category net flag from servicesWithCategory when available', () => {
    const result = getReservationServicePrice(
      baseService,
      'medium',
      'brutto',
      [{ id: 'svc-1', category_prices_are_net: true }],
      new Map(),
    );
    expect(result).toBe(100);
  });

  it('falls back to categoryNetMap when service not in servicesWithCategory', () => {
    const categoryNetMap = new Map([['cat-1', true]]);
    const result = getReservationServicePrice(
      baseService,
      'medium',
      'brutto',
      [],
      categoryNetMap,
    );
    expect(result).toBe(100);
  });

  it('returns 0 when price is null', () => {
    const service = { ...baseService, price_medium: null, price_from: null };
    const result = getReservationServicePrice(service, 'medium', 'brutto', [], new Map());
    expect(result).toBe(0);
  });
});

describe('calculateTotalPrice', () => {
  it('sums prices for multiple services', () => {
    const services = [
      baseService,
      { ...baseService, id: 'svc-2', price_medium: 200 },
    ];
    const total = calculateTotalPrice(
      ['svc-1', 'svc-2'],
      services,
      [],
      'medium',
      'brutto',
      [],
      new Map(),
    );
    expect(total).toBe(300);
  });

  it('uses custom price from serviceItems when set', () => {
    const total = calculateTotalPrice(
      ['svc-1'],
      [baseService],
      [{ service_id: 'svc-1', custom_price: 50 }],
      'medium',
      'brutto',
      [],
      new Map(),
    );
    expect(total).toBe(50);
  });

  it('ignores service items with null custom_price', () => {
    const total = calculateTotalPrice(
      ['svc-1'],
      [baseService],
      [{ service_id: 'svc-1', custom_price: null }],
      'medium',
      'brutto',
      [],
      new Map(),
    );
    expect(total).toBe(100);
  });

  it('skips services not found in the list', () => {
    const total = calculateTotalPrice(
      ['svc-1', 'svc-missing'],
      [baseService],
      [],
      'medium',
      'brutto',
      [],
      new Map(),
    );
    expect(total).toBe(100);
  });
});

describe('applyDiscount', () => {
  it('returns original price when discount is null', () => {
    expect(applyDiscount(100, null)).toBe(100);
  });

  it('returns original price when discount is 0', () => {
    expect(applyDiscount(100, 0)).toBe(100);
  });

  it('applies 10% discount correctly', () => {
    expect(applyDiscount(100, 10)).toBe(90);
  });

  it('applies 50% discount correctly', () => {
    expect(applyDiscount(200, 50)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    expect(applyDiscount(100, 33)).toBe(67);
  });
});

describe('calculateTotalDuration', () => {
  it('sums durations for selected services', () => {
    const services = [
      baseService,
      { ...baseService, id: 'svc-2', duration_medium: 30 },
    ];
    expect(calculateTotalDuration(['svc-1', 'svc-2'], services, 'medium')).toBe(90);
  });

  it('skips services not found', () => {
    expect(calculateTotalDuration(['svc-1', 'missing'], [baseService], 'medium')).toBe(60);
  });

  it('returns 0 for empty selection', () => {
    expect(calculateTotalDuration([], [baseService], 'medium')).toBe(0);
  });
});
