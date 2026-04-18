import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUltrafitLink } from './useUltrafitLink';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

const INSTANCE_ID = 'inst-1';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useUltrafitLink', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('returns isLinked: false when no integration_links record exists', async () => {
    mockSupabaseQuery('integration_links', { data: null, error: null });

    const { result } = renderHook(() => useUltrafitLink(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isLinked).toBe(false);
    expect(result.current.externalCustomerId).toBeNull();
  });

  it('returns isLinked: true when integration_links record exists', async () => {
    const linkRecord = { id: 'link-1', external_customer_id: 'ext-cust-uuid' };
    mockSupabaseQuery('integration_links', { data: linkRecord, error: null });

    const { result } = renderHook(() => useUltrafitLink(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isLinked).toBe(true);
    expect(result.current.externalCustomerId).toBe('ext-cust-uuid');
  });

  it('is in loading state before query resolves', () => {
    mockSupabaseQuery('integration_links', { data: null, error: null });

    const { result } = renderHook(() => useUltrafitLink(INSTANCE_ID), {
      wrapper: createWrapper(),
    });

    // Before waitFor: query is still pending
    expect(result.current.isLoading).toBe(true);
  });

  it('does not send a query when instanceId is null', () => {
    const { result } = renderHook(() => useUltrafitLink(null), {
      wrapper: createWrapper(),
    });

    // Query is disabled, so isFetching is false and isLoading is false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLinked).toBe(false);
    expect(result.current.externalCustomerId).toBeNull();
  });
});
