import { describe, it, expect } from 'vitest';
import { mapProductToInvoicePosition } from './invoicePositionMapper';
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
});
