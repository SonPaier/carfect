// libs/ai/src/server/tools/getToday.ts
import { tool } from 'langchain';
import { z } from 'zod';

export interface TodayBoundaries {
  date: string;
  weekday: string;
  week_start: string;
  month_start: string;
  prev_month_start: string;
  prev_month_end: string;
  quarter_start: string;
  year_start: string;
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function computeTodayBoundaries(now: Date = new Date()): TodayBoundaries {
  const y = now.getUTCFullYear(),
    m = now.getUTCMonth(),
    d = now.getUTCDate();
  const date = new Date(Date.UTC(y, m, d));
  const dow = date.getUTCDay(); // 0=Sun..6=Sat
  const monOffset = (dow + 6) % 7;
  const week = new Date(date);
  week.setUTCDate(date.getUTCDate() - monOffset);
  const monthStart = new Date(Date.UTC(y, m, 1));
  const prevMonthStart = new Date(Date.UTC(y, m - 1, 1));
  const prevMonthEnd = new Date(Date.UTC(y, m, 0));
  const quarterStart = new Date(Date.UTC(y, Math.floor(m / 3) * 3, 1));
  const yearStart = new Date(Date.UTC(y, 0, 1));
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return {
    date: isoDate(date),
    weekday: weekdays[dow],
    week_start: isoDate(week),
    month_start: isoDate(monthStart),
    prev_month_start: isoDate(prevMonthStart),
    prev_month_end: isoDate(prevMonthEnd),
    quarter_start: isoDate(quarterStart),
    year_start: isoDate(yearStart),
  };
}

export function createGetTodayTool() {
  return tool(async () => JSON.stringify(computeTodayBoundaries()), {
    name: 'get_today',
    description:
      'Return deterministic date boundaries (today, week_start, month_start, prev_month_start/end, quarter_start, year_start).',
    schema: z.object({}),
  });
}
