// libs/ai/src/server/rateLimit.test.ts
import { describe, expect, it, vi } from 'vitest';
import { enforceRateLimit } from './rateLimit';
import { AiAnalystAuthError } from './resolveInstanceId';

const makeSupabase = (countResp: { count: number | null; error: unknown | null }) =>
  ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue(countResp),
    }),
  }) as unknown as Parameters<typeof enforceRateLimit>[0];

describe('enforceRateLimit', () => {
  it('allows when under limit', async () => {
    const supabase = makeSupabase({ count: 5, error: null });
    await expect(enforceRateLimit(supabase, 'u1', 'i1')).resolves.toBeUndefined();
  });

  it('throws 429 when at user-hour limit (30)', async () => {
    const supabase = makeSupabase({ count: 30, error: null });
    await expect(enforceRateLimit(supabase, 'u1', 'i1')).rejects.toMatchObject({ status: 429 });
  });

  it('throws when supabase errors', async () => {
    const supabase = makeSupabase({ count: null, error: { message: 'db error' } });
    await expect(enforceRateLimit(supabase, 'u1', 'i1')).rejects.toThrow();
  });
});
