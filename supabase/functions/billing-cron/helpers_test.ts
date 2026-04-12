import { assertEquals } from 'jsr:@std/assert';
import {
  calculateSmsOverage,
  calculateInvoiceAmounts,
  buildInvoicePositions,
  getNextBillingDate,
  getPrevBillingDate,
  getPeriodEndDate,
  nearestBillingDay,
  formatPeriodLabel,
  SMS_OVERAGE_PRICE,
  VAT_RATE,
} from './helpers.ts';

// ============================================================================
// calculateSmsOverage
// ============================================================================

Deno.test('calculateSmsOverage — returns 0 when under limit', () => {
  assertEquals(calculateSmsOverage(50, 100), 0);
});

Deno.test('calculateSmsOverage — returns 0 when at limit', () => {
  assertEquals(calculateSmsOverage(100, 100), 0);
});

Deno.test('calculateSmsOverage — returns correct count when over limit', () => {
  assertEquals(calculateSmsOverage(150, 100), 50);
});

// ============================================================================
// calculateInvoiceAmounts
// ============================================================================

Deno.test('calculateInvoiceAmounts — subscription only, no SMS overage', () => {
  const result = calculateInvoiceAmounts(299, 0, SMS_OVERAGE_PRICE);
  assertEquals(result.net, 299);
  assertEquals(result.gross, Math.round(299 * (1 + VAT_RATE) * 100) / 100);
});

Deno.test('calculateInvoiceAmounts — with SMS overage', () => {
  const result = calculateInvoiceAmounts(299, 50, SMS_OVERAGE_PRICE);
  const expectedNet = 299 + 50 * SMS_OVERAGE_PRICE;
  assertEquals(result.net, expectedNet);
  assertEquals(result.gross, Math.round(expectedNet * (1 + VAT_RATE) * 100) / 100);
});

// ============================================================================
// buildInvoicePositions
// ============================================================================

Deno.test('buildInvoicePositions — returns 1 position when no overage', () => {
  const positions = buildInvoicePositions(299, 0, SMS_OVERAGE_PRICE, '12.03.2026–12.04.2026');
  assertEquals(positions.length, 1);
  assertEquals(positions[0].name, 'Subskrypcja 12.03.2026–12.04.2026');
  assertEquals(positions[0].quantity, 1);
  assertEquals(positions[0].unit_price_net, 299);
  assertEquals(positions[0].vat_rate, VAT_RATE * 100);
});

Deno.test('buildInvoicePositions — returns 2 positions when overage', () => {
  const positions = buildInvoicePositions(299, 25, SMS_OVERAGE_PRICE, '12.03.2026–12.04.2026');
  assertEquals(positions.length, 2);
  assertEquals(positions[1].name, 'Nadwyżka SMS za poprzedni okres');
  assertEquals(positions[1].quantity, 25);
  assertEquals(positions[1].unit_price_net, SMS_OVERAGE_PRICE);
});

// ============================================================================
// getNextBillingDate
// ============================================================================

Deno.test('getNextBillingDate — adds 1 month with billing day 10', () => {
  // Use UTC constructor so the test is timezone-independent
  const current = new Date('2026-03-10T00:00:00Z');
  const next = getNextBillingDate(current, 10);
  assertEquals(next.getUTCFullYear(), 2026);
  assertEquals(next.getUTCMonth(), 3); // April
  assertEquals(next.getUTCDate(), 10);
});

Deno.test('getNextBillingDate — billing day 20 December → January next year', () => {
  const current = new Date('2026-12-20T00:00:00Z');
  const next = getNextBillingDate(current, 20);
  assertEquals(next.getUTCFullYear(), 2027);
  assertEquals(next.getUTCMonth(), 0); // January
  assertEquals(next.getUTCDate(), 20);
});

Deno.test('getNextBillingDate — billing day 1 preserves day', () => {
  const current = new Date('2026-05-01T00:00:00Z');
  const next = getNextBillingDate(current, 1);
  assertEquals(next.getUTCMonth(), 5); // June
  assertEquals(next.getUTCDate(), 1);
});

// Regression: getNextBillingDate must return a UTC Date so .toISOString() does not shift the date
Deno.test('getNextBillingDate — toISOString does not shift date', () => {
  const current = new Date('2026-04-01T00:00:00Z');
  const next = getNextBillingDate(current, 1);
  assertEquals(next.toISOString().split('T')[0], '2026-05-01');
});

// Regression: getPrevBillingDate must return a UTC Date
Deno.test('getPrevBillingDate — toISOString does not shift date', () => {
  const current = new Date('2026-04-01T00:00:00Z');
  const p = getPrevBillingDate(current, 1);
  assertEquals(p.toISOString().split('T')[0], '2026-03-01');
});

// ============================================================================
// getPeriodEndDate
// ============================================================================

Deno.test('getPeriodEndDate — returns day before next billing date', () => {
  const next = new Date('2026-05-10T00:00:00Z');
  const end = getPeriodEndDate(next);
  assertEquals(end.toISOString().split('T')[0], '2026-05-09');
});

Deno.test('getPeriodEndDate — handles month boundary (May 1 → Apr 30)', () => {
  const next = new Date('2026-05-01T00:00:00Z');
  const end = getPeriodEndDate(next);
  assertEquals(end.toISOString().split('T')[0], '2026-04-30');
});

Deno.test('getPeriodEndDate — handles year boundary (Jan 1 → Dec 31)', () => {
  const next = new Date('2027-01-01T00:00:00Z');
  const end = getPeriodEndDate(next);
  assertEquals(end.toISOString().split('T')[0], '2026-12-31');
});

// ============================================================================
// nearestBillingDay
// ============================================================================

Deno.test('nearestBillingDay — day 1 maps to 1', () => {
  assertEquals(nearestBillingDay(new Date('2026-03-01')), 1);
});

Deno.test('nearestBillingDay — day 5 maps to 1', () => {
  assertEquals(nearestBillingDay(new Date('2026-03-05')), 1);
});

Deno.test('nearestBillingDay — day 6 maps to 10', () => {
  assertEquals(nearestBillingDay(new Date('2026-03-06')), 10);
});

Deno.test('nearestBillingDay — day 15 maps to 10', () => {
  assertEquals(nearestBillingDay(new Date('2026-03-15')), 10);
});

Deno.test('nearestBillingDay — day 16 maps to 20', () => {
  assertEquals(nearestBillingDay(new Date('2026-03-16')), 20);
});

Deno.test('nearestBillingDay — day 24 maps to 20', () => {
  assertEquals(nearestBillingDay(new Date('2026-03-24')), 20);
});

Deno.test('nearestBillingDay — day 28 maps to 20', () => {
  assertEquals(nearestBillingDay(new Date('2026-03-28')), 20);
});

Deno.test('nearestBillingDay — day 31 maps to 20', () => {
  assertEquals(nearestBillingDay(new Date('2026-03-31')), 20);
});

// ============================================================================
// formatPeriodLabel
// ============================================================================

Deno.test('formatPeriodLabel — formats dates correctly', () => {
  const start = new Date('2026-03-12');
  const end = new Date('2026-04-12');
  assertEquals(formatPeriodLabel(start, end), '12.03.2026\u201312.04.2026');
});

Deno.test('formatPeriodLabel — pads single-digit day and month', () => {
  const start = new Date('2026-01-05');
  const end = new Date('2026-02-05');
  assertEquals(formatPeriodLabel(start, end), '05.01.2026\u201305.02.2026');
});
