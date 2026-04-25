import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePublicInstruction } from './usePublicInstruction';
import type { PublicInstructionData } from './usePublicInstruction';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function createMockSupabase(data: unknown = null, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { rpc, _mocks: { rpc } };
}

const mockPublicInstruction: PublicInstructionData = {
  title: 'PPF Care Guide',
  content: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Keep clean.' }],
      },
    ],
  },
  instance: {
    name: 'Armcar',
    logo_url: 'https://example.com/logo.png',
    phone: '+48 123 456 789',
    email: 'contact@armcar.pl',
    address: 'ul. Przykładowa 1, Warszawa',
    website: 'https://armcar.pl',
    contact_person: 'Jan Kowalski',
  },
};

describe('usePublicInstruction', () => {
  it('does not run the query when token is undefined', async () => {
    const supabase = createMockSupabase(mockPublicInstruction);
    const { result } = renderHook(
      () => usePublicInstruction(undefined, supabase as never),
      { wrapper: createWrapper() },
    );

    // Should be idle (disabled), not loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(supabase._mocks.rpc).not.toHaveBeenCalled();
  });

  it('calls get_public_instruction RPC with the provided token', async () => {
    const supabase = createMockSupabase(mockPublicInstruction);
    const { result } = renderHook(
      () => usePublicInstruction('tok-abc123', supabase as never),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(supabase._mocks.rpc).toHaveBeenCalledWith('get_public_instruction', {
      p_token: 'tok-abc123',
    });
  });

  it('returns the typed shape with title, content, and instance fields', async () => {
    const supabase = createMockSupabase(mockPublicInstruction);
    const { result } = renderHook(
      () => usePublicInstruction('tok-abc123', supabase as never),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const data = result.current.data;
    expect(data?.title).toBe('PPF Care Guide');
    expect(data?.content.type).toBe('doc');
    expect(data?.instance.name).toBe('Armcar');
    expect(data?.instance.phone).toBe('+48 123 456 789');
  });

  it('exposes the supabase error to the consumer when the RPC fails', async () => {
    const rpcError = { message: 'Invalid token', code: 'PGRST116' };
    const supabase = createMockSupabase(null, rpcError);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const { result } = renderHook(
      () => usePublicInstruction('tok-invalid', supabase as never),
      {
        wrapper: ({ children }: { children: React.ReactNode }) =>
          React.createElement(QueryClientProvider, { client: queryClient }, children),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(rpcError);
  });
});
