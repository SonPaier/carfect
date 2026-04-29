import { describe, it, expect } from 'vitest';
import { mapProductToInvoicePosition, bruttoCostToInvoicePosition } from './invoicePositionMapper';
import type { SalesOrderProduct } from '@/data/salesMockData';

function makeProduct(overrides: Partial<SalesOrderProduct>): SalesOrderProduct {
  return {
    name: 'Test product',
    quantity: 2.3622,
    priceNet: 10,
    priceGross: 12.3,
    ...overrides,
  };
}

describe('mapProductToInvoicePosition', () => {
  describe('quantity resolution', () => {
    it('uses quantity for roll products', () => {
      const product = makeProduct({ productType: 'roll', quantity: 2.3622, requiredMb: undefined });
      const result = mapProductToInvoicePosition(product);
      expect(result.quantity).toBe(2.3622);
    });

    it('uses requiredMb for other products with meter unit', () => {
      const product = makeProduct({
        productType: 'other',
        unit: 'meter',
        quantity: 2.3622,
        requiredMb: 1.551,
      });
      const result = mapProductToInvoicePosition(product);
      expect(result.quantity).toBe(1.551);
    });

    it('falls back to quantity when requiredMb is 0', () => {
      const product = makeProduct({
        productType: 'other',
        unit: 'meter',
        quantity: 2.3622,
        requiredMb: 0,
      });
      const result = mapProductToInvoicePosition(product);
      expect(result.quantity).toBe(2.3622);
    });

    it('falls back to quantity when requiredMb is undefined', () => {
      const product = makeProduct({
        productType: 'other',
        unit: 'meter',
        quantity: 2.3622,
        requiredMb: undefined,
      });
      const result = mapProductToInvoicePosition(product);
      expect(result.quantity).toBe(2.3622);
    });

    it('uses quantity for other products with piece unit', () => {
      const product = makeProduct({
        productType: 'other',
        unit: 'piece',
        quantity: 5,
        requiredMb: 1.5,
      });
      const result = mapProductToInvoicePosition(product);
      expect(result.quantity).toBe(5);
    });

    it('uses quantity when productType is undefined (legacy orders)', () => {
      const product = makeProduct({
        productType: undefined,
        unit: 'meter',
        quantity: 3,
        requiredMb: 1.5,
      });
      const result = mapProductToInvoicePosition(product);
      expect(result.quantity).toBe(3);
    });
  });

  describe('unit mapping', () => {
    it('maps meter unit to m2', () => {
      const product = makeProduct({ unit: 'meter' });
      const result = mapProductToInvoicePosition(product);
      expect(result.unit).toBe('m2');
    });

    it('maps piece unit to szt.', () => {
      const product = makeProduct({ unit: 'piece' });
      const result = mapProductToInvoicePosition(product);
      expect(result.unit).toBe('szt.');
    });

    it('falls back to szt. when unit is undefined', () => {
      const product = makeProduct({ unit: undefined });
      const result = mapProductToInvoicePosition(product);
      expect(result.unit).toBe('szt.');
    });
  });

  describe('discount resolution', () => {
    it('preserves product-level discountPercent over customerDiscount', () => {
      const product = makeProduct({ discountPercent: 15 });
      const result = mapProductToInvoicePosition(product, 5);
      expect(result.discount).toBe(15);
    });

    it('falls back to customerDiscount when product has no discountPercent', () => {
      const product = makeProduct({ discountPercent: undefined });
      const result = mapProductToInvoicePosition(product, 10);
      expect(result.discount).toBe(10);
    });

    it('defaults discount to 0 when neither product nor customer discount is set', () => {
      const product = makeProduct({ discountPercent: undefined });
      const result = mapProductToInvoicePosition(product, undefined);
      expect(result.discount).toBe(0);
    });
  });

  describe('other fields', () => {
    it('passes product name through unchanged', () => {
      const product = makeProduct({ name: 'Wycinanie formatek' });
      const result = mapProductToInvoicePosition(product);
      expect(result.name).toBe('Wycinanie formatek');
    });

    it('uses priceNet as unit_price_gross', () => {
      const product = makeProduct({ priceNet: 42.5 });
      const result = mapProductToInvoicePosition(product);
      expect(result.unit_price_gross).toBe(42.5);
    });

    it('always sets vat_rate to 23', () => {
      const product = makeProduct({});
      const result = mapProductToInvoicePosition(product);
      expect(result.vat_rate).toBe(23);
    });
  });

  describe('priceUnit fallback (OrderProduct shape)', () => {
    it('reads priceUnit when unit field absent', () => {
      const product = { name: 'X', quantity: 1, priceNet: 10, priceUnit: 'meter' } as Parameters<
        typeof mapProductToInvoicePosition
      >[0];
      const result = mapProductToInvoicePosition(product);
      expect(result.unit).toBe('m2');
    });

    it('prefers unit over priceUnit when both present', () => {
      const product = {
        name: 'X',
        quantity: 1,
        priceNet: 10,
        unit: 'meter',
        priceUnit: 'piece',
      } as Parameters<typeof mapProductToInvoicePosition>[0];
      const result = mapProductToInvoicePosition(product);
      expect(result.unit).toBe('m2');
    });
  });

  describe('roll meter products: effective quantity from assignments / requiredMb', () => {
    it('sums usageM2 from rollAssignments when present (ignores raw quantity=1)', () => {
      const product = {
        name: 'Ultrafit XP Black - 1524mm',
        quantity: 1,
        priceNet: 309,
        productType: 'roll',
        priceUnit: 'meter',
        rollAssignments: [
          { usageM2: 12.19, widthMm: 1524 },
          { usageM2: 3.05, widthMm: 1524 },
        ],
      } as Parameters<typeof mapProductToInvoicePosition>[0];
      const result = mapProductToInvoicePosition(product);
      expect(result.quantity).toBeCloseTo(15.24, 5);
    });

    it('falls back to 1524mm default width when name has no width pattern', () => {
      const product = {
        name: 'XP RETRO MATTE',
        quantity: 1,
        priceNet: 309,
        productType: 'roll',
        priceUnit: 'meter',
        requiredMb: 8,
      } as Parameters<typeof mapProductToInvoicePosition>[0];
      const result = mapProductToInvoicePosition(product);
      // 8 mb * 1.524 m default = 12.192 m²
      expect(result.quantity).toBeCloseTo(12.19, 1);
    });

    it('extracts width from product name (e.g. "1220mm")', () => {
      const product = {
        name: 'Ultrafit XP Black - 1220mm',
        quantity: 1,
        priceNet: 309,
        productType: 'roll',
        priceUnit: 'meter',
        requiredMb: 10,
      } as Parameters<typeof mapProductToInvoicePosition>[0];
      const result = mapProductToInvoicePosition(product);
      // 10 mb * 1.220 m = 12.2 m²
      expect(result.quantity).toBeCloseTo(12.2, 1);
    });

    it('rollAssignments override requiredMb when both present', () => {
      const product = {
        name: 'X - 1524mm',
        quantity: 1,
        priceNet: 309,
        productType: 'roll',
        priceUnit: 'meter',
        requiredMb: 100,
        rollAssignments: [{ usageM2: 5, widthMm: 1524 }],
      } as Parameters<typeof mapProductToInvoicePosition>[0];
      const result = mapProductToInvoicePosition(product);
      expect(result.quantity).toBe(5);
    });
  });
});

describe('bruttoCostToInvoicePosition', () => {
  it('converts brutto to net using 23% VAT and rounds to 2 decimals', () => {
    const result = bruttoCostToInvoicePosition(123, 'Wysyłka');
    // 123 / 1.23 = 100.00
    expect(result.unit_price_gross).toBe(100);
    expect(result.name).toBe('Wysyłka');
    expect(result.vat_rate).toBe(23);
    expect(result.unit).toBe('szt.');
    expect(result.quantity).toBe(1);
    expect(result.discount).toBe(0);
  });

  it('rounds non-trivial division correctly', () => {
    // 75 / 1.23 = 60.9756... → 60.98
    const result = bruttoCostToInvoicePosition(75, 'Uber');
    expect(result.unit_price_gross).toBe(60.98);
  });

  it('handles zero amount', () => {
    const result = bruttoCostToInvoicePosition(0, 'free shipping');
    expect(result.unit_price_gross).toBe(0);
  });
});
