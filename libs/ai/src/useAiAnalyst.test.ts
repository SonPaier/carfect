import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAiAnalyst } from './useAiAnalyst';

vi.mock('@ai-sdk/react', () => ({
  useChat: vi
    .fn()
    .mockReturnValue({ messages: [], sendMessage: vi.fn(), status: 'idle', error: null }),
}));
vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn().mockImplementation((opts) => opts),
}));

describe('useAiAnalyst', () => {
  it('configures DefaultChatTransport with v2 endpoint', async () => {
    const supabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } }),
      },
    } as unknown as Parameters<typeof useAiAnalyst>[0]['supabaseClient'];
    renderHook(() => useAiAnalyst({ instanceId: 'i1', schemaContext: 'carfect', supabaseClient }));
    const { DefaultChatTransport } = await import('ai');
    const opts = (DefaultChatTransport as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0][0] as { api: string };
    expect(opts.api).toBe('/api/ai-analyst-v2');
  });
});
