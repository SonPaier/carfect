import { assert, assertEquals } from 'jsr:@std/assert';
import { computePickupDate, isWeekend } from './pickupDate.ts';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a Date that, in Warsaw, falls on YYYY-MM-DD at HH:00 local time.
 * Warsaw is UTC+1 in winter (CET) and UTC+2 in summer (CEST).
 *
 * Using `Date.UTC(y, m-1, d, h - offset)` keeps assertions explicit.
 */
function warsawMoment(
  y: number,
  m: number,
  d: number,
  h: number,
  offsetHoursFromUtc: number,
): Date {
  return new Date(Date.UTC(y, m - 1, d, h - offsetHoursFromUtc));
}

const CEST = 2; // summer offset (March–October)
const CET = 1; // winter offset (October–March)

// ─── isWeekend ─────────────────────────────────────────────────────────────────

Deno.test('isWeekend — Saturday and Sunday', () => {
  assert(isWeekend(new Date(Date.UTC(2026, 4, 2))), 'May 2, 2026 — Saturday');
  assert(isWeekend(new Date(Date.UTC(2026, 4, 3))), 'May 3, 2026 — Sunday');
});

Deno.test('isWeekend — Monday through Friday are not weekends', () => {
  // April 27 (Mon) – May 1 (Fri), 2026
  for (let day = 27; day <= 30; day++) {
    assert(!isWeekend(new Date(Date.UTC(2026, 3, day))), `April ${day}, 2026`);
  }
  assert(!isWeekend(new Date(Date.UTC(2026, 4, 1))), 'May 1, 2026 — Friday');
});

// ─── computePickupDate ─────────────────────────────────────────────────────────

Deno.test('computePickupDate — today is a weekday → today (regardless of hour)', () => {
  // Thu April 30, 2026 — verify a few times of day all return today.
  for (const h of [0, 6, 9, 12, 17, 22]) {
    const now = warsawMoment(2026, 4, 30, h, CEST);
    assertEquals(computePickupDate(now), '2026-04-30', `at ${h}:00 Warsaw`);
  }
});

Deno.test('computePickupDate — today is a holiday on a weekday → today (Apaczka validates)', () => {
  // Fri May 1, 2026 (Labour Day) is a public holiday but a weekday.
  // We send today; Apaczka will return its own holiday-rejection error if applicable.
  const now = warsawMoment(2026, 5, 1, 10, CEST);
  assertEquals(computePickupDate(now), '2026-05-01');
});

Deno.test('computePickupDate — today is Saturday → Monday', () => {
  // Sat May 2, 2026 → May 3 (Sun) → May 4 Mon.
  const now = warsawMoment(2026, 5, 2, 11, CEST);
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — today is Sunday → Monday', () => {
  const now = warsawMoment(2026, 5, 3, 11, CEST);
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — winter time (CET) handling on a weekday', () => {
  // Thu Jan 8, 2026 — ordinary winter working day.
  const now = warsawMoment(2026, 1, 8, 11, CET);
  assertEquals(computePickupDate(now), '2026-01-08');
});

Deno.test('computePickupDate — UTC late evening must use Warsaw date, not UTC date', () => {
  // 2026-04-30 23:00 Warsaw (CEST) is still April 30 in Warsaw, but already
  // April 30 21:00 UTC. Make sure we use Warsaw calendar date, not UTC.
  const now = warsawMoment(2026, 4, 30, 23, CEST);
  assertEquals(computePickupDate(now), '2026-04-30');
});
