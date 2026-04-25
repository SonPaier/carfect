import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useInstructionSends } from './useInstructionSends';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function createMockSupabase(rows: unknown[] = [], error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data: rows, error });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from, _mocks: { select, eq, order } };
}

const mockSend = {
  id: 'send-1',
  instruction_id: 'instr-1',
  reservation_id: 'res-1',
  customer_id: 'cust-1',
  instance_id: 'inst-1',
  public_token: 'tok-abc',
  sent_at: '2026-04-25T10:00:00Z',
  post_sale_instructions: {
    id: 'instr-1',
    title: 'PPF Care Guide',
    hardcoded_key: 'ppf',
  },
};

const olderSend = {
  id: 'send-2',
  instruction_id: 'instr-2',
  reservation_id: 'res-1',
  customer_id: 'cust-1',
  instance_id: 'inst-1',
  public_token: 'tok-xyz',
  sent_at: '2026-04-20T10:00:00Z',
  post_sale_instructions: {
    id: 'instr-2',
    title: 'Ceramic Coating Care',
    hardcoded_key: 'ceramic',
  },
};

describe('useInstructionSends', () => {
  it('returns sends ordered by sent_at descending', async () => {
    const supabase = createMockSupabase([mockSend, olderSend]);
    const { result } = renderHook(
      () => useInstructionSends('res-1', supabase as never),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const sends = result.current.data ?? [];
    expect(sends.length).toBe(2);
    // Verify order mock was called with ascending: false
    expect(supabase._mocks.order).toHaveBeenCalledWith('sent_at', { ascending: false });
    expect(sends[0].id).toBe('send-1');
    expect(sends[1].id).toBe('send-2');
  });

  it('returns an empty array when no sends exist', async () => {
    const supabase = createMockSupabase([]);
    const { result } = renderHook(
      () => useInstructionSends('res-1', supabase as never),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
  });

  it('hydrates the joined instruction title and hardcoded_key', async () => {
    const supabase = createMockSupabase([mockSend]);
    const { result } = renderHook(
      () => useInstructionSends('res-1', supabase as never),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const sends = result.current.data ?? [];
    expect(sends[0].post_sale_instructions?.title).toBe('PPF Care Guide');
    expect(sends[0].post_sale_instructions?.hardcoded_key).toBe('ppf');
  });
});
