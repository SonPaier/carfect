/**
 * Unit tests for order form calculation logic:
 * - getEffectiveQty (mb→m² conversion)
 * - Shipping always brutto in totals
 * - Declared value with netto/brutto toggle
 * - COD amount calculation
 */
import { describe, it, expect } from 'vitest';
import { VAT_RATE } from './constants';
import { mbToM2, m2ToMb } from './types/rolls';
import type { OrderProduct } from './hooks/useOrderPackages';

// ── Helpers mirroring AddSalesOrderDrawer logic ──

const getProductWidthMm = (p: OrderProduct): number => {
  const match = p.name.match(/(\d{3,4})\s*mm/);
  return match ? parseInt(match[1]) : 1524;
};

const getEffectiveQty = (p: OrderProduct) =>
  p.rollAssignments?.length
    ? p.rollAssignments.reduce((sum, ra) => sum + ra.usageM2, 0)
    : p.priceUnit === 'meter' && p.requiredMb
      ? mbToM2(p.requiredMb, getProductWidthMm(p))
      : p.quantity;

const makeProduct = (overrides: Partial<OrderProduct> = {}): OrderProduct => ({
  instanceKey: 'key-1',
  productId: 'prod-1',
  name: 'Test Product',
  priceNet: 100,
  priceUnit: 'szt.',
  quantity: 1,
  vehicle: '',
  ...overrides,
});

// ── getEffectiveQty ──

describe('getEffectiveQty', () => {
  it('returns plain quantity for piece-based products', () => {
    const p = makeProduct({ priceUnit: 'szt.', quantity: 3 });
    expect(getEffectiveQty(p)).toBe(3);
  });

  it('returns plain quantity for piece product even if requiredMb is set', () => {
    const p = makeProduct({ priceUnit: 'piece', quantity: 2, requiredMb: 5 });
    expect(getEffectiveQty(p)).toBe(2);
  });

  it('converts requiredMb to m² for meter product (1524mm width)', () => {
    const p = makeProduct({
      name: 'XP Crystal - 1524mm x 15m',
      priceUnit: 'meter',
      quantity: 1,
      requiredMb: 5,
    });
    // 5 mb × 1.524 m = 7.62 m²
    expect(getEffectiveQty(p)).toBeCloseTo(7.62, 2);
  });

  it('converts requiredMb to m² for meter product (1220mm width)', () => {
    const p = makeProduct({
      name: 'Folia - 1220mm x 30m',
      priceUnit: 'meter',
      quantity: 1,
      requiredMb: 10,
    });
    // 10 mb × 1.220 m = 12.20 m²
    expect(getEffectiveQty(p)).toBeCloseTo(12.2, 2);
  });

  it('uses fallback width 1524mm when no width in product name', () => {
    const p = makeProduct({
      name: 'Generic Foil',
      priceUnit: 'meter',
      quantity: 1,
      requiredMb: 4,
    });
    // 4 mb × 1.524 m = 6.096 m²
    expect(getEffectiveQty(p)).toBeCloseTo(6.096, 3);
  });

  it('prefers rollAssignments over requiredMb', () => {
    const p = makeProduct({
      name: 'XP Crystal - 1524mm x 15m',
      priceUnit: 'meter',
      quantity: 1,
      requiredMb: 5,
      rollAssignments: [
        { rollId: 'r1', usageM2: 3.0, widthMm: 1524 },
        { rollId: 'r2', usageM2: 2.0, widthMm: 1524 },
      ],
    });
    // Should use rollAssignments sum (5.0), not requiredMb converted (7.62)
    expect(getEffectiveQty(p)).toBe(5.0);
  });

  it('returns quantity for meter product without requiredMb or rollAssignments', () => {
    const p = makeProduct({ priceUnit: 'meter', quantity: 1 });
    expect(getEffectiveQty(p)).toBe(1);
  });

  it('handles requiredMb = 0 as falsy, falls back to quantity', () => {
    const p = makeProduct({ priceUnit: 'meter', quantity: 1, requiredMb: 0 });
    expect(getEffectiveQty(p)).toBe(1);
  });
});

// ── Shipping always brutto in totals ──

describe('shipping always brutto in totals', () => {
  const computeTotals = (productsNet: number, shippingCosts: number[], isNetPayer: boolean) => {
    const shippingBruttoTotal = shippingCosts.reduce((sum, c) => sum + c, 0);
    const shippingNetTotal = shippingBruttoTotal / (1 + VAT_RATE);
    const totalNet = productsNet + shippingNetTotal;
    const totalGross = isNetPayer ? productsNet + shippingBruttoTotal : totalNet * (1 + VAT_RATE);
    return { totalNet, totalGross, shippingBruttoTotal };
  };

  it('brutto payer: totalGross includes shipping at original brutto rate', () => {
    const { totalGross } = computeTotals(100, [24.6], false);
    // productsNet=100, shippingNet=20, totalNet=120
    // totalGross = 120 * 1.23 = 147.6
    // Shipping in gross: 24.6 (original brutto — correct)
    expect(totalGross).toBeCloseTo(147.6, 1);
  });

  it('netto payer: shipping is added as brutto (not divided by VAT)', () => {
    const { totalGross } = computeTotals(100, [24.6], true);
    // productsNet=100 + shippingBrutto=24.6 = 124.6
    expect(totalGross).toBeCloseTo(124.6, 1);
  });

  it('netto payer: shipping stays same regardless of toggle', () => {
    const bruttoResult = computeTotals(100, [24.6], false);
    const nettoResult = computeTotals(100, [24.6], true);
    // Both should effectively charge 24.6 for shipping
    // Brutto: products gross (123) + shipping (24.6) = 147.6
    expect(bruttoResult.totalGross).toBeCloseTo(147.6, 1);
    // Netto: products net (100) + shipping brutto (24.6) = 124.6
    expect(nettoResult.totalGross).toBeCloseTo(124.6, 1);
  });

  it('multiple shipping costs summed correctly', () => {
    const { shippingBruttoTotal, totalGross } = computeTotals(200, [24.6, 30.0], true);
    expect(shippingBruttoTotal).toBeCloseTo(54.6, 1);
    // netto payer: 200 + 54.6 = 254.6
    expect(totalGross).toBeCloseTo(254.6, 1);
  });

  it('no shipping: totalGross is just products', () => {
    const nettoResult = computeTotals(100, [], true);
    const bruttoResult = computeTotals(100, [], false);
    expect(nettoResult.totalGross).toBeCloseTo(100, 1);
    expect(bruttoResult.totalGross).toBeCloseTo(123, 1);
  });
});

