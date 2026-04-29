// libs/ai/src/server/resolveInstanceId.test.ts
import { describe, expect, it, vi } from 'vitest';
import { resolveInstanceId, AiAnalystAuthError } from './resolveInstanceId';

const makeReq = (headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/ai-analyst-v2', { method: 'POST', headers });

const makeSupabase = (userResponse: unknown, rolesResponse: unknown) =>
  ({
    auth: { getUser: vi.fn().mockResolvedValue(userResponse) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue(rolesResponse),
    }),
  }) as unknown as Parameters<typeof resolveInstanceId>[1];

describe('resolveInstanceId', () => {
  it('throws 401 when Authorization header missing', async () => {
    const supabase = makeSupabase({ data: { user: null }, error: null }, { data: [], error: null });
    await expect(resolveInstanceId(makeReq(), supabase)).rejects.toMatchObject({ status: 401 });
  });

  it('throws 401 when JWT invalid', async () => {
    const supabase = makeSupabase(
      { data: { user: null }, error: { message: 'bad jwt' } },
      { data: [], error: null },
    );
    await expect(
      resolveInstanceId(makeReq({ Authorization: 'Bearer x' }), supabase),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('throws 403 when user has no roles', async () => {
    const supabase = makeSupabase(
      { data: { user: { id: 'u1' } }, error: null },
      { data: [], error: null },
    );
    await expect(
      resolveInstanceId(makeReq({ Authorization: 'Bearer x' }), supabase),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns single instance when user has one role', async () => {
    const supabase = makeSupabase(
      { data: { user: { id: 'u1' } }, error: null },
      { data: [{ instance_id: 'i1' }], error: null },
    );
    await expect(
      resolveInstanceId(makeReq({ Authorization: 'Bearer x' }), supabase),
    ).resolves.toEqual({ user_id: 'u1', instance_id: 'i1' });
  });

  it('throws 403 when multi-instance user omits X-Carfect-Instance', async () => {
    const supabase = makeSupabase(
      { data: { user: { id: 'u1' } }, error: null },
      { data: [{ instance_id: 'i1' }, { instance_id: 'i2' }], error: null },
    );
    await expect(
      resolveInstanceId(makeReq({ Authorization: 'Bearer x' }), supabase),
    ).rejects.toMatchObject({ status: 403, message: expect.stringMatching(/instance/i) });
  });

  it('throws 403 when X-Carfect-Instance not in user allowlist', async () => {
    const supabase = makeSupabase(
      { data: { user: { id: 'u1' } }, error: null },
      { data: [{ instance_id: 'i1' }, { instance_id: 'i2' }], error: null },
    );
    await expect(
      resolveInstanceId(
        makeReq({ Authorization: 'Bearer x', 'X-Carfect-Instance': 'i3' }),
        supabase,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns selected instance when multi-instance user provides valid header', async () => {
    const supabase = makeSupabase(
      { data: { user: { id: 'u1' } }, error: null },
      { data: [{ instance_id: 'i1' }, { instance_id: 'i2' }], error: null },
    );
    await expect(
      resolveInstanceId(
        makeReq({ Authorization: 'Bearer x', 'X-Carfect-Instance': 'i2' }),
        supabase,
      ),
    ).resolves.toEqual({ user_id: 'u1', instance_id: 'i2' });
  });
});
