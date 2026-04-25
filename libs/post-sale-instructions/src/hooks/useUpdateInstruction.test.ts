import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUpdateInstruction } from './useUpdateInstruction';

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function createMockSupabase(data: unknown = null, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return { from, _mocks: { update, eq, select, single } };
}

const mockContent = { type: 'doc' as const, content: [{ type: 'paragraph', content: [] }] };

describe('useUpdateInstruction', () => {
  it('updates only title and content, not instance_id', async () => {
    const updatedRow = {
      id: 'row-1',
      instance_id: 'inst-1',
      title: 'Updated Title',
      content: mockContent,
      hardcoded_key: null,
      created_by: null,
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-02T10:00:00Z',
    };

    const supabase = createMockSupabase(updatedRow);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useUpdateInstruction(supabase as never), {
      wrapper: createWrapper(queryClient),
    });

    let returned: typeof updatedRow | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({
        id: 'row-1',
        instanceId: 'inst-1',
        title: 'Updated Title',
        content: mockContent,
      });
    });

    // Only title and content should be passed to update, not instance_id
    expect(supabase._mocks.update).toHaveBeenCalledWith({
      title: 'Updated Title',
      content: mockContent,
    });
    expect(returned).toEqual(updatedRow);
  });
});
