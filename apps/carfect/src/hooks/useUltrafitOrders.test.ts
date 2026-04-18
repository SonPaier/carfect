import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUltrafitOrders } from './useUltrafitOrders';

// Mock supabase auth
const mockGetSession = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock import.meta.env
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-anon-key');

const ACCESS_TOKEN = 'test-access-token';

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
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN } },
    });
  });

  it('calls fetch with correct URL and JWT', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrdersResponse),
    });

    const { result } = renderHook(
      () => useUltrafitOrders({ page: 1, pageSize: 25, search: '' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://test.supabase.co/functions/v1/ultrafit-orders');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(options.headers['apikey']).toBe('test-anon-key');
    expect(JSON.parse(options.body)).toEqual({ page: 1, pageSize: 25, search: '' });
  });

  it('does not send a request when enabled is false', () => {
    const { result } = renderHook(
      () => useUltrafitOrders({ page: 1, pageSize: 25, search: '', enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns data on successful response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrdersResponse),
    });

    const { result } = renderHook(
      () => useUltrafitOrders({ page: 1, pageSize: 25, search: '' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.orders).toHaveLength(1);
    expect(result.current.data?.totalCount).toBe(1);
    expect(result.current.data?.orders[0].orderNumber).toBe('UF-001');
  });

  it('throws an error when response status is 403', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
    });

    const { result } = renderHook(
      () => useUltrafitOrders({ page: 1, pageSize: 25, search: '' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('ultrafit-orders error 403');
  });
});
