import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useOfferViewTracking } from './useOfferViewTracking';
import { mockSupabase, mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

// Mock crypto.randomUUID
vi.stubGlobal(
  'crypto',
  Object.assign({}, globalThis.crypto, {
    randomUUID: () => 'view-uuid-1',
  }),
);

const OFFER_ID = 'offer-123';
const INSTANCE_ID = 'test-instance-id';

// Helper to create a fresh chainable query builder for offer_views
function createOfferViewsBuilder() {
  let currentMethod = 'select';
  const builder: Record<string, any> = {};
  ['select', 'insert', 'update', 'delete', 'upsert'].forEach((method) => {
    builder[method] = vi.fn().mockImplementation(() => {
      currentMethod = method === 'upsert' ? 'insert' : method;
      return builder;
    });
  });
  ['eq', 'neq', 'order', 'limit', 'is', 'in', 'or', 'not'].forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });
  builder.single = vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null }));
  builder.then = (resolve: (v: any) => void) => {
    resolve({ data: null, error: null });
  };
  return builder;
}

describe('useOfferViewTracking', () => {
  let offerViewsBuilder: ReturnType<typeof createOfferViewsBuilder>;

  beforeEach(() => {
    resetSupabaseMocks();
    offerViewsBuilder = createOfferViewsBuilder();

    // Override from() to return our controlled builder for offer_views
    const originalFrom = mockSupabase.from.getMockImplementation?.();
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'offer_views') return offerViewsBuilder;
      // Fallback for other tables — return a generic builder
      return originalFrom?.(table) ?? offerViewsBuilder;
    });
  });

  // NOTE: don't use vi.restoreAllMocks() — it breaks mocks before React cleanup finishes

  it('inserts a view record on mount', async () => {
    const { unmount } = renderHook(() => useOfferViewTracking(OFFER_ID, INSTANCE_ID, false));

    await act(async () => {
      await vi.waitFor(() => {
        expect(offerViewsBuilder.insert).toHaveBeenCalled();
      });
    });

    const insertArg = offerViewsBuilder.insert.mock.calls[0][0];
    expect(insertArg).toEqual({
      id: 'view-uuid-1',
      offer_id: OFFER_ID,
      instance_id: INSTANCE_ID,
      is_admin_preview: false,
    });

    act(() => {
      unmount();
    });
  });

  it('does not insert when offerId is undefined', () => {
    const { unmount } = renderHook(() => useOfferViewTracking(undefined, INSTANCE_ID, false));
    expect(offerViewsBuilder.insert).not.toHaveBeenCalled();
    act(() => {
      unmount();
    });
  });

  it('does not insert when instanceId is undefined', () => {
    const { unmount } = renderHook(() => useOfferViewTracking(OFFER_ID, undefined, false));
    expect(offerViewsBuilder.insert).not.toHaveBeenCalled();
    act(() => {
      unmount();
    });
  });

  it('passes isAdminPreview=true flag', async () => {
    const { unmount } = renderHook(() => useOfferViewTracking(OFFER_ID, INSTANCE_ID, true));

    await act(async () => {
      await vi.waitFor(() => {
        expect(offerViewsBuilder.insert).toHaveBeenCalled();
      });
    });

    const insertArg = offerViewsBuilder.insert.mock.calls[0][0];
    expect(insertArg.is_admin_preview).toBe(true);

    act(() => {
      unmount();
    });
  });

  it('updates duration on unmount', async () => {
    const { unmount } = renderHook(() => useOfferViewTracking(OFFER_ID, INSTANCE_ID, false));

    // Wait for insert to be called, then flush microtasks so viewIdRef is set
    await act(async () => {
      await vi.waitFor(() => {
        expect(offerViewsBuilder.insert).toHaveBeenCalled();
      });
      // Extra flush: the hook's `await insert()` resolves on a microtask,
      // then sets viewIdRef.current on the NEXT tick.
      await new Promise((r) => setTimeout(r, 0));
    });

    // Unmount triggers cleanup → updateDuration
    act(() => {
      unmount();
    });

    // Cleanup should call update with duration_seconds
    expect(offerViewsBuilder.update).toHaveBeenCalled();
    const updateArg = offerViewsBuilder.update.mock.calls[0][0];
    expect(updateArg).toHaveProperty('duration_seconds');
    expect(typeof updateArg.duration_seconds).toBe('number');
  });

  it('updates duration on visibilitychange to hidden', async () => {
    renderHook(() => useOfferViewTracking(OFFER_ID, INSTANCE_ID, false));

    // Wait for insert + flush microtasks so viewIdRef is set
    await act(async () => {
      await vi.waitFor(() => {
        expect(offerViewsBuilder.insert).toHaveBeenCalled();
      });
      await new Promise((r) => setTimeout(r, 0));
    });

    // Simulate page going hidden
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(offerViewsBuilder.update).toHaveBeenCalled();

    // Reset
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  it('handles insert error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Make insert resolve with error
    offerViewsBuilder.then = (resolve: (v: any) => void) => {
      resolve({ data: null, error: { message: 'RLS policy violation' } });
    };

    const { unmount } = renderHook(() => useOfferViewTracking(OFFER_ID, INSTANCE_ID, false));

    await act(async () => {
      await vi.waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'offer_views insert failed:',
          'RLS policy violation',
        );
      });
    });

    act(() => {
      unmount();
    });
    consoleError.mockRestore();
  });

  it('cleans up event listeners on unmount', async () => {
    const removeDocSpy = vi.spyOn(document, 'removeEventListener');
    const removeWinSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOfferViewTracking(OFFER_ID, INSTANCE_ID, false));

    await act(async () => {
      await vi.waitFor(() => {
        expect(offerViewsBuilder.insert).toHaveBeenCalled();
      });
    });

    act(() => {
      unmount();
    });

    expect(removeDocSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeWinSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    removeDocSpy.mockRestore();
    removeWinSpy.mockRestore();
  });

  it('does not update duration if insert failed (viewId is null)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Insert error — viewIdRef stays null
    offerViewsBuilder.then = (resolve: (v: any) => void) => {
      resolve({ data: null, error: { message: 'Insert failed' } });
    };

    const { unmount } = renderHook(() => useOfferViewTracking(OFFER_ID, INSTANCE_ID, false));

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    unmount();

    // update should NOT be called because viewIdRef is null
    expect(offerViewsBuilder.update).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
