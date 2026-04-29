// api/__tests__/ai-analyst-v2.smoke.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(),
  OpenAIEmbeddings: vi
    .fn()
    .mockImplementation(() => ({ embedQuery: vi.fn().mockResolvedValue([]) })),
}));

describe('/api/ai-analyst-v2 handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when Authorization missing', async () => {
    const { default: handler } = await import('../ai-analyst-v2');
    const req = new Request('http://localhost/api/ai-analyst-v2', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user has no roles', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    (createClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    const { default: handler } = await import('../ai-analyst-v2');
    const req = new Request('http://localhost/api/ai-analyst-v2', {
      method: 'POST',
      headers: { Authorization: 'Bearer x' },
      body: JSON.stringify({ messages: [{ role: 'user', parts: [{ type: 'text', text: 'hi' }] }] }),
    });
    const res = await handler(req);
    expect(res.status).toBe(403);
  });
});
