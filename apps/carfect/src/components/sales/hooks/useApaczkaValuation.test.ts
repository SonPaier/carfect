import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    mockInvoke.mockReset();
  });

  it('returns null when no instanceId provided', async () => {
    const { result } = renderHook(() =>
      useApaczkaValuation(null, kartonPkg()),
    );

    let price: number | null = null;
    await act(async () => {
      price = await result.current.fetchValuation();
    });

    expect(price).toBeNull();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('returns null when package is not shipping method', async () => {
    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', kartonPkg({ shippingMethod: 'pickup' })),
    );

    let price: number | null = null;
    await act(async () => {
      price = await result.current.fetchValuation();
    });

    expect(price).toBeNull();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('calls edge function and returns gross price', async () => {
    mockInvoke.mockResolvedValue({
      data: { valuation: { price: { gross: { amount: '49.99' }, net: { amount: '40.00' } } } },
      error: null,
    });

    const pkg = kartonPkg();
    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', pkg, '00-001', 'Warszawa'),
    );

    let price: number | null = null;
    await act(async () => {
      price = await result.current.fetchValuation();
    });

    expect(price).toBe(49.99);
    expect(result.current.loading).toBe(false);
    expect(mockInvoke).toHaveBeenCalledWith('apaczka-valuation', {
      body: {
        instanceId: 'instance-1',
        packages: [pkg],
        customerAddress: { postal_code: '00-001', city: 'Warszawa' },
        paymentMethod: 'transfer',
        totalGross: 0,
        bankAccountNumber: '',
      },
    });
  });

  it('falls back to net price when gross is not available', async () => {
    mockInvoke.mockResolvedValue({
      data: { valuation: { price: { net: { amount: '40.00' } } } },
      error: null,
    });

    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', kartonPkg()),
    );

    let price: number | null = null;
    await act(async () => {
      price = await result.current.fetchValuation();
    });

    expect(price).toBe(40);
  });

  it('handles edge function error gracefully — returns null', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', kartonPkg()),
    );

    let price: number | null = null;
    await act(async () => {
      price = await result.current.fetchValuation();
    });

    expect(price).toBeNull();
    expect(result.current.error).toBe('Nie udało się pobrać wyceny');
    expect(result.current.loading).toBe(false);
  });

  it('handles data.error in response', async () => {
    mockInvoke.mockResolvedValue({
      data: { error: 'Service unavailable' },
      error: null,
    });

    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', kartonPkg()),
    );

    let price: number | null = null;
    await act(async () => {
      price = await result.current.fetchValuation();
    });

    expect(price).toBeNull();
    expect(result.current.error).toBe('Service unavailable');
  });

  it('sets loading state during fetch', async () => {
    let resolvePromise: (v: any) => void;
    mockInvoke.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

    const { result } = renderHook(() =>
      useApaczkaValuation('instance-1', kartonPkg()),
    );

    expect(result.current.loading).toBe(false);

    let fetchPromise: Promise<number | null>;
    act(() => {
      fetchPromise = result.current.fetchValuation();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({
        data: { valuation: { price: { gross: { amount: '25.00' } } } },
        error: null,
      });
      await fetchPromise!;
    });

    expect(result.current.loading).toBe(false);
  });
});
