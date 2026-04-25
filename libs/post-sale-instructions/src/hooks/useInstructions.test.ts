import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useInstructions } from './useInstructions';
import { BUILTIN_TEMPLATES } from '../builtinTemplates';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function createMockSupabase(rows: unknown[] = [], error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data: rows, error });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from, _mocks: { select, eq, order } };
}

describe('useInstructions', () => {
  it('returns built-ins followed by DB rows sorted by created_at desc', async () => {
    const dbRow = {
      id: 'row-1',
      instance_id: 'inst-1',
      title: 'Custom instruction',
      content: { type: 'doc', content: [] },
      hardcoded_key: null,
      created_by: null,
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-01T10:00:00Z',
    };

    const supabase = createMockSupabase([dbRow]);
    const { result } = renderHook(
      () => useInstructions('inst-1', supabase as never),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const items = result.current.data ?? [];
    expect(items.length).toBe(BUILTIN_TEMPLATES.length + 1);
    // Built-ins come first
    expect(items[0].kind).toBe('builtin');
    expect(items[1].kind).toBe('builtin');
    // Custom row comes after
    const customItem = items[items.length - 1];
    expect(customItem.kind).toBe('custom');
    if (customItem.kind === 'custom') {
      expect(customItem.row.id).toBe('row-1');
    }
  });

  it('returns only built-ins when DB is empty', async () => {
    const supabase = createMockSupabase([]);
    const { result } = renderHook(
      () => useInstructions('inst-1', supabase as never),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const items = result.current.data ?? [];
    expect(items.length).toBe(BUILTIN_TEMPLATES.length);
    items.forEach((item) => expect(item.kind).toBe('builtin'));
  });

  it('exposes loading state during fetch', async () => {
    let resolveQuery!: (value: { data: unknown[]; error: null }) => void;
    const pendingPromise = new Promise<{ data: unknown[]; error: null }>((resolve) => {
      resolveQuery = resolve;
    });

    const order = vi.fn().mockReturnValue(pendingPromise);
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as never;

    const { result } = renderHook(
      () => useInstructions('inst-1', supabase),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);

    resolveQuery({ data: [], error: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
