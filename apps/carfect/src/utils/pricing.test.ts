import { describe, it, expect } from 'vitest';
import {
  roundToNearest5,
  netToBrutto,
  bruttoToNetto,
  getServicePricePair,
  getServiceDisplayPrice,
  calculatePricePair,
  getRawServicePrice,
} from './pricing';

describe('pricing utilities', () => {
  describe('roundToNearest5', () => {
    it('rounds 123 to 125', () => {
      expect(roundToNearest5(123)).toBe(125);
    });

    it('rounds 122 to 120', () => {
      expect(roundToNearest5(122)).toBe(120);
    });

    it('keeps multiples of 5 unchanged', () => {
      expect(roundToNearest5(100)).toBe(100);
    });

    it('rounds 2.5 boundary up', () => {
      expect(roundToNearest5(7.5)).toBe(10);
    });
  });

  describe('netToBrutto', () => {
    it('converts 1000 netto to 1230 brutto rounded to nearest 5', () => {
      // 1000 * 1.23 = 1230, rounded = 1230
      expect(netToBrutto(1000)).toBe(1230);
    });

    it('converts 100 netto to 125 brutto (rounded to nearest 5)', () => {
      // 100 * 1.23 = 123, rounded to 5 = 125
      expect(netToBrutto(100)).toBe(125);
    });

    it('converts 200 netto to 245 brutto', () => {
      // 200 * 1.23 = 246, rounded to 5 = 245
      expect(netToBrutto(200)).toBe(245);
    });
  });

  describe('bruttoToNetto', () => {
    it('converts 1230 brutto to 1000 netto', () => {
      expect(bruttoToNetto(1230)).toBe(1000);
    });

    it('converts 300 brutto to 243.90 netto', () => {
      expect(bruttoToNetto(300)).toBe(243.9);
    });

    it('returns 0 for 0', () => {
      expect(bruttoToNetto(0)).toBe(0);
    });
  });

  describe('getRawServicePrice', () => {
    const service = {
      price_from: 100,
      price_small: 80,
      price_medium: 100,
      price_large: 120,
    };

    it('returns price_small for small car size', () => {
      expect(getRawServicePrice(service, 'small')).toBe(80);
    });

    it('returns price_medium for medium car size', () => {
      expect(getRawServicePrice(service, 'medium')).toBe(100);
    });

    it('returns price_large for large car size', () => {
      expect(getRawServicePrice(service, 'large')).toBe(120);
    });

    it('falls back to price_from when size price is null', () => {
      const svc = { ...service, price_small: null };
      expect(getRawServicePrice(svc, 'small')).toBe(100);
    });

    it('returns null when all prices are null', () => {
      const svc = { price_from: null, price_small: null, price_medium: null, price_large: null };
      expect(getRawServicePrice(svc, 'medium')).toBeNull();
    });
  });

  describe('getServicePricePair', () => {
    it('returns both prices for a netto service', () => {
      const service = {
        price_from: 1000,
        price_small: null,
        price_medium: null,
        price_large: null,
        category_prices_are_net: true,
      };
      const result = getServicePricePair(service, 'medium');
      expect(result).toEqual({ netto: 1000, brutto: 1230 });
    });

    it('returns both prices for a brutto service', () => {
      const service = {
        price_from: 300,
        price_small: null,
        price_medium: null,
        price_large: null,
        category_prices_are_net: false,
      };
      const result = getServicePricePair(service, 'medium');
      expect(result).toEqual({ netto: 243.9, brutto: 300 });
    });

    it('returns null when price is null', () => {
      const service = {
        price_from: null,
        price_small: null,
        price_medium: null,
        price_large: null,
        category_prices_are_net: true,
      };
      expect(getServicePricePair(service, 'medium')).toBeNull();
    });

    it('uses correct size price', () => {
      const service = {
        price_from: 100,
        price_small: 80,
        price_medium: 100,
        price_large: 150,
        category_prices_are_net: true,
      };
      const result = getServicePricePair(service, 'large');
      expect(result!.netto).toBe(150);
      // 150 * 1.23 = 184.5, rounded to 5 = 185
      expect(result!.brutto).toBe(185);
    });
  });

  describe('getServiceDisplayPrice', () => {
    const nettoService = {
      price_from: 1000,
      price_small: null,
      price_medium: null,
      price_large: null,
      category_prices_are_net: true,
    };

    it('returns netto price when pricing mode is netto', () => {
      expect(getServiceDisplayPrice(nettoService, 'medium', 'netto')).toBe(1000);
    });

    it('returns brutto price when pricing mode is brutto', () => {
      expect(getServiceDisplayPrice(nettoService, 'medium', 'brutto')).toBe(1230);
    });
  });

  describe('calculatePricePair', () => {
    it('from netto: calculates brutto with rounding', () => {
      const result = calculatePricePair(100, 'netto');
      expect(result.netto).toBe(100);
      expect(result.brutto).toBe(125); // 123 rounded to 125
    });

    it('from brutto: calculates netto', () => {
      const result = calculatePricePair(300, 'brutto');
      expect(result.brutto).toBe(300);
      expect(result.netto).toBe(243.9);
    });
  });
});
