import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProtocolConfig } from './useProtocolConfig';
import { DEFAULT_PROTOCOL_CONFIG } from './defaults';

function createMockSupabase(data: unknown = null, error: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const eq2 = vi.fn().mockReturnValue({ maybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({ select, upsert });
  return { from, _mocks: { select, eq1, eq2, maybeSingle, upsert } };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useProtocolConfig', () => {
  it('returns DEFAULT_PROTOCOL_CONFIG when no row exists', async () => {
    const supabase = createMockSupabase(null);
    const { result } = renderHook(
      () => useProtocolConfig('inst-1', 'reception', supabase as never),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.config).toEqual(DEFAULT_PROTOCOL_CONFIG);
  });

  it('merges fetched config with defaults', async () => {
    const partialConfig = {
      builtInFields: { nip: { enabled: true, visibleToCustomer: false } },
    };
    const supabase = createMockSupabase({ config: partialConfig });
    const { result } = renderHook(
      () => useProtocolConfig('inst-1', 'reception', supabase as never),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.config.builtInFields.nip.enabled).toBe(true);
    expect(result.current.config.builtInFields.nip.visibleToCustomer).toBe(false);
    expect(result.current.config.builtInFields.vin.enabled).toBe(false);
    expect(result.current.config.sectionOrder.length).toBeGreaterThan(0);
  });

  it('saveConfig calls upsert with correct payload', async () => {
    const supabase = createMockSupabase(null);
    const { result } = renderHook(
      () => useProtocolConfig('inst-1', 'reception', supabase as never),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    result.current.saveConfig(DEFAULT_PROTOCOL_CONFIG);
    await waitFor(() => {
      expect(supabase._mocks.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          instance_id: 'inst-1',
          protocol_type: 'reception',
          config: DEFAULT_PROTOCOL_CONFIG,
        }),
        expect.any(Object)
      );
    });
  });
});
