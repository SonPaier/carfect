// libs/ai/src/server/tools/runSql.test.ts
import { describe, expect, it, vi } from 'vitest';
import { extractFromTable, executeRunSql } from './runSql';

const ALLOWED = new Set(['reservations', 'customers']);

describe('extractFromTable', () => {
  it('extracts table after FROM', () => {
    expect(extractFromTable('SELECT * FROM reservations WHERE x=1')).toBe('reservations');
  });
  it('handles lowercase from', () => {
    expect(extractFromTable('select count(*) from customers')).toBe('customers');
  });
  it('returns null when no FROM', () => {
    expect(extractFromTable('SELECT 1')).toBeNull();
  });
  it('handles schema-qualified', () => {
    expect(extractFromTable('SELECT * FROM public.reservations')).toBe('reservations');
  });
});

describe('executeRunSql', () => {
  it('rejects invalid SQL', async () => {
    const supabase = {} as Parameters<typeof executeRunSql>[0];
    const result = await executeRunSql(
      supabase,
      { sql: 'DELETE FROM x', intent: 'test' },
      'i1',
      ALLOWED,
    );
    const parsed = JSON.parse(result);
    expect(parsed.error).toMatch(/select/i);
  });

  it('injects LIMIT 50 when missing', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ a: 1 }], error: null });
    const supabase = { rpc } as unknown as Parameters<typeof executeRunSql>[0];
    await executeRunSql(
      supabase,
      { sql: 'SELECT * FROM reservations', intent: 'test' },
      'i1',
      ALLOWED,
    );
    const callArg = rpc.mock.calls[0][1].query_text;
    expect(callArg).toMatch(/LIMIT 50$/i);
  });

  it('does not inject LIMIT when present', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ a: 1 }], error: null });
    const supabase = { rpc } as unknown as Parameters<typeof executeRunSql>[0];
    await executeRunSql(
      supabase,
      { sql: 'SELECT * FROM reservations LIMIT 10', intent: 'test' },
      'i1',
      ALLOWED,
    );
    const callArg = rpc.mock.calls[0][1].query_text;
    expect(callArg).toMatch(/LIMIT 10$/i);
    expect(callArg).not.toMatch(/LIMIT 50/i);
  });

  it('returns rows on success', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ a: 1 }, { a: 2 }], error: null });
    const supabase = { rpc } as unknown as Parameters<typeof executeRunSql>[0];
    const result = await executeRunSql(
      supabase,
      { sql: 'SELECT a FROM reservations LIMIT 10', intent: 'test' },
      'i1',
      ALLOWED,
    );
    const parsed = JSON.parse(result);
    expect(parsed.row_count).toBe(2);
    expect(parsed.rows).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('attaches auto_overview when 0 rows', async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: [], error: null });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(Promise.resolve({ count: 1247, error: null })),
    });
    const supabase = { rpc, from } as unknown as Parameters<typeof executeRunSql>[0];
    const result = await executeRunSql(
      supabase,
      {
        sql: "SELECT * FROM reservations WHERE reservation_date = '2099-01-01' LIMIT 10",
        intent: 'test',
      },
      'i1',
      ALLOWED,
    );
    const parsed = JSON.parse(result);
    expect(parsed.row_count).toBe(0);
    expect(parsed.auto_overview).toBeDefined();
    expect(parsed.auto_overview.total_rows).toBe(1247);
  });

  it('returns error when RPC fails', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'syntax error' } });
    const supabase = { rpc } as unknown as Parameters<typeof executeRunSql>[0];
    const result = await executeRunSql(
      supabase,
      { sql: 'SELECT * FROM reservations LIMIT 10', intent: 'test' },
      'i1',
      ALLOWED,
    );
    const parsed = JSON.parse(result);
    expect(parsed.error).toMatch(/syntax error/);
  });
});
