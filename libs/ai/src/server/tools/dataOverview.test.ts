// libs/ai/src/server/tools/dataOverview.test.ts
import { describe, expect, it, vi } from 'vitest';
import { computeDataOverview } from './dataOverview';

const ALLOWED_TABLES = new Set(['reservations', 'customers', 'sales_orders', 'offers']);

describe('computeDataOverview', () => {
  it('returns total count when no date_column', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(Promise.resolve({ count: 47, error: null })),
      }),
    } as unknown as Parameters<typeof computeDataOverview>[0];
    const result = await computeDataOverview(supabase, 'reservations', undefined, ALLOWED_TABLES);
    expect(result).toEqual({ total_rows: 47 });
  });

  it('returns date range when date_column given', async () => {
    const calls: string[] = [];
    const supabase = {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation((cols: string) => {
          calls.push(cols);
          if (cols.includes('count')) return Promise.resolve({ count: 100, error: null });
          if (cols.includes('min'))
            return Promise.resolve({
              data: [{ min: '2024-01-01', max: '2026-04-30' }],
              error: null,
            });
          return Promise.resolve({ data: [], error: null });
        }),
      })),
    } as unknown as Parameters<typeof computeDataOverview>[0];
    const result = await computeDataOverview(
      supabase,
      'reservations',
      'reservation_date',
      ALLOWED_TABLES,
    );
    expect(result.total_rows).toBe(100);
    expect(result.date_range).toEqual({ min: '2024-01-01', max: '2026-04-30' });
  });

  it('rejects table not in allowlist', async () => {
    const supabase = {} as Parameters<typeof computeDataOverview>[0];
    await expect(
      computeDataOverview(supabase, 'pg_user', undefined, ALLOWED_TABLES),
    ).rejects.toThrow(/not allowed/i);
  });
});
