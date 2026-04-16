import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGusLookup } from './useGusLookup';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));

import { toast } from 'sonner';

const VALID_RESPONSE = {
  name: 'ACME Sp. z o.o.',
  street: 'ul. Testowa 12',
  postalCode: '00-001',
  city: 'Warszawa',
  regon: '123456789',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useGusLookup', () => {
  it('returns company data for a valid NIP', async () => {
    mockInvoke.mockResolvedValue({ data: VALID_RESPONSE, error: null });

    const { result } = renderHook(() => useGusLookup());

    let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
    await act(async () => {
      data = await result.current.lookupNip('1234567890');
    });

    expect(data).toEqual({
      name: 'ACME Sp. z o.o.',
      street: 'ul. Testowa 12',
      postalCode: '00-001',
      city: 'Warszawa',
      regon: '123456789',
    });
    expect(toast.success).toHaveBeenCalledWith('Dane pobrane z GUS');
    expect(mockInvoke).toHaveBeenCalledWith('gus-lookup', { body: { nip: '1234567890' } });
  });

  it('shows toast.error when NIP has fewer than 10 digits', async () => {
    const { result } = renderHook(() => useGusLookup());

    let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
    await act(async () => {
      data = await result.current.lookupNip('12345');
    });

    expect(data).toBeNull();
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('NIP musi mieć 10 cyfr');
  });

  it('strips dashes and spaces from NIP before calling', async () => {
    mockInvoke.mockResolvedValue({ data: VALID_RESPONSE, error: null });

    const { result } = renderHook(() => useGusLookup());

    await act(async () => {
      await result.current.lookupNip('123-456-78-90');
    });

    expect(mockInvoke).toHaveBeenCalledWith('gus-lookup', { body: { nip: '1234567890' } });
  });

  it('shows toast.error on invoke error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('fail') });

    const { result } = renderHook(() => useGusLookup());

    let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
    await act(async () => {
      data = await result.current.lookupNip('1234567890');
    });

    expect(data).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Błąd połączenia z GUS');
  });

  it('shows toast.error when GUS returns error in data', async () => {
    mockInvoke.mockResolvedValue({ data: { error: 'Nie znaleziono podmiotu o podanym NIP' }, error: null });

    const { result } = renderHook(() => useGusLookup());

    let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
    await act(async () => {
      data = await result.current.lookupNip('1234567890');
    });

    expect(data).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Nie znaleziono podmiotu o podanym NIP');
  });

  it('loading is true while fetching and false after', async () => {
    let resolveInvoke!: (v: unknown) => void;
    mockInvoke.mockReturnValue(new Promise((res) => { resolveInvoke = res; }));

    const { result } = renderHook(() => useGusLookup());

    act(() => {
      result.current.lookupNip('1234567890');
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveInvoke({ data: VALID_RESPONSE, error: null });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
