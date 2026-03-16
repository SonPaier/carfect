import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAppUpdate } from './useAppUpdate';

describe('useAppUpdate', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('returns null initially', () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ version: 'abc1234-2026-03-15' }),
    });

    const { result } = renderHook(() => useAppUpdate());
    expect(result.current.currentVersion).toBeNull();
  });

  it('fetches version from /version.json and sets currentVersion', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ version: 'abc1234-2026-03-15' }),
    });

    const { result } = renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(result.current.currentVersion).toBe('abc1234-2026-03-15');
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toMatch(/^\/version\.json\?t=\d+$/);
  });

  it('trims whitespace from version string', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ version: '  abc1234-2026-03-15  \n' }),
    });

    const { result } = renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(result.current.currentVersion).toBe('abc1234-2026-03-15');
    });
  });

  it('sets null when version field is missing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useAppUpdate());

    // Wait for fetch to complete, then verify still null
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
    expect(result.current.currentVersion).toBeNull();
  });

  it('sets null on fetch error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
    expect(result.current.currentVersion).toBeNull();
  });

  it('sets null on JSON parse error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    const { result } = renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
    expect(result.current.currentVersion).toBeNull();
  });

  it('uses cache-busting timestamp parameter', async () => {
    const now = Date.now();
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ version: 'v1' }),
    });

    renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const timestamp = Number(url.split('?t=')[1]);
    expect(timestamp).toBeGreaterThanOrEqual(now);
  });
});
