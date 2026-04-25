import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSendInstruction, buildInstructionPublicUrl } from './useSendInstruction';

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function createMockSupabase(data: unknown = null, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn().mockReturnValue({ single });
  const upsert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ upsert });
  return { from, _mocks: { upsert, select, single } };
}

const mockSendRow = {
  id: 'send-1',
  instruction_id: 'instr-1',
  reservation_id: 'res-1',
  customer_id: 'cust-1',
  instance_id: 'inst-1',
  public_token: 'tok-abc123',
  sent_at: '2026-04-25T10:00:00Z',
};

describe('useSendInstruction', () => {
  it('upserts the send row and returns the public_token', async () => {
    const supabase = createMockSupabase(mockSendRow);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useSendInstruction(supabase as never), {
      wrapper: createWrapper(queryClient),
    });

    let returned: typeof mockSendRow | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({
        instructionId: 'instr-1',
        reservationId: 'res-1',
        customerId: 'cust-1',
        instanceId: 'inst-1',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(returned?.public_token).toBe('tok-abc123');
  });

  it('preserves the existing token on re-send via onConflict clause', async () => {
    const supabase = createMockSupabase(mockSendRow);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useSendInstruction(supabase as never), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        instructionId: 'instr-1',
        reservationId: 'res-1',
        customerId: 'cust-1',
        instanceId: 'inst-1',
      });
    });

    expect(supabase._mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        instruction_id: 'instr-1',
        reservation_id: 'res-1',
      }),
      expect.objectContaining({ onConflict: 'reservation_id,instruction_id' }),
    );
  });

  it('invalidates the instruction-sends query for the affected reservation', async () => {
    const supabase = createMockSupabase(mockSendRow);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSendInstruction(supabase as never), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        instructionId: 'instr-1',
        reservationId: 'res-1',
        customerId: null,
        instanceId: 'inst-1',
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['instruction-sends', 'res-1'] }),
    );
  });
});

describe('buildInstructionPublicUrl', () => {
  it('builds a public URL with the provided slug and token', () => {
    const url = buildInstructionPublicUrl('armcar', 'tok-abc123');
    expect(url).toBe('https://armcar.carfect.pl/instrukcje/tok-abc123');
  });
});
