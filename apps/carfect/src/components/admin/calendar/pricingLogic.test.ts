/**
 * Unit tests for the pricing mode logic used in AddReservationDialogV2 when loading
 * an existing reservation for editing.
 *
 * Spec requirement (line ~525-529 of AddReservationDialogV2.tsx):
 *   price        = brutto (tax-inclusive)
 *   price_netto  = netto  (tax-exclusive)
 *
 *   When pricingMode === 'netto':
 *     - If price_netto is present → use price_netto directly
 *     - If price_netto is NULL (legacy row) → derive from brutto: Math.round(price / 1.23 * 100) / 100
 *   When pricingMode === 'brutto':
 *     - Always use price (brutto) directly
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Pure helper extracted from the component logic so it can be unit-tested.
// ---------------------------------------------------------------------------

type PricingMode = 'netto' | 'brutto';

interface ReservationPriceFields {
  price?: number | null;
  price_netto?: number | null;
}

/**
 * Returns the price value that should be loaded into the price input field
 * given the current pricingMode and the reservation's stored price fields.
 *
 * This mirrors the exact expression from AddReservationDialogV2.tsx:
 *   const editPrice = pricingMode === 'netto'
 *     ? editingReservation.price_netto ?? (editingReservation.price ? Math.round(editingReservation.price / 1.23 * 100) / 100 : null)
 *     : editingReservation.price;
 */
function resolveEditPrice(
  pricingMode: PricingMode,
  reservation: ReservationPriceFields,
): number | null {
  if (pricingMode === 'netto') {
    return reservation.price_netto ??
      (reservation.price ? Math.round(reservation.price / 1.23 * 100) / 100 : null);
  }
  return reservation.price ?? null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveEditPrice — pricing mode logic', () => {
  describe('pricingMode=netto', () => {
    it('uses price_netto directly when it is present', () => {
      const result = resolveEditPrice('netto', { price: 246, price_netto: 200 });
      expect(result).toBe(200);
    });

    it('derives netto from brutto when price_netto is null (legacy row)', () => {
      // 246 / 1.23 = 200.00
      const result = resolveEditPrice('netto', { price: 246, price_netto: null });
      expect(result).toBe(200);
    });

    it('derives netto from brutto when price_netto is undefined (legacy row)', () => {
      const result = resolveEditPrice('netto', { price: 123 });
      expect(result).toBeCloseTo(100, 2);
    });

    it('returns null when both price_netto and price are null', () => {
      const result = resolveEditPrice('netto', { price: null, price_netto: null });
      expect(result).toBeNull();
    });

    it('returns null when price_netto is null and price is zero (falsy)', () => {
      // price = 0 is falsy — derivation should yield null, not 0/1.23
      const result = resolveEditPrice('netto', { price: 0, price_netto: null });
      expect(result).toBeNull();
    });

    it('rounds derived netto value to 2 decimal places', () => {
      // 100 / 1.23 = 81.3008... → should round to 81.30
      const result = resolveEditPrice('netto', { price: 100, price_netto: null });
      expect(result).toBe(Math.round(100 / 1.23 * 100) / 100);
    });
  });

  describe('pricingMode=brutto', () => {
    it('uses brutto price directly when price_netto also exists', () => {
      const result = resolveEditPrice('brutto', { price: 246, price_netto: 200 });
      expect(result).toBe(246);
    });

    it('uses brutto price directly when price_netto is null', () => {
      const result = resolveEditPrice('brutto', { price: 246, price_netto: null });
      expect(result).toBe(246);
    });

    it('returns null when price is null', () => {
      const result = resolveEditPrice('brutto', { price: null, price_netto: 200 });
      expect(result).toBeNull();
    });
  });
});
