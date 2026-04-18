import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUltrafitOrderRolls } from './useUltrafitOrderRolls';

const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

const mockRollsResponse = {
  rolls: [
    {
      brand: 'Ultrafit',
      productName: 'XP Crystal',
      widthMm: 1524,
      usedMb: 15,
      barcode: '1234567890',
    },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useUltrafitOrderRolls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when enabled is false', () => {
    const { result } = renderHook(
      () => useUltrafitOrderRolls({ orderId: 'order-1', enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('does not fetch when orderId is null', () => {
    const { result } = renderHook(
      () => useUltrafitOrderRolls({ orderId: null, enabled: true }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('calls invoke with correct params when enabled and orderId provided', async () => {
    mockInvoke.mockResolvedValue({ data: mockRollsResponse, error: null });

    const { result } = renderHook(
      () => useUltrafitOrderRolls({ orderId: 'order-1', enabled: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke).toHaveBeenCalledWith('ultrafit-order-rolls', {
      body: { orderId: 'order-1' },
    });
    expect(result.current.data?.rolls).toHaveLength(1);
    expect(result.current.data?.rolls[0].brand).toBe('Ultrafit');
  });

  it('throws when invoke returns error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Forbidden') });

    const { result } = renderHook(
      () => useUltrafitOrderRolls({ orderId: 'order-1', enabled: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
