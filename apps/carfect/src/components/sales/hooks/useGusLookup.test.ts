import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGusLookup } from './useGusLookup';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { toast } from 'sonner';

function makeResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

const VALID_SUBJECT = {
  name: 'ACME Sp. z o.o.',
  residenceAddress: 'ul. Testowa 12, 00-001 Warszawa',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useGusLookup', () => {
  it('returns company data for a valid NIP', async () => {
    mockFetch.mockReturnValue(
      makeResponse({ result: { subject: VALID_SUBJECT } })
    );

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
    });
    expect(toast.success).toHaveBeenCalledWith('Dane pobrane z GUS');
  });

  it('shows toast.error and does not fetch when NIP has fewer than 10 digits', async () => {
    const { result } = renderHook(() => useGusLookup());

    let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
    await act(async () => {
      data = await result.current.lookupNip('12345');
    });

    expect(data).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('NIP musi mieć 10 cyfr');
  });

  it('strips dashes and spaces from NIP before fetching', async () => {
    mockFetch.mockReturnValue(
      makeResponse({ result: { subject: VALID_SUBJECT } })
    );

    const { result } = renderHook(() => useGusLookup());

    await act(async () => {
      await result.current.lookupNip('123-456-78-90');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/nip/1234567890')
    );
  });

  it('shows toast.error on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useGusLookup());

    let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
    await act(async () => {
      data = await result.current.lookupNip('1234567890');
    });

    expect(data).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Network failure');
  });

  it('shows toast.error when API returns non-ok status', async () => {
    mockFetch.mockReturnValue(makeResponse({}, false, 404));

    const { result } = renderHook(() => useGusLookup());

    let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
    await act(async () => {
      data = await result.current.lookupNip('1234567890');
    });

    expect(data).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Nie znaleziono podmiotu');
  });

  it('shows toast.error when subject is missing in response', async () => {
    mockFetch.mockReturnValue(makeResponse({ result: {} }));

    const { result } = renderHook(() => useGusLookup());

    let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
    await act(async () => {
      data = await result.current.lookupNip('1234567890');
    });

    expect(data).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Brak danych');
  });

  it('correctly parses street, postal code and city from formatted address', async () => {
    const subject = {
      name: 'Firma ABC',
      residenceAddress: 'al. Jana Pawła II 23, 30-960 Kraków',
    };
    mockFetch.mockReturnValue(makeResponse({ result: { subject } }));

    const { result } = renderHook(() => useGusLookup());

    let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
    await act(async () => {
      data = await result.current.lookupNip('9876543210');
    });

    expect(data).toEqual({
      name: 'Firma ABC',
      street: 'al. Jana Pawła II 23',
      postalCode: '30-960',
      city: 'Kraków',
    });
  });

  it('is true while fetching and false after', async () => {
    let resolveJson!: (v: unknown) => void;
    const jsonPromise = new Promise((res) => {
      resolveJson = res;
    });

    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => jsonPromise,
      } as unknown as Response)
    );

    const { result } = renderHook(() => useGusLookup());

    // Start the lookup without awaiting
    act(() => {
      result.current.lookupNip('1234567890');
    });

    // Loading should be true while we haven't resolved json yet
    await waitFor(() => expect(result.current.loading).toBe(true));

    // Now resolve the JSON
    await act(async () => {
      resolveJson({ result: { subject: VALID_SUBJECT } });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
