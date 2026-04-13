import Holidays from 'date-holidays';

const hd = new Holidays('PL');

/** Build a Map<YYYY-MM-DD, holiday name> for a set of years */
export function buildHolidayMap(years: number[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const year of years) {
    const holidays = hd.getHolidays(year);
    for (const h of holidays) {
      if (h.type !== 'public') continue; // only public holidays
      const dateStr = h.date.slice(0, 10); // "YYYY-MM-DD ..."
      map.set(dateStr, h.name);
    }
  }
  return map;
}
