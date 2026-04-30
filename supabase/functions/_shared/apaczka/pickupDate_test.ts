import { assert, assertEquals } from 'jsr:@std/assert';
import { computePickupDate, isPolishHoliday, isWorkingDay } from './pickupDate.ts';

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

// ─── isPolishHoliday ───────────────────────────────────────────────────────────

Deno.test('isPolishHoliday — fixed holidays', () => {
  // 2026 fixed holidays
  assert(isPolishHoliday(new Date(Date.UTC(2026, 0, 1))), 'New Year');
  assert(isPolishHoliday(new Date(Date.UTC(2026, 0, 6))), 'Three Kings');
  assert(isPolishHoliday(new Date(Date.UTC(2026, 4, 1))), 'Labour Day');
  assert(isPolishHoliday(new Date(Date.UTC(2026, 4, 3))), 'Constitution Day');
  assert(isPolishHoliday(new Date(Date.UTC(2026, 7, 15))), 'Assumption');
  assert(isPolishHoliday(new Date(Date.UTC(2026, 10, 1))), 'All Saints');
  assert(isPolishHoliday(new Date(Date.UTC(2026, 10, 11))), 'Independence Day');
  assert(isPolishHoliday(new Date(Date.UTC(2026, 11, 25))), 'Christmas');
  assert(isPolishHoliday(new Date(Date.UTC(2026, 11, 26))), 'Boxing Day');
});

Deno.test('isPolishHoliday — Easter Monday', () => {
  // Easter Sunday 2026 = April 5 (verified via Meeus algorithm).
  // Easter Monday 2026 = April 6.
  assert(isPolishHoliday(new Date(Date.UTC(2026, 3, 6))), 'Easter Monday 2026');
  // Easter Sunday is NOT a public holiday by Polish state law (it's the religious day,
  // employers treat it as Sunday). We don't need to mark it — only Monday is the public holiday.
  assert(
    !isPolishHoliday(new Date(Date.UTC(2026, 3, 7))),
    'April 7 (Tuesday after Easter) — not a holiday',
  );
});

Deno.test('isPolishHoliday — Corpus Christi', () => {
  // Easter Sunday 2026 = April 5; +60 days = June 4.
  assert(isPolishHoliday(new Date(Date.UTC(2026, 5, 4))), 'Corpus Christi 2026');
  assert(!isPolishHoliday(new Date(Date.UTC(2026, 5, 3))), 'June 3, 2026 — not Corpus Christi');
});

Deno.test('isPolishHoliday — Easter dates for other years', () => {
  // 2024 Easter Sunday = March 31 → Monday April 1. Corpus = May 30.
  assert(isPolishHoliday(new Date(Date.UTC(2024, 3, 1))), '2024 Easter Monday');
  assert(isPolishHoliday(new Date(Date.UTC(2024, 4, 30))), '2024 Corpus Christi');
  // 2025 Easter Sunday = April 20 → Monday April 21. Corpus = June 19.
  assert(isPolishHoliday(new Date(Date.UTC(2025, 3, 21))), '2025 Easter Monday');
  assert(isPolishHoliday(new Date(Date.UTC(2025, 5, 19))), '2025 Corpus Christi');
});

Deno.test('isPolishHoliday — non-holidays', () => {
  assert(!isPolishHoliday(new Date(Date.UTC(2026, 3, 30))), 'April 30 (Thu)');
  assert(!isPolishHoliday(new Date(Date.UTC(2026, 4, 4))), 'May 4 (Mon)');
  assert(!isPolishHoliday(new Date(Date.UTC(2026, 6, 15))), 'July 15');
});

// ─── isWorkingDay ──────────────────────────────────────────────────────────────

Deno.test('isWorkingDay — weekends are NOT working days', () => {
  assert(!isWorkingDay(new Date(Date.UTC(2026, 4, 2))), 'May 2, 2026 — Saturday');
  assert(
    !isWorkingDay(new Date(Date.UTC(2026, 4, 3))),
    'May 3, 2026 — Sunday (also Constitution Day)',
  );
});

Deno.test('isWorkingDay — holidays are NOT working days', () => {
  assert(!isWorkingDay(new Date(Date.UTC(2026, 4, 1))), 'May 1 (Fri) — Labour Day');
});

Deno.test('isWorkingDay — regular weekdays are working days', () => {
  assert(isWorkingDay(new Date(Date.UTC(2026, 3, 30))), 'April 30 (Thu)');
  assert(isWorkingDay(new Date(Date.UTC(2026, 4, 4))), 'May 4 (Mon)');
});

// ─── computePickupDate ─────────────────────────────────────────────────────────

Deno.test('computePickupDate — today is a working day → today (regardless of hour)', () => {
  // Thu April 30, 2026 — verify a few times of day all return today.
  for (const h of [0, 6, 9, 12, 14, 17, 22]) {
    const now = warsawMoment(2026, 4, 30, h, CEST);
    assertEquals(computePickupDate(now), '2026-04-30', `at ${h}:00 Warsaw`);
  }
});

Deno.test('computePickupDate — today is a holiday → next working day', () => {
  // Fri May 1, 2026 (Labour Day). Next working day after the May holiday chain = May 4.
  const now = warsawMoment(2026, 5, 1, 10, CEST);
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — today is Saturday → Monday', () => {
  // Sat May 2, 2026. May 3 (Sun + Constitution Day) skip → May 4 Mon.
  const now = warsawMoment(2026, 5, 2, 11, CEST);
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — today is Sunday → Monday', () => {
  // Sun May 3, 2026 (also Constitution Day) → May 4.
  const now = warsawMoment(2026, 5, 3, 11, CEST);
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — Easter Monday 2026 → Tuesday April 7', () => {
  const now = warsawMoment(2026, 4, 6, 9, CEST);
  assertEquals(computePickupDate(now), '2026-04-07');
});

Deno.test('computePickupDate — Christmas chain (Dec 25 → Dec 28)', () => {
  // Fri Dec 25, 2026 (Christmas) → skip; Dec 26 (Boxing Day) → skip;
  // Dec 27 (Sun) → skip; Dec 28 Mon = working.
  const now = warsawMoment(2026, 12, 25, 10, CET);
  assertEquals(computePickupDate(now), '2026-12-28');
});

Deno.test('computePickupDate — winter time (CET) handling on a working day', () => {
  // Thu Jan 8, 2026 — ordinary winter working day.
  const now = warsawMoment(2026, 1, 8, 11, CET);
  assertEquals(computePickupDate(now), '2026-01-08');
});

Deno.test('computePickupDate — UTC late evening must use Warsaw date, not UTC date', () => {
  // 2026-04-30 23:30 Warsaw (CEST) is still April 30 in Warsaw, but already
  // April 30 21:30 UTC. Make sure we use Warsaw calendar date, not UTC.
  const now = warsawMoment(2026, 4, 30, 23, CEST);
  assertEquals(computePickupDate(now), '2026-04-30');
});
