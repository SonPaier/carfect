/** Compute Easter Sunday (Anonymous Gregorian algorithm) */
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
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Build a Map<YYYY-MM-DD, holiday name> for a set of years */
export function buildHolidayMap(years: number[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const year of years) {
    const easter = getEasterSunday(year);
    const easterMonday = addDaysToDate(easter, 1);
    const corpusChristi = addDaysToDate(easter, 60);
    const holidays: [string, string][] = [
      [`${year}-01-01`, 'Nowy Rok'],
      [`${year}-01-06`, 'Trzech Króli'],
      [fmt(easter), 'Wielkanoc'],
      [fmt(easterMonday), 'Pon. Wielkanocny'],
      [`${year}-05-01`, 'Święto Pracy'],
      [`${year}-05-03`, '3 Maja'],
      [fmt(corpusChristi), 'Boże Ciało'],
      [`${year}-08-15`, 'Wniebowzięcie NMP'],
      [`${year}-11-01`, 'Wszystkich Świętych'],
      [`${year}-11-11`, 'Niepodległość'],
      [`${year}-12-25`, 'Boże Narodzenie'],
      [`${year}-12-26`, '2. dzień Bożego Nar.'],
    ];
    holidays.forEach(([date, name]) => map.set(date, name));
  }
  return map;
}
