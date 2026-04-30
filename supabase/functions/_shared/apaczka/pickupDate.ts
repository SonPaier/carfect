/**
 * Compute the courier pickup date for Apaczka.
 *
 * Behaviour:
 * - Use TODAY (Europe/Warsaw) if it's a working day.
 * - Otherwise advance day-by-day until a working day is found.
 * - "Working day" = Mon–Fri AND not a Polish public holiday.
 *
 * The returned string is the date in `YYYY-MM-DD` format, expressed in Warsaw local time.
 */

const FIXED_POLISH_HOLIDAYS: ReadonlyArray<readonly [number, number]> = [
  [1, 1], //  Nowy Rok
  [1, 6], //  Trzech Króli
  [5, 1], //  Święto Pracy
  [5, 3], //  Konstytucji 3 Maja
  [8, 15], // Wniebowzięcie NMP / Wojska Polskiego
  [11, 1], // Wszystkich Świętych
  [11, 11], // Święto Niepodległości
  [12, 25], // Boże Narodzenie
  [12, 26], // 2. dzień Bożego Narodzenia
];

/**
 * Easter Sunday using Meeus/Jones/Butcher Gregorian algorithm.
 * Returns a Date at UTC midnight of Easter Sunday in the given year.
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 or 4
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Adds N days to a UTC-midnight date and returns a new Date. */
function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/**
 * Returns true if the given UTC-midnight date is a Polish public holiday.
 * The date should represent a Warsaw-local calendar day at UTC midnight.
 */
export function isPolishHoliday(date: Date): boolean {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  if (FIXED_POLISH_HOLIDAYS.some(([m, d]) => m === month && d === day)) {
    return true;
  }

  const easter = getEasterSunday(year);
  const easterMonday = addUtcDays(easter, 1);
  if (easterMonday.getUTCMonth() + 1 === month && easterMonday.getUTCDate() === day) {
    return true;
  }

  // Boże Ciało = Easter Sunday + 60 days
  const corpusChristi = addUtcDays(easter, 60);
  if (corpusChristi.getUTCMonth() + 1 === month && corpusChristi.getUTCDate() === day) {
    return true;
  }

  return false;
}

/**
 * Returns true if the given UTC-midnight date is Mon–Fri AND not a Polish public holiday.
 */
export function isWorkingDay(date: Date): boolean {
  const weekday = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  if (weekday === 0 || weekday === 6) return false;
  return !isPolishHoliday(date);
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
 * @returns `YYYY-MM-DD` (Warsaw local calendar day).
 */
export function computePickupDate(now: Date = new Date()): string {
  const { year, month, day } = getWarsawDate(now);

  // Warsaw-local midnight, represented as UTC midnight (so getUTC* reads back the same Y/M/D).
  let date = new Date(Date.UTC(year, month - 1, day));

  while (!isWorkingDay(date)) {
    date = addUtcDays(date, 1);
  }

  return date.toISOString().slice(0, 10);
}
