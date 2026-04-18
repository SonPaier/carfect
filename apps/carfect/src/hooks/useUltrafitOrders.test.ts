import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUltrafitOrders } from './useUltrafitOrders';

const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

const mockOrdersResponse = {
  orders: [
    {
      id: 'order-1',
      orderNumber: 'UF-001',
      createdAt: '2026-04-01T10:00:00Z',
      shippedAt: null,
      status: 'new',
      totalNet: 1500,
      currency: 'PLN',
      trackingNumber: null,
      trackingUrl: null,
      deliveryType: null,
      items: [],
    },
  ],
  totalCount: 1,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useUltrafitOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.functions.invoke with correct params', async () => {
    mockInvoke.mockResolvedValue({ data: mockOrdersResponse, error: null });

    const { result } = renderHook(
      () => useUltrafitOrders({ page: 1, pageSize: 25, search: 'test' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke).toHaveBeenCalledWith('ultrafit-orders', {
      body: { page: 1, pageSize: 25, search: 'test' },
    });
  });

  it('does not send a request when enabled is false', () => {
    const { result } = renderHook(
      () => useUltrafitOrders({ page: 1, pageSize: 25, search: '', enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('returns data on successful response', async () => {
    mockInvoke.mockResolvedValue({ data: mockOrdersResponse, error: null });

    const { result } = renderHook(
      () => useUltrafitOrders({ page: 1, pageSize: 25, search: '' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.orders).toHaveLength(1);
    expect(result.current.data?.totalCount).toBe(1);
    expect(result.current.data?.orders[0].orderNumber).toBe('UF-001');
  });

  it('throws an error when invoke returns error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Forbidden') });

    const { result } = renderHook(
      () => useUltrafitOrders({ page: 1, pageSize: 25, search: '' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
