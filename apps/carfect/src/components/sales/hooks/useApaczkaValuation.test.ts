import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useApaczkaValuation } from './useApaczkaValuation';
import type { OrderPackage } from './useOrderPackages';

const { mockInvoke } = vi.hoisted(() => ({ mockInvoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: mockInvoke } },
}));

const kartonPkg = (overrides: Partial<OrderPackage> = {}): OrderPackage => ({
  id: 'pkg-1',
  shippingMethod: 'shipping',
  packagingType: 'karton',
  dimensions: { length: 30, width: 20, height: 10 },
  productKeys: [],
  ...overrides,
});

describe('useApaczkaValuation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockInvoke.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null price initially when no instanceId provided', () => {
    const { result } = renderHook(() =>
      useApaczkaValuation(null, kartonPkg()),
    );

    expect(result.current.price).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns null price initially when package is not shipping method', () => {
    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', kartonPkg({ shippingMethod: 'pickup' })),
    );

    expect(result.current.price).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('calls edge function after 800ms debounce with complete karton dimensions', async () => {
    mockInvoke.mockResolvedValue({
      data: { valuation: { price: { gross: { amount: '49.99' } } } },
      error: null,
    });

    const pkg = kartonPkg();
    renderHook(() =>
      useApaczkaValuation('instance-1', pkg, '00-001', 'Warszawa'),
    );

    expect(mockInvoke).not.toHaveBeenCalled();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockInvoke).toHaveBeenCalledWith('apaczka-valuation', {
      body: {
        instanceId: 'instance-1',
        packages: [pkg],
        customerAddress: { postal_code: '00-001', city: 'Warszawa' },
      },
    });
  });

  it('returns gross price from valuation response', async () => {
    mockInvoke.mockResolvedValue({
      data: { valuation: { price: { gross: { amount: '49.99' }, net: { amount: '40.00' } } } },
      error: null,
    });

    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', kartonPkg()),
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.price).toBe(49.99);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('falls back to net price when gross is not available', async () => {
    mockInvoke.mockResolvedValue({
      data: { valuation: { price: { net: { amount: '40.00' } } } },
      error: null,
    });

    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', kartonPkg()),
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.price).toBe(40);
  });

  it('does not call edge function when karton dimensions are incomplete', async () => {
    const pkg = kartonPkg({
      dimensions: { length: 0, width: 20, height: 10 },
    });

    renderHook(() => useApaczkaValuation('instance-1', pkg));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('does not call edge function when tuba dimensions are incomplete', async () => {
    const pkg = kartonPkg({
      packagingType: 'tuba',
      dimensions: { length: 50, diameter: 0 } as any,
    });

    renderHook(() => useApaczkaValuation('instance-1', pkg));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('calls edge function for koperta — any truthy dimensions value passes', async () => {
    mockInvoke.mockResolvedValue({
      data: { valuation: { price: { gross: { amount: '12.00' } } } },
      error: null,
    });

    // koperta with a truthy (but empty) dimensions object — hook skips dimension check for koperta
    const pkg = kartonPkg({
      packagingType: 'koperta',
      dimensions: {} as any,
    });

    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', pkg),
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockInvoke).toHaveBeenCalled();
    expect(result.current.price).toBe(12);
  });

  it('handles edge function error gracefully — returns null, no crash', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', kartonPkg()),
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.price).toBeNull();
    expect(result.current.error).toBeNull(); // errors are silently swallowed
    expect(result.current.loading).toBe(false);
  });

  it('handles data.error in response gracefully', async () => {
    mockInvoke.mockResolvedValue({
      data: { error: 'Service unavailable' },
      error: null,
    });

    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', kartonPkg()),
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.price).toBeNull();
    expect(result.current.error).toBe('Service unavailable');
  });

  it('debounces rapid changes — calls edge function only once', async () => {
    mockInvoke.mockResolvedValue({
      data: { valuation: { price: { gross: { amount: '25.00' } } } },
      error: null,
    });

    const { rerender } = renderHook(
      ({ dims }) =>
        useApaczkaValuation(
          'instance-1',
          kartonPkg({ dimensions: dims }),
        ),
      { initialProps: { dims: { length: 30, width: 20, height: 10 } } },
    );

    // Advance partially through debounce window and rerender to reset timer
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    rerender({ dims: { length: 31, width: 20, height: 10 } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    rerender({ dims: { length: 32, width: 20, height: 10 } });

    // Still before debounce completes — no call yet
    expect(mockInvoke).not.toHaveBeenCalled();

    // Complete debounce and flush promises
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });
});
