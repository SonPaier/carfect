export const SMS_OVERAGE_PRICE = 0.12;
export const VAT_RATE = 0.23;
export const PAYMENT_DUE_DAYS = 7;
export const BILLING_DAYS = [1, 10, 20] as const;

export interface InvoicePosition {
  name: string;
  quantity: number;
  unit_price_net: number;
  vat_rate: number;
}

export function calculateSmsOverage(smsCount: number, smsLimit: number): number {
  return Math.max(0, smsCount - smsLimit);
}

export function calculateInvoiceAmounts(
  monthlyPrice: number,
  smsOverage: number,
  smsOveragePrice: number,
): { net: number; gross: number } {
  const net = Math.round((monthlyPrice + smsOverage * smsOveragePrice) * 100) / 100;
  const gross = Math.round(net * (1 + VAT_RATE) * 100) / 100;
  return { net, gross };
}

export function buildInvoicePositions(
  monthlyPrice: number,
  smsOverage: number,
  smsOveragePrice: number,
  periodLabel: string,
): InvoicePosition[] {
  const positions: InvoicePosition[] = [
    {
      name: `Subskrypcja ${periodLabel}`,
      quantity: 1,
      unit_price_net: monthlyPrice,
      vat_rate: VAT_RATE * 100,
    },
  ];
  if (smsOverage > 0) {
    positions.push({
      name: 'Nadwyżka SMS za poprzedni okres',
      quantity: smsOverage,
      unit_price_net: smsOveragePrice,
      vat_rate: VAT_RATE * 100,
    });
  }
  return positions;
}

/**
 * Get next billing date: same billing_day in next month.
 * billing_day is one of [1, 10, 20].
 * Uses Date.UTC to avoid local-timezone drift when .toISOString() is called.
 */
export function getNextBillingDate(current: Date, billingDay: number): Date {
  return new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, billingDay));
}

/**
 * Get previous billing date: same billing_day in previous month.
 * Uses Date.UTC to avoid local-timezone drift when .toISOString() is called.
 */
export function getPrevBillingDate(current: Date, billingDay: number): Date {
  return new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, billingDay));
}

/**
 * Get period end date: day before the next billing date.
 * E.g. billing_day=10, current=2026-04-10 → period end = 2026-05-09
 * This ensures periods don't overlap (10.04–09.05, 10.05–09.06, etc.)
 */
export function getPeriodEndDate(nextBillingDate: Date): Date {
  const end = new Date(nextBillingDate.getTime());
  end.setUTCDate(end.getUTCDate() - 1);
  return end;
}

/**
 * Find nearest billing day (1/10/20) for a given date.
 * Ties round UP to the later day (e.g. day 15 → 20).
 */
export function nearestBillingDay(date: Date): number {
  const day = date.getUTCDate();
  let closest = BILLING_DAYS[0];
  let minDist = Math.abs(day - closest);
  for (const bd of BILLING_DAYS) {
    const dist = Math.abs(day - bd);
    if (dist < minDist || (dist === minDist && bd > closest)) {
      minDist = dist;
      closest = bd;
    }
  }
  return closest;
}

export function formatPeriodLabel(start: Date, end: Date): string {
  const fmt = (d: Date) => {
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };
  return `${fmt(start)}\u2013${fmt(end)}`;
}
