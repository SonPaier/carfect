import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGusLookup } from './useGusLookup';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 404,
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

describe('useGusLookup (shared)', () => {
  describe('without callbacks', () => {
    it('returns company data for a valid NIP', async () => {
      mockFetch.mockReturnValue(makeResponse({ result: { subject: VALID_SUBJECT } }));

      const { result } = renderHook(() => useGusLookup());

      let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
      await act(async () => {
        data = await result.current.lookupNip('1234567890');
      });

      expect(data!).toEqual({
        name: 'ACME Sp. z o.o.',
        street: 'ul. Testowa 12',
        postalCode: '00-001',
        city: 'Warszawa',
      });
    });

    it('returns null and does not fetch when NIP has fewer than 10 digits', async () => {
      const { result } = renderHook(() => useGusLookup());

      let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
      await act(async () => {
        data = await result.current.lookupNip('12345');
      });

      expect(data!).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns null on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useGusLookup());

      let data: Awaited<ReturnType<typeof result.current.lookupNip>>;
      await act(async () => {
        data = await result.current.lookupNip('1234567890');
      });

      expect(data!).toBeNull();
    });
  });

  describe('with onSuccess and onError callbacks', () => {
    it('calls onSuccess with parsed result for a valid NIP', async () => {
      mockFetch.mockReturnValue(makeResponse({ result: { subject: VALID_SUBJECT } }));

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const { result } = renderHook(() => useGusLookup({ onSuccess, onError }));

      await act(async () => {
        await result.current.lookupNip('1234567890');
      });

      expect(onSuccess).toHaveBeenCalledWith({
        name: 'ACME Sp. z o.o.',
        street: 'ul. Testowa 12',
        postalCode: '00-001',
        city: 'Warszawa',
      });
      expect(onError).not.toHaveBeenCalled();
    });

    it('calls onError with validation message when NIP has fewer than 10 digits', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGusLookup({ onError }));

      await act(async () => {
        await result.current.lookupNip('12345');
      });

      expect(onError).toHaveBeenCalledWith('NIP musi mieć 10 cyfr');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('calls onError with network error message', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const onError = vi.fn();
      const { result } = renderHook(() => useGusLookup({ onError }));

      await act(async () => {
        await result.current.lookupNip('1234567890');
      });

      expect(onError).toHaveBeenCalledWith('Network failure');
    });

    it('calls onError when API returns non-ok status', async () => {
      mockFetch.mockReturnValue(makeResponse({}, false));

      const onError = vi.fn();
      const { result } = renderHook(() => useGusLookup({ onError }));

      await act(async () => {
        await result.current.lookupNip('1234567890');
      });

      expect(onError).toHaveBeenCalledWith('Nie znaleziono podmiotu');
    });

    it('calls onError when subject is missing in response', async () => {
      mockFetch.mockReturnValue(makeResponse({ result: {} }));

      const onError = vi.fn();
      const { result } = renderHook(() => useGusLookup({ onError }));

      await act(async () => {
        await result.current.lookupNip('1234567890');
      });

      expect(onError).toHaveBeenCalledWith('Brak danych');
    });
  });

  describe('NIP normalization', () => {
    it('strips dashes and spaces from NIP before fetching', async () => {
      mockFetch.mockReturnValue(makeResponse({ result: { subject: VALID_SUBJECT } }));

      const { result } = renderHook(() => useGusLookup());

      await act(async () => {
        await result.current.lookupNip('123-456-78-90');
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/nip/1234567890'));
    });
  });

  describe('address parsing', () => {
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

      expect(data!).toEqual({
        name: 'Firma ABC',
        street: 'al. Jana Pawła II 23',
        postalCode: '30-960',
        city: 'Kraków',
      });
    });
  });

  describe('loading state', () => {
    it('is true while fetching and false after completion', async () => {
      let resolveJson!: (v: unknown) => void;
      const jsonPromise = new Promise((res) => {
        resolveJson = res;
      });

      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: true,
          json: () => jsonPromise,
        } as unknown as Response),
      );

      const { result } = renderHook(() => useGusLookup());

      act(() => {
        result.current.lookupNip('1234567890');
      });

      await waitFor(() => expect(result.current.loading).toBe(true));

      await act(async () => {
        resolveJson({ result: { subject: VALID_SUBJECT } });
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
    });
  });
});
