import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDeleteInstruction } from './useDeleteInstruction';

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function createMockSupabase(error: { code?: string; message: string } | null = null) {
  const eq = vi.fn().mockResolvedValue({ error });
  const del = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ delete: del });
  return { from, _mocks: { delete: del, eq } };
}

describe('useDeleteInstruction', () => {
  it('deletes by id when the instruction has never been sent', async () => {
    const supabase = createMockSupabase(null);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useDeleteInstruction(supabase as never), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 'row-1', instanceId: 'inst-1' });
    });

    expect(supabase._mocks.eq).toHaveBeenCalledWith('id', 'row-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('throws INSTRUCTION_RESTRICT_FK when supabase returns error code 23503', async () => {
    const supabase = createMockSupabase({ code: '23503', message: 'violates foreign key constraint' });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useDeleteInstruction(supabase as never), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: 'row-2', instanceId: 'inst-1' });
      } catch {
        // expected to throw
      }
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect((result.current.error as Error).message).toBe('INSTRUCTION_RESTRICT_FK');
  });
});
