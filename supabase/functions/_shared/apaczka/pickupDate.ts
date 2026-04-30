/**
 * Compute the courier pickup date for Apaczka.
 *
 * Behaviour:
 * - Use TODAY (Europe/Warsaw) if it's a weekday.
 * - If today is Saturday or Sunday, advance to the next Monday.
 *
 * Polish public-holiday validation is intentionally delegated to Apaczka — the
 * API rejects holiday pickup requests, and we don't want to maintain a duplicate
 * holiday calendar here.
 *
 * The returned string is the date in `YYYY-MM-DD` format, expressed in Warsaw local time.
 */

/** Adds N days to a UTC-midnight date and returns a new Date. */
function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Returns true if the given UTC-midnight date is Saturday or Sunday. */
export function isWeekend(date: Date): boolean {
  const weekday = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  return weekday === 0 || weekday === 6;
}

/** Decompose a `Date` into Warsaw-local Y/M/D integers. */
function getWarsawDate(now: Date): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value, 10);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * Compute the pickup date string for Apaczka.
 *
 * @param now Reference moment (defaults to current time). Pass a fixed Date in tests.
 * @returns `YYYY-MM-DD` (Warsaw local calendar day), rolled forward off weekends.
 */
export function computePickupDate(now: Date = new Date()): string {
  const { year, month, day } = getWarsawDate(now);

  // Warsaw-local midnight, represented as UTC midnight (so getUTC* reads back the same Y/M/D).
  let date = new Date(Date.UTC(year, month - 1, day));

  while (isWeekend(date)) {
    date = addUtcDays(date, 1);
  }

  return date.toISOString().slice(0, 10);
}
