import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useCustomerSearch } from './useCustomerSearch';

const INSTANCE_ID = 'instance-123';

function makeQueryBuilder(data: unknown[] = []) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Trigger debounced search: advance timer, then flush all async microtasks
async function triggerSearch(result: { current: ReturnType<typeof useCustomerSearch> }, query: string) {
  act(() => {
    result.current.setCustomerSearch(query);
  });
  // Advance debounce timer and allow all promises to settle
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

describe('useCustomerSearch', () => {
  it('returns empty results initially', () => {
    mockFrom.mockReturnValue(makeQueryBuilder());
    const { result } = renderHook(() => useCustomerSearch(INSTANCE_ID));

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.dropdownOpen).toBe(false);
    expect(result.current.searching).toBe(false);
    expect(result.current.customerSearch).toBe('');
    expect(result.current.selectedCustomer).toBeNull();
    expect(result.current.activeIndex).toBe(-1);
  });

  it('searches after debounce delay when query >= min length', async () => {
    mockFrom.mockReturnValue(makeQueryBuilder([{ id: '1', name: 'Acme', discount_percent: null }]));

    const { result } = renderHook(() => useCustomerSearch(INSTANCE_ID));

    act(() => {
      result.current.setCustomerSearch('ac');
    });

    // Before debounce fires — no search yet
    expect(mockFrom).not.toHaveBeenCalled();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockFrom).toHaveBeenCalledWith('sales_customers');
  });

  it('does not search when query is too short', async () => {
    mockFrom.mockReturnValue(makeQueryBuilder());

    const { result } = renderHook(() => useCustomerSearch(INSTANCE_ID));

    act(() => {
      result.current.setCustomerSearch('a');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.dropdownOpen).toBe(false);
  });

  it('returns matched customers from supabase', async () => {
    const rawCustomers = [
      { id: '1', name: 'Acme Corp', discount_percent: 10 },
      { id: '2', name: 'Acme Ltd', discount_percent: null },
    ];
    mockFrom.mockReturnValue(makeQueryBuilder(rawCustomers));

    const { result } = renderHook(() => useCustomerSearch(INSTANCE_ID));

    await triggerSearch(result, 'ac');

    expect(result.current.searchResults).toEqual([
      { id: '1', name: 'Acme Corp', discountPercent: 10 },
      { id: '2', name: 'Acme Ltd', discountPercent: undefined },
    ]);
    expect(result.current.dropdownOpen).toBe(true);
    expect(result.current.activeIndex).toBe(-1);
    expect(result.current.searching).toBe(false);
  });

  it('ArrowDown increments activeIndex', async () => {
    const rawCustomers = [
      { id: '1', name: 'Alpha', discount_percent: null },
      { id: '2', name: 'Beta', discount_percent: null },
    ];
    mockFrom.mockReturnValue(makeQueryBuilder(rawCustomers));

    const { result } = renderHook(() => useCustomerSearch(INSTANCE_ID));

    await triggerSearch(result, 'al');

    expect(result.current.dropdownOpen).toBe(true);

    act(() => {
      result.current.handleCustomerKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(0);

    act(() => {
      result.current.handleCustomerKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(1);
  });

  it('ArrowUp decrements activeIndex and does not go below 0', async () => {
    const rawCustomers = [
      { id: '1', name: 'Alpha', discount_percent: null },
      { id: '2', name: 'Beta', discount_percent: null },
    ];
    mockFrom.mockReturnValue(makeQueryBuilder(rawCustomers));

    const { result } = renderHook(() => useCustomerSearch(INSTANCE_ID));

    await triggerSearch(result, 'al');

    expect(result.current.dropdownOpen).toBe(true);

    // Move down to index 1
    act(() => {
      result.current.handleCustomerKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() } as unknown as React.KeyboardEvent);
    });
    act(() => {
      result.current.handleCustomerKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(1);

    act(() => {
      result.current.handleCustomerKeyDown({ key: 'ArrowUp', preventDefault: vi.fn() } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(0);

    // Should not go below 0
    act(() => {
      result.current.handleCustomerKeyDown({ key: 'ArrowUp', preventDefault: vi.fn() } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(0);
  });

  it('Enter selects the current item', async () => {
    const rawCustomers = [
      { id: '1', name: 'Alpha', discount_percent: 5 },
      { id: '2', name: 'Beta', discount_percent: null },
    ];
    mockFrom.mockReturnValue(makeQueryBuilder(rawCustomers));

    const { result } = renderHook(() => useCustomerSearch(INSTANCE_ID));

    await triggerSearch(result, 'al');

    expect(result.current.dropdownOpen).toBe(true);

    act(() => {
      result.current.handleCustomerKeyDown({ key: 'ArrowDown', preventDefault: vi.fn() } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(0);

    act(() => {
      result.current.handleCustomerKeyDown({ key: 'Enter', preventDefault: vi.fn() } as unknown as React.KeyboardEvent);
    });

    expect(result.current.selectedCustomer).toEqual({ id: '1', name: 'Alpha', discountPercent: 5 });
    expect(result.current.dropdownOpen).toBe(false);
    expect(result.current.customerSearch).toBe('');
    expect(result.current.searchResults).toEqual([]);
  });

  it('Escape closes the dropdown', async () => {
    const rawCustomers = [{ id: '1', name: 'Alpha', discount_percent: null }];
    mockFrom.mockReturnValue(makeQueryBuilder(rawCustomers));

    const { result } = renderHook(() => useCustomerSearch(INSTANCE_ID));

    await triggerSearch(result, 'al');

    expect(result.current.dropdownOpen).toBe(true);

    act(() => {
      result.current.handleCustomerKeyDown({ key: 'Escape', preventDefault: vi.fn() } as unknown as React.KeyboardEvent);
    });

    expect(result.current.dropdownOpen).toBe(false);
  });
});
