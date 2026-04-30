import { assert, assertEquals } from 'jsr:@std/assert';
import { computePickupDate, isPolishHoliday, isWorkingDay } from './pickupDate.ts';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a Date that, in Warsaw, falls on YYYY-MM-DD at HH:00 local time.
 * Warsaw is UTC+1 in winter (CET) and UTC+2 in summer (CEST). Most of our
 * scenarios are in late April / May 2026 which is CEST.
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

Deno.test('computePickupDate — before cutoff on a working day → today', () => {
  // Thu April 30, 2026, 13:00 Warsaw time (CEST = UTC+2). Cutoff is 14:00.
  const now = warsawMoment(2026, 4, 30, 13, CEST);
  assertEquals(computePickupDate(now), '2026-04-30');
});

Deno.test('computePickupDate — at exactly 14:00 → roll to next working day', () => {
  const now = warsawMoment(2026, 4, 30, 14, CEST);
  // Today (Apr 30) Thu. At cutoff → tomorrow (May 1, Labour Day) → skip;
  // May 2 Sat → skip; May 3 Sun (and Constitution Day) → skip; May 4 Mon → working.
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — after cutoff (15:00) → next working day', () => {
  const now = warsawMoment(2026, 4, 30, 15, CEST);
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — late evening just before midnight Warsaw', () => {
  const now = warsawMoment(2026, 4, 30, 23, CEST);
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — early morning (06:00) on a working weekday → today', () => {
  const now = warsawMoment(2026, 4, 30, 6, CEST);
  assertEquals(computePickupDate(now), '2026-04-30');
});

Deno.test('computePickupDate — today is a holiday → next working day', () => {
  // Fri May 1, 2026 (Labour Day) at 10:00 Warsaw.
  const now = warsawMoment(2026, 5, 1, 10, CEST);
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — today is Saturday → Monday', () => {
  // Sat May 2, 2026 at 11:00 Warsaw.
  const now = warsawMoment(2026, 5, 2, 11, CEST);
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — today is Sunday → Monday', () => {
  // Sun May 3, 2026 at 11:00 (also Constitution Day).
  const now = warsawMoment(2026, 5, 3, 11, CEST);
  assertEquals(computePickupDate(now), '2026-05-04');
});

Deno.test('computePickupDate — Easter Monday 2026 → Tuesday April 7', () => {
  // Mon April 6 2026 (Easter Monday) at 09:00.
  const now = warsawMoment(2026, 4, 6, 9, CEST);
  assertEquals(computePickupDate(now), '2026-04-07');
});

Deno.test('computePickupDate — Friday before cutoff → Friday', () => {
  // Fri April 17, 2026 at 12:00 — ordinary working Friday.
  const now = warsawMoment(2026, 4, 17, 12, CEST);
  assertEquals(computePickupDate(now), '2026-04-17');
});

Deno.test('computePickupDate — Friday after cutoff → Monday', () => {
  const now = warsawMoment(2026, 4, 17, 15, CEST);
  assertEquals(computePickupDate(now), '2026-04-20');
});

Deno.test('computePickupDate — winter time (CET) handling', () => {
  // Thu Jan 8, 2026 at 11:00 Warsaw (winter = UTC+1) — before 14:00 cutoff.
  const now = warsawMoment(2026, 1, 8, 11, CET);
  assertEquals(computePickupDate(now), '2026-01-08');
});

Deno.test('computePickupDate — winter, after cutoff', () => {
  const now = warsawMoment(2026, 1, 8, 15, CET);
  // Jan 9 = Friday, working.
  assertEquals(computePickupDate(now), '2026-01-09');
});

Deno.test('computePickupDate — Christmas chain (Dec 24 afternoon)', () => {
  // Thu Dec 24, 2026 at 15:00 Warsaw (winter = UTC+1) — past 14:00 cutoff.
  // Today after cutoff → Dec 25 (Christmas) skip → Dec 26 (Boxing Day) skip
  // → Dec 27 (Sun) skip → Dec 28 Mon = working.
  const now = warsawMoment(2026, 12, 24, 15, CET);
  assertEquals(computePickupDate(now), '2026-12-28');
});

Deno.test('computePickupDate — custom cutoff parameter', () => {
  // 12:00 with cutoff=12 → roll over.
  const now = warsawMoment(2026, 4, 17, 12, CEST);
  assertEquals(computePickupDate(now, 12), '2026-04-20');
  // 11:59 with cutoff=12 → today.
  const before = warsawMoment(2026, 4, 17, 11, CEST);
  assertEquals(computePickupDate(before, 12), '2026-04-17');
});
