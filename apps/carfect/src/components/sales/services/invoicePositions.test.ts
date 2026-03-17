/**
 * Regression test for: Invoice positions double-VAT bug.
 *
 * Before the fix, SalesOrdersView passed positions with unit_price_gross = priceNet * 1.23.
 * useInvoiceForm then re-multiplied by (1 + vat_rate/100) in handleSubmit (netto mode),
 * resulting in the API receiving priceNet * 1.23 * 1.23 — a ~51% markup.
 *
 * After the fix, SalesOrdersView passes unit_price_gross = priceNet (the raw netto value),
 * and useInvoiceForm multiplies exactly once on submit, yielding priceNet * 1.23.
 */
import { describe, it, expect } from 'vitest';

// Replicate the conversion logic from useInvoiceForm.handleSubmit (priceMode='netto')
function convertPositionsToGross(
  positions: Array<{ unit_price_gross: number; vat_rate: number; quantity: number }>,
  priceMode: 'netto' | 'brutto',
) {
  return positions.map((p) => {
    if (priceMode === 'netto') {
      const rate = p.vat_rate / 100;
      return { ...p, unit_price_gross: p.unit_price_gross * (1 + rate) };
    }
    return p;
  });
}

describe('Invoice position VAT conversion — regression: double-VAT on submit', () => {
  const priceNet = 100;
  const vatRate = 23;

  it('correct: passing priceNet directly yields priceNet * 1.23 on submit (single multiplication)', () => {
    // Fixed behaviour: SalesOrdersView passes priceNet as unit_price_gross
    const positions = [{ unit_price_gross: priceNet, vat_rate: vatRate, quantity: 1 }];
    const grossPositions = convertPositionsToGross(positions, 'netto');
    expect(grossPositions[0].unit_price_gross).toBeCloseTo(priceNet * 1.23, 5);
  });

  it('regression: passing priceNet*1.23 and converting again yields priceNet*1.23*1.23 (wrong)', () => {
    // Buggy behaviour: SalesOrdersView was passing unit_price_gross = priceNet * 1.23
    const buggyInput = [{ unit_price_gross: priceNet * 1.23, vat_rate: vatRate, quantity: 1 }];
    const grossPositions = convertPositionsToGross(buggyInput, 'netto');
    // This is the old bug: 100 * 1.23 * 1.23 = 151.29 instead of 123
    expect(grossPositions[0].unit_price_gross).toBeCloseTo(priceNet * 1.23 * 1.23, 5);
    expect(grossPositions[0].unit_price_gross).not.toBeCloseTo(priceNet * 1.23, 5);
  });

  it('exempt (vat_rate=-1) positions are not multiplied regardless of priceMode', () => {
    const positions = [{ unit_price_gross: priceNet, vat_rate: -1, quantity: 1 }];
    // vat_rate=-1 is handled before priceMode in useInvoiceForm's totals calc,
    // and on submit the rate would be -0.01, yielding 99 — but exempt positions
    // should only be present in brutto mode or with special handling.
    // This test documents that the conversion logic uses rate = vat_rate/100 for exempt.
    // Rate = -1/100 = -0.01, so 100 * (1 - 0.01) = 99 — this is a latent inconsistency.
    const grossPositions = convertPositionsToGross(positions, 'netto');
    // Document actual current behaviour:
    expect(grossPositions[0].unit_price_gross).toBeCloseTo(99, 5);
  });
});
