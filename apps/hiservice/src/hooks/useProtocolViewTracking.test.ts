import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProtocolViewTracking } from './useProtocolViewTracking';
import { mockSupabase, mockSupabaseQuery, mockSupabaseRpc, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

describe('useProtocolViewTracking', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();

    // Default successful mocks
    mockSupabaseQuery('protocol_views', { data: null, error: null }, 'insert');
    mockSupabaseRpc('mark_protocol_viewed', { data: null, error: null });
    mockSupabaseRpc('update_protocol_view_duration', { data: null, error: null });
  });

  it('inserts a protocol_views record on mount when all params are provided', async () => {
    renderHook(() =>
      useProtocolViewTracking('proto-1', 'inst-1', 'tok-abc')
    );

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('protocol_views');
    });

    // The insert method should have been called on the builder returned by from('protocol_views')
    const protocolViewsBuilderCalls = mockSupabase.from.mock.calls.filter(
      ([table]: [string]) => table === 'protocol_views'
    );
    expect(protocolViewsBuilderCalls.length).toBeGreaterThan(0);
  });

  it('calls mark_protocol_viewed RPC with the provided token', async () => {
    renderHook(() =>
      useProtocolViewTracking('proto-1', 'inst-1', 'tok-abc')
    );

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'mark_protocol_viewed',
        { p_token: 'tok-abc' }
      );
    });
  });

  it('does nothing when protocolId is undefined', async () => {
    renderHook(() =>
      useProtocolViewTracking(undefined, 'inst-1', 'tok-abc')
    );

    // Wait a tick to allow any async effects to run
    await new Promise((r) => setTimeout(r, 50));

    // Should not call from('protocol_views') when protocolId is missing
    const protocolViewsBuilderCalls = mockSupabase.from.mock.calls.filter(
      ([table]: [string]) => table === 'protocol_views'
    );
    expect(protocolViewsBuilderCalls.length).toBe(0);
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('does nothing when instanceId is undefined', async () => {
    renderHook(() =>
      useProtocolViewTracking('proto-1', undefined, 'tok-abc')
    );

    await new Promise((r) => setTimeout(r, 50));

    const protocolViewsBuilderCalls = mockSupabase.from.mock.calls.filter(
      ([table]: [string]) => table === 'protocol_views'
    );
    expect(protocolViewsBuilderCalls.length).toBe(0);
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('does nothing when token is undefined', async () => {
    renderHook(() =>
      useProtocolViewTracking('proto-1', 'inst-1', undefined)
    );

    await new Promise((r) => setTimeout(r, 50));

    const protocolViewsBuilderCalls = mockSupabase.from.mock.calls.filter(
      ([table]: [string]) => table === 'protocol_views'
    );
    expect(protocolViewsBuilderCalls.length).toBe(0);
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('inserts protocol_views with correct protocol_id and instance_id fields', async () => {
    // Capture what was inserted
    const fromSpy = mockSupabase.from;

    renderHook(() =>
      useProtocolViewTracking('proto-uuid-1', 'instance-uuid-1', 'token-xyz')
    );

    await waitFor(() => {
      expect(fromSpy).toHaveBeenCalledWith('protocol_views');
    });

    // Get the builder that was returned for protocol_views
    const protocolViewsIndex = fromSpy.mock.calls.findIndex(
      ([table]: [string]) => table === 'protocol_views'
    );
    const builder = fromSpy.mock.results[protocolViewsIndex]?.value;
    expect(builder).toBeDefined();
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        protocol_id: 'proto-uuid-1',
        instance_id: 'instance-uuid-1',
      })
    );
  });

  it('does not call mark_protocol_viewed when insert fails', async () => {
    mockSupabaseQuery('protocol_views', {
      data: null,
      error: { message: 'RLS violation' },
    }, 'insert');

    renderHook(() =>
      useProtocolViewTracking('proto-1', 'inst-1', 'tok-abc')
    );

    await new Promise((r) => setTimeout(r, 100));

    // mark_protocol_viewed should NOT be called if insert failed
    expect(mockSupabase.rpc).not.toHaveBeenCalledWith(
      'mark_protocol_viewed',
      expect.anything()
    );
  });
});
