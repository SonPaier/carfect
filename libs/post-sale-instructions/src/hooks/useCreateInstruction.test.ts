import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateInstruction } from './useCreateInstruction';

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function createMockSupabase(data: unknown = null, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });
  return { from, _mocks: { insert, select, single } };
}

const mockContent = { type: 'doc' as const, content: [{ type: 'paragraph', content: [] }] };

describe('useCreateInstruction', () => {
  it('inserts the row with the provided fields and returns the new row', async () => {
    const newRow = {
      id: 'new-row-1',
      instance_id: 'inst-1',
      title: 'My Instruction',
      content: mockContent,
      hardcoded_key: null,
      created_by: null,
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-01T10:00:00Z',
    };

    const supabase = createMockSupabase(newRow);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useCreateInstruction(supabase as never), {
      wrapper: createWrapper(queryClient),
    });

    let returned: typeof newRow | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({
        instanceId: 'inst-1',
        title: 'My Instruction',
        content: mockContent,
      });
    });

    expect(supabase._mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        instance_id: 'inst-1',
        title: 'My Instruction',
        content: mockContent,
        hardcoded_key: null,
      }),
    );
    expect(returned).toEqual(newRow);
  });

  it('invalidates the instructions list query on success', async () => {
    const newRow = {
      id: 'new-row-2',
      instance_id: 'inst-2',
      title: 'Another',
      content: mockContent,
      hardcoded_key: null,
      created_by: null,
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-01T10:00:00Z',
    };

    const supabase = createMockSupabase(newRow);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateInstruction(supabase as never), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        instanceId: 'inst-2',
        title: 'Another',
        content: mockContent,
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['post-sale-instructions', 'inst-2'] }),
      );
    });
  });
});