// ── Declared value with isNetPayer ──

describe('declared value auto-calculation', () => {
  const computeDeclaredValue = (
    products: OrderProduct[],
    customerDiscount: number,
    isNetPayer: boolean,
  ) => {
    return products.reduce((sum, p) => {
      const qty = getEffectiveQty(p);
      const discount = p.discountPercent ?? (p.excludeFromDiscount ? 0 : customerDiscount);
      const net = p.priceNet * qty * (1 - discount / 100);
      return sum + (isNetPayer ? net : net * (1 + VAT_RATE));
    }, 0);
  };

  it('brutto payer: declared value includes VAT', () => {
    const products = [makeProduct({ priceNet: 100, quantity: 2 })];
    const value = computeDeclaredValue(products, 0, false);
    // 100 * 2 * 1.23 = 246
    expect(value).toBeCloseTo(246, 2);
  });

  it('netto payer: declared value is net (no VAT)', () => {
    const products = [makeProduct({ priceNet: 100, quantity: 2 })];
    const value = computeDeclaredValue(products, 0, true);
    // 100 * 2 = 200
    expect(value).toBeCloseTo(200, 2);
  });

  it('applies customer discount to declared value', () => {
    const products = [makeProduct({ priceNet: 100, quantity: 1 })];
    const value = computeDeclaredValue(products, 10, false);
    // 100 * 0.9 * 1.23 = 110.7
    expect(value).toBeCloseTo(110.7, 2);
  });

  it('uses per-product discount over customer discount', () => {
    const products = [makeProduct({ priceNet: 100, quantity: 1, discountPercent: 20 })];
    const value = computeDeclaredValue(products, 10, false);
    // 100 * 0.8 * 1.23 = 98.4
    expect(value).toBeCloseTo(98.4, 2);
  });

  it('excluded product gets 0% discount regardless of customer discount', () => {
    const products = [makeProduct({ priceNet: 100, quantity: 1, excludeFromDiscount: true })];
    const value = computeDeclaredValue(products, 15, false);
    // 100 * 1.0 * 1.23 = 123
    expect(value).toBeCloseTo(123, 2);
  });

  it('meter product with requiredMb uses converted m² quantity', () => {
    const products = [
      makeProduct({
        name: 'XP Crystal - 1524mm x 15m',
        priceUnit: 'meter',
        priceNet: 40,
        quantity: 1,
        requiredMb: 5,
      }),
    ];
    const value = computeDeclaredValue(products, 0, false);
    // qty = 5 mb * 1.524 = 7.62 m²; 40 * 7.62 * 1.23 = 374.904
    expect(value).toBeCloseTo(374.904, 2);
  });
});

// ── COD amount ──

describe('COD amount calculation', () => {
  const computeCodAmount = (declaredValue: number, shippingCost: number) => {
    return Math.round((declaredValue + shippingCost) * 100) / 100;
  };

  it('sums declared value and shipping cost', () => {
    expect(computeCodAmount(246, 24.6)).toBe(270.6);
  });

  it('rounds to 2 decimal places', () => {
    expect(computeCodAmount(100.555, 20.111)).toBe(120.67);
  });

  it('handles zero shipping', () => {
    expect(computeCodAmount(123, 0)).toBe(123);
  });

  it('handles zero declared value', () => {
    expect(computeCodAmount(0, 24.6)).toBe(24.6);
  });
});

// ── mb ↔ m² conversion consistency ──

describe('mb ↔ m² conversion', () => {
  it('mbToM2 and m2ToMb are inverse operations', () => {
    const mb = 5;
    const widthMm = 1524;
    const m2 = mbToM2(mb, widthMm);
    const backToMb = m2ToMb(m2, widthMm);
    expect(backToMb).toBeCloseTo(mb, 10);
  });

  it('mbToM2: 10 mb at 1220mm = 12.2 m²', () => {
    expect(mbToM2(10, 1220)).toBeCloseTo(12.2, 2);
  });

  it('m2ToMb: 7.62 m² at 1524mm = 5 mb', () => {
    expect(m2ToMb(7.62, 1524)).toBeCloseTo(5, 2);
  });

  it('mbToM2 returns 0 for 0 width', () => {
    expect(mbToM2(5, 0)).toBe(0);
  });

  it('m2ToMb returns 0 for 0 width', () => {
    expect(m2ToMb(5, 0)).toBe(0);
  });
});
