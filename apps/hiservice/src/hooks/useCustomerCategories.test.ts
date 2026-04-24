import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCustomerCategories } from './useCustomerCategories';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

describe('useCustomerCategories', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockSupabaseQuery('customer_categories', {
      data: [
        { id: 'cat-1', name: 'VIP', sort_order: 0 },
        { id: 'cat-2', name: 'Regular', sort_order: 1 },
      ],
      error: null,
    });
    mockSupabaseQuery('customer_category_assignments', {
      data: [
        { customer_id: 'cust-1', category_id: 'cat-1' },
        { customer_id: 'cust-1', category_id: 'cat-2' },
        { customer_id: 'cust-2', category_id: 'cat-1' },
      ],
      error: null,
    });
  });

  // Regression test for the "Maximum update depth exceeded" infinite loop.
  // Before the useMemo fix, customerCategoryMap and customerCounts were rebuilt
  // on every render, breaking referential equality and causing consumers' useEffect
  // hooks (with these values in deps) to fire every render → setState → re-render
  // → loop. This test pins the stability contract.
  it('returns referentially stable customerCategoryMap across renders', async () => {
    const { result, rerender } = renderHook(() => useCustomerCategories('instance-1'));

    await waitFor(() => {
      expect(result.current.customerCategoryMap.size).toBeGreaterThan(0);
    });

    const firstMap = result.current.customerCategoryMap;
    const firstCounts = result.current.customerCounts;

    rerender();
    rerender();
    rerender();

    expect(result.current.customerCategoryMap).toBe(firstMap);
    expect(result.current.customerCounts).toBe(firstCounts);
  });

  it('builds customerCategoryMap from assignments', async () => {
    const { result } = renderHook(() => useCustomerCategories('instance-1'));

    await waitFor(() => {
      expect(result.current.customerCategoryMap.size).toBe(2);
    });

    expect(result.current.customerCategoryMap.get('cust-1')).toEqual(['cat-1', 'cat-2']);
    expect(result.current.customerCategoryMap.get('cust-2')).toEqual(['cat-1']);
  });

  it('builds customerCounts from assignments', async () => {
    const { result } = renderHook(() => useCustomerCategories('instance-1'));

    await waitFor(() => {
      expect(Object.keys(result.current.customerCounts).length).toBe(2);
    });

    expect(result.current.customerCounts['cat-1']).toBe(2);
    expect(result.current.customerCounts['cat-2']).toBe(1);
  });

  it('returns empty maps when instanceId is null', () => {
    const { result } = renderHook(() => useCustomerCategories(null));
    expect(result.current.customerCategoryMap.size).toBe(0);
    expect(result.current.customerCounts).toEqual({});
    expect(result.current.categories).toEqual([]);
  });
});
