// libs/ai/src/server/tools/getToday.test.ts
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { computeTodayBoundaries, createGetTodayTool } from './getToday';

describe('computeTodayBoundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-30T10:30:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns ISO date for today', () => {
    expect(computeTodayBoundaries().date).toBe('2026-04-30');
  });

  it('returns Monday as week_start', () => {
    expect(computeTodayBoundaries().week_start).toBe('2026-04-27');
  });

  it('returns first of current month', () => {
    expect(computeTodayBoundaries().month_start).toBe('2026-04-01');
  });

  it('returns previous month boundaries', () => {
    const r = computeTodayBoundaries();
    expect(r.prev_month_start).toBe('2026-03-01');
    expect(r.prev_month_end).toBe('2026-03-31');
  });

  it('returns first of current quarter (Q2)', () => {
    expect(computeTodayBoundaries().quarter_start).toBe('2026-04-01');
  });

  it('returns first of current year', () => {
    expect(computeTodayBoundaries().year_start).toBe('2026-01-01');
  });

  it('returns weekday in lowercase English', () => {
    expect(computeTodayBoundaries().weekday).toBe('thursday');
  });
});

describe('createGetTodayTool', () => {
  it('creates a langchain Tool that returns boundaries', async () => {
    const tool = createGetTodayTool();
    expect(tool.name).toBe('get_today');
    const result = await tool.invoke({});
    expect(typeof result === 'string' ? JSON.parse(result) : result).toHaveProperty('date');
  });
});
