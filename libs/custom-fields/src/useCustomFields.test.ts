import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCustomFields } from './useCustomFields';
import type { CustomFieldDefinition } from './types';

const makeDefinition = (overrides: Partial<CustomFieldDefinition> = {}): CustomFieldDefinition => ({
  id: 'def-1',
  instance_id: 'inst-1',
  context: 'protocol',
  field_type: 'text',
  label: 'My Field',
  required: false,
  sort_order: 0,
  config: {},
  ...overrides,
});

// Builds a chainable Supabase query mock that resolves with the given data.
const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  ['select', 'eq', 'order', 'insert', 'update', 'delete', 'upsert', 'limit', 'single'].forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  // TanStack Query awaits the promise returned by the queryFn — Supabase client
  // objects are thenable, so we simulate that here.
  chain.then = vi.fn((resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

const mockFrom = vi.fn();
const mockSupabase = {
  from: (...args: unknown[]) => mockFrom(...args),
} as unknown as import('@supabase/supabase-js').SupabaseClient;

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(createChainMock([]));
});

describe('useCustomFields', () => {
  describe('fetches definitions on mount', () => {
    it('returns definitions from the database', async () => {
      const definitions = [
        makeDefinition({ id: 'def-1', label: 'Field One', sort_order: 0 }),
        makeDefinition({ id: 'def-2', label: 'Field Two', sort_order: 1 }),
      ];
      mockFrom.mockReturnValue(createChainMock(definitions));

      const { result } = renderHook(
        () => useCustomFields('inst-1', 'protocol', mockSupabase),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.definitions).toHaveLength(2);
        expect(result.current.definitions[0].label).toBe('Field One');
        expect(result.current.definitions[1].label).toBe('Field Two');
      });

      expect(mockFrom).toHaveBeenCalledWith('custom_field_definitions');
    });

    it('queries with correct instance_id and context filters', async () => {
      const chain = createChainMock([]);
      mockFrom.mockReturnValue(chain);

      renderHook(
        () => useCustomFields('inst-42', 'invoice', mockSupabase),
        { wrapper },
      );

      await waitFor(() => {
        expect(chain.eq).toHaveBeenCalledWith('instance_id', 'inst-42');
        expect(chain.eq).toHaveBeenCalledWith('context', 'invoice');
        expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });
      });
    });

    it('returns empty array when no definitions exist', async () => {
      mockFrom.mockReturnValue(createChainMock([]));

      const { result } = renderHook(
        () => useCustomFields('inst-1', 'protocol', mockSupabase),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.definitions).toEqual([]);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('addField calls insert and invalidates cache', () => {
    it('calls insert on custom_field_definitions with merged instance_id and context', async () => {
      const selectChain = createChainMock([]);
      const insertChain = createChainMock(null);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'custom_field_definitions') return selectChain;
        return createChainMock(null);
      });

      const { result } = renderHook(
        () => useCustomFields('inst-1', 'protocol', mockSupabase),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // After initial fetch, wire insert chain for the mutation call
      mockFrom.mockReturnValue(insertChain);

      await act(async () => {
        result.current.addField({
          field_type: 'text',
          label: 'New Field',
          required: false,
          sort_order: 0,
          config: {},
        });
      });

      await waitFor(() => {
        expect(insertChain.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            field_type: 'text',
            label: 'New Field',
            required: false,
            sort_order: 0,
            config: {},
            instance_id: 'inst-1',
            context: 'protocol',
          }),
        );
      });
    });

    it('invalidates the query cache after successful insert', async () => {
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        return createChainMock([]);
      });

      const { result } = renderHook(
        () => useCustomFields('inst-1', 'protocol', mockSupabase),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const countAfterMount = callCount;

      await act(async () => {
        result.current.addField({
          field_type: 'checkbox',
          label: 'Check Me',
          required: true,
          sort_order: 1,
          config: {},
        });
      });

      // Cache invalidation triggers a refetch, so mockFrom is called again
      await waitFor(() => {
        expect(callCount).toBeGreaterThan(countAfterMount);
      });
    });
  });

  describe('removeField calls delete and invalidates cache', () => {
    it('calls delete with the correct id', async () => {
      const deleteChain = createChainMock(null);
      mockFrom.mockImplementation(() => createChainMock([]));

      const { result } = renderHook(
        () => useCustomFields('inst-1', 'protocol', mockSupabase),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      mockFrom.mockReturnValue(deleteChain);

      await act(async () => {
        result.current.removeField('def-abc');
      });

      await waitFor(() => {
        expect(deleteChain.delete).toHaveBeenCalled();
        expect(deleteChain.eq).toHaveBeenCalledWith('id', 'def-abc');
      });
    });

    it('invalidates the query cache after successful delete', async () => {
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        return createChainMock([]);
      });

      const { result } = renderHook(
        () => useCustomFields('inst-1', 'protocol', mockSupabase),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const countAfterMount = callCount;

      await act(async () => {
        result.current.removeField('def-xyz');
      });

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(countAfterMount);
      });
    });
  });

  describe('reorderFields sends sequential sort_order updates', () => {
    it('calls from(custom_field_definitions) once per id during reorder', async () => {
      mockFrom.mockImplementation(() => createChainMock([]));

      const { result } = renderHook(
        () => useCustomFields('inst-1', 'protocol', mockSupabase),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const callsBefore = mockFrom.mock.calls.length;

      await act(async () => {
        result.current.reorderFields(['id-a', 'id-b', 'id-c']);
      });

      // Wait for mutation + cache invalidation refetch
      await waitFor(() => {
        const newCalls = mockFrom.mock.calls.slice(callsBefore);
        // At least 3 calls for the 3 updates (may have extra for refetch)
        expect(newCalls.length).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
