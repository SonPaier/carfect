import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePortfolioPhotos } from './usePortfolioPhotos';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@shared/utils', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    compressImage: vi.fn(async (file: File) => file),
    shouldSkipCompression: vi.fn(() => true),
    getFileExtension: vi.fn(() => '.jpg'),
    getContentType: vi.fn(() => 'image/jpeg'),
  };
});

import { toast } from 'sonner';

let uuidCounter = 0;
vi.stubGlobal(
  'crypto',
  Object.assign({}, globalThis.crypto, {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  }),
);

const INSTANCE_ID = 'test-instance-id';

const makeFile = (name: string, sizeBytes: number, type = 'image/jpeg') => {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], name, { type });
};

describe('usePortfolioPhotos', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    uuidCounter = 0;
    vi.clearAllMocks();
  });

  describe('initial load', () => {
    it('loads existing portfolio photos when enabled', async () => {
      mockSupabaseQuery('instance_portfolio_photos', {
        data: [
          { id: 'p1', url: 'https://cdn/p1.jpg', sort_order: 0, created_at: '2026-04-29' },
          { id: 'p2', url: 'https://cdn/p2.jpg', sort_order: 1, created_at: '2026-04-29' },
        ],
        error: null,
      });

      const { result } = renderHook(() => usePortfolioPhotos(INSTANCE_ID, true));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.photos).toHaveLength(2);
      expect(result.current.photos[0].id).toBe('p1');
    });

    it('skips fetching when enabled is false', async () => {
      const { result } = renderHook(() => usePortfolioPhotos(INSTANCE_ID, false));
      // loading should never be true with enabled=false; otherwise we'd
      // render a forever-spinner in closed-drawer consumers.
      expect(result.current.loading).toBe(false);
      expect(result.current.photos).toEqual([]);
    });

    it('shows loadError toast when query fails', async () => {
      mockSupabaseQuery('instance_portfolio_photos', {
        data: null,
        error: { message: 'boom' },
      });

      renderHook(() => usePortfolioPhotos(INSTANCE_ID, true));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('uploadFiles', () => {
    it('skips files larger than 25MB and uploads the rest', async () => {
      mockSupabaseQuery('instance_portfolio_photos', { data: [], error: null });
      mockSupabaseQuery(
        'instance_portfolio_photos',
        {
          data: { id: 'new-1', url: 'https://cdn/new.jpg', sort_order: 0, created_at: 'x' },
          error: null,
        },
        'insert',
      );

      const { result } = renderHook(() => usePortfolioPhotos(INSTANCE_ID, true));
      await waitFor(() => expect(result.current.loading).toBe(false));

      const big = makeFile('huge.jpg', 26 * 1024 * 1024);
      const small = makeFile('small.jpg', 100 * 1024);

      await act(async () => {
        await result.current.uploadFiles([big, small]);
      });

      // Info-toast for the skipped one, success for the uploaded one
      expect(toast.info).toHaveBeenCalledWith(expect.stringContaining('1'));
      expect(toast.success).toHaveBeenCalled();
    });

    it('returns empty array when all files are oversized (no upload)', async () => {
      mockSupabaseQuery('instance_portfolio_photos', { data: [], error: null });

      const { result } = renderHook(() => usePortfolioPhotos(INSTANCE_ID, true));
      await waitFor(() => expect(result.current.loading).toBe(false));

      const big = makeFile('huge.jpg', 30 * 1024 * 1024);

      let returned: unknown = 'sentinel';
      await act(async () => {
        returned = await result.current.uploadFiles([big]);
      });

      expect(returned).toEqual([]);
      expect(toast.info).toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('returns empty array when no files passed', async () => {
      const { result } = renderHook(() => usePortfolioPhotos(INSTANCE_ID, true));
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned: unknown;
      await act(async () => {
        returned = await result.current.uploadFiles([]);
      });
      expect(returned).toEqual([]);
    });
  });

  describe('removePhoto', () => {
    it('removes the photo from local state and shows success toast', async () => {
      mockSupabaseQuery('instance_portfolio_photos', {
        data: [
          { id: 'p1', url: 'https://cdn/p1.jpg', sort_order: 0, created_at: 'x' },
          { id: 'p2', url: 'https://cdn/p2.jpg', sort_order: 1, created_at: 'x' },
        ],
        error: null,
      });
      mockSupabaseQuery('instance_portfolio_photos', { data: null, error: null }, 'delete');

      const { result } = renderHook(() => usePortfolioPhotos(INSTANCE_ID, true));
      await waitFor(() => expect(result.current.photos).toHaveLength(2));

      await act(async () => {
        await result.current.removePhoto('p1');
      });

      expect(result.current.photos).toHaveLength(1);
      expect(result.current.photos[0].id).toBe('p2');
      expect(toast.success).toHaveBeenCalled();
    });

    it('keeps state unchanged and shows error toast when delete fails', async () => {
      mockSupabaseQuery('instance_portfolio_photos', {
        data: [{ id: 'p1', url: 'https://cdn/p1.jpg', sort_order: 0, created_at: 'x' }],
        error: null,
      });
      mockSupabaseQuery(
        'instance_portfolio_photos',
        { data: null, error: { message: 'rls' } },
        'delete',
      );

      const { result } = renderHook(() => usePortfolioPhotos(INSTANCE_ID, true));
      await waitFor(() => expect(result.current.photos).toHaveLength(1));

      await act(async () => {
        await result.current.removePhoto('p1');
      });

      expect(result.current.photos).toHaveLength(1);
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
