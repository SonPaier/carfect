// libs/ai/src/server/auditLog.test.ts
import { describe, expect, it, vi } from 'vitest';
import { computeCostUsd, insertAuditLog, type AuditLogPayload } from './auditLog';

describe('computeCostUsd', () => {
  it('computes gpt-4.1 cost from token counts', () => {
    expect(computeCostUsd({ tokens_in: 1000, tokens_out: 500, model: 'gpt-4.1' })).toBeCloseTo(
      0.002 + 0.004,
      6,
    );
  });
  it('returns 0 when tokens missing', () => {
    expect(computeCostUsd({ tokens_in: null, tokens_out: null, model: 'gpt-4.1' })).toBe(0);
  });
});

describe('insertAuditLog', () => {
  it('inserts a row with the given payload', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn().mockReturnValue({ insert }) } as unknown as Parameters<
      typeof insertAuditLog
    >[0];
    const payload: AuditLogPayload = {
      instance_id: 'i1',
      user_id: 'u1',
      question: 'Q',
      tool_calls: [],
      final_answer: 'A',
      tokens_in: 10,
      tokens_out: 5,
      duration_ms: 1234,
      status: 'success',
      error_message: null,
    };
    await insertAuditLog(supabase, payload);
    expect(supabase.from).toHaveBeenCalledWith('ai_analyst_logs');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ instance_id: 'i1', status: 'success' }),
    );
  });

  it('swallows insert errors (non-blocking)', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: 'db down' } });
    const supabase = { from: vi.fn().mockReturnValue({ insert }) } as unknown as Parameters<
      typeof insertAuditLog
    >[0];
    const payload = {
      instance_id: 'i1',
      user_id: 'u1',
      question: 'Q',
      tool_calls: [],
      final_answer: '',
      tokens_in: 0,
      tokens_out: 0,
      duration_ms: 0,
      status: 'error',
      error_message: 'x',
    } satisfies AuditLogPayload;
    await expect(insertAuditLog(supabase, payload)).resolves.toBeUndefined(); // does not throw
  });
});
