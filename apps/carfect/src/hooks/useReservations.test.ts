import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { resetSupabaseMocks } from '@/test/mocks/supabase';

// ============================================================
// Module mock — must be hoisted before any imports that use supabase
// ============================================================

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

// ============================================================
// Import after mocks are registered
// ============================================================

import { useReservations } from './useReservations';
import type { Reservation } from './useReservations';
import { mockSupabase } from '@/test/mocks/supabase';

// ============================================================
// React Query wrapper (required for useQuery)
// ============================================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Infinity prevents automatic re-fetches after setQueryData in cache manipulation tests
        staleTime: Infinity,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

// ============================================================
// Constants
// ============================================================

const INSTANCE_ID = 'inst-abc';

const BASE_SERVICE_DICT_MAP = new Map([
  [
    'svc-1',
    {
      id: 'svc-1',
      name: 'Mycie podstawowe',
      short_name: 'MP' as string | null,
      price_small: 40 as number | null,
      price_medium: 50 as number | null,
      price_large: 70 as number | null,
      price_from: null as number | null,
    },
  ],
  [
    'svc-2',
    {
      id: 'svc-2',
      name: 'Polerowanie',
      short_name: 'POL' as string | null,
      price_small: 250 as number | null,
      price_medium: 300 as number | null,
      price_large: 400 as number | null,
      price_from: 200 as number | null,
    },
  ],
]);
const EMPTY_DICT_MAP = new Map();

/** Build a minimal raw DB reservation row */
function makeRawReservation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'res-1',
    instance_id: INSTANCE_ID,
    customer_name: 'Jan Kowalski',
    customer_phone: '600000001',
    vehicle_plate: 'KR12345',
    reservation_date: '2026-04-05',
    end_date: null,
    start_time: '09:00',
    end_time: '10:00',
    station_id: 'sta-1',
    status: 'confirmed',
    confirmation_code: 'ABC123',
    price: 100,
    price_netto: null,
    customer_notes: null,
    admin_notes: null,
    source: null,
    car_size: null,
    service_ids: null,
    service_items: null,
    assigned_employee_ids: null,
    original_reservation_id: null,
    created_by: null,
    created_by_username: null,
    offer_number: null,
    confirmation_sms_sent_at: null,
    pickup_sms_sent_at: null,
    has_unified_services: null,
    photo_urls: null,
    checked_service_ids: null,
    stations: { name: 'Stanowisko 1', type: 'washing' },
    ...overrides,
  };
}

// ============================================================
// Helper — make query builder return specific data
// ============================================================

/**
 * Replaces mockSupabase.from so that every query resolves with
 * the provided row array (or triggers an error).
 */
function mockReservationsQuery(
  rows: ReturnType<typeof makeRawReservation>[],
  error: { message: string } | null = null,
) {
  const builder = buildChainableBuilder({ data: rows, error });
  mockSupabase.from.mockImplementation(() => builder);
  return builder;
}

function buildChainableBuilder(response: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  const chainable = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'in',
    'or',
    'not',
    'order',
    'limit',
    'single',
    'maybeSingle',
  ];
  for (const method of chainable) {
    builder[method] = vi.fn().mockReturnThis();
  }
  // The hook awaits the query directly (no .single()), so we implement `then`
  (builder as Record<string, unknown>).then = (
    resolve: (v: { data: unknown; error: unknown }) => void,
  ) => resolve(response);
  return builder;
}

// ============================================================
// Tests
// ============================================================

describe('useReservations', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // Initial state
  // ----------------------------------------------------------

  describe('initial state', () => {
    it('does not fetch when query is disabled', () => {
      const wrapperNullInstance = createWrapper();
      const { result: resultNull } = renderHook(
        () => useReservations({ instanceId: null, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper: wrapperNullInstance },
      );
      expect(resultNull.current.reservations).toEqual([]);

      const wrapperEmptyServices = createWrapper();
      const { result: resultEmpty } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: EMPTY_DICT_MAP }),
        { wrapper: wrapperEmptyServices },
      );
      expect(resultEmpty.current.reservations).toEqual([]);
    });
  });

  // ----------------------------------------------------------
  // Query execution
  // ----------------------------------------------------------

  describe('fetching reservations', () => {
    it('fetches reservations and maps station data, defaulting status to "pending" when falsy', async () => {
      const raw = makeRawReservation({
        status: 'confirmed',
        stations: { name: 'Stanowisko 1', type: 'washing' },
      });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.reservations).toHaveLength(1);
      const res = result.current.reservations[0];
      expect(res.id).toBe('res-1');
      expect(res.station?.name).toBe('Stanowisko 1');
      expect(res.station?.type).toBe('washing');

      // status default
      const rawFalsy = makeRawReservation({ status: '' });
      mockReservationsQuery([rawFalsy]);

      const wrapper2 = createWrapper();
      const { result: result2 } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper: wrapper2 },
      );

      await waitFor(() => expect(result2.current.isLoading).toBe(false));
      expect(result2.current.reservations[0].status).toBe('pending');
    });

    it('sets station to undefined when stations field is null', async () => {
      const raw = makeRawReservation({ stations: null });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.reservations[0].station).toBeUndefined();
    });

    it('returns error state when Supabase returns an error', async () => {
      mockReservationsQuery([], { message: 'DB error' });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBeTruthy();
    });
  });

  // ----------------------------------------------------------
  // Data transformation: services mapping
  // ----------------------------------------------------------

  describe('services_data mapping', () => {
    it('maps service_ids to services_data using services map when no service_items', async () => {
      const raw = makeRawReservation({
        service_ids: ['svc-1', 'svc-2'],
        service_items: null,
      });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const { services_data } = result.current.reservations[0];
      expect(services_data).toHaveLength(2);
      expect(services_data![0]).toMatchObject({
        id: 'svc-1',
        name: 'Mycie podstawowe',
        shortcut: 'MP',
        price_small: 40,
        price_medium: 50,
        price_large: 70,
      });
      expect(services_data![1]).toMatchObject({
        id: 'svc-2',
        name: 'Polerowanie',
        shortcut: 'POL',
      });
    });

    it('overrides services map data with matching service_items metadata', async () => {
      const raw = makeRawReservation({
        service_ids: ['svc-1'],
        service_items: [
          {
            service_id: 'svc-1',
            id: 'svc-1',
            name: 'Mycie custom',
            short_name: 'MC',
            custom_price: 60,
            price_small: 45,
            price_medium: 55,
            price_large: 75,
            price_from: null,
          },
        ],
      });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const svc = result.current.reservations[0].services_data![0];
      // service_items data takes precedence over services map
      expect(svc.name).toBe('Mycie custom');
      expect(svc.shortcut).toBe('MC');
      expect(svc.price_small).toBe(45);
    });

    it('falls back to "Usługa" name when service not in services map and no item name', async () => {
      const raw = makeRawReservation({
        service_ids: ['svc-unknown'],
        service_items: null,
      });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.reservations[0].services_data![0].name).toBe('Usługa');
    });

    it('uses service_items when service_ids is absent', async () => {
      const raw = makeRawReservation({
        service_ids: null,
        service_items: [
          { service_id: 'svc-1', id: 'svc-1', name: 'Mycie', short_name: 'MY', custom_price: null },
        ],
      });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const { services_data } = result.current.reservations[0];
      expect(services_data).toHaveLength(1);
      expect(services_data![0].name).toBe('Mycie');
    });

    it('deduplicates service_items by id when service_ids absent', async () => {
      const raw = makeRawReservation({
        service_ids: null,
        service_items: [
          { service_id: 'svc-1', id: 'svc-1', name: 'Mycie', short_name: 'MY', custom_price: null },
          {
            service_id: 'svc-1',
            id: 'svc-1',
            name: 'Mycie dup',
            short_name: 'MY',
            custom_price: null,
          },
        ],
      });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Duplicate service_ids should be filtered out
      expect(result.current.reservations[0].services_data).toHaveLength(1);
    });

    it('filters out service_items without any id', async () => {
      const raw = makeRawReservation({
        service_ids: null,
        service_items: [
          {
            service_id: undefined,
            id: undefined,
            name: 'No ID service',
            short_name: null,
            custom_price: null,
          },
        ],
      });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Item without id should be filtered out
      expect(result.current.reservations[0].services_data).toBeUndefined();
    });

    it('returns services_data undefined when both service_ids and service_items are empty', async () => {
      const raw = makeRawReservation({ service_ids: null, service_items: null });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.reservations[0].services_data).toBeUndefined();
    });
  });

  // ----------------------------------------------------------
  // Original reservation linking
  // ----------------------------------------------------------

  describe('original reservation linking', () => {
    it('attaches original_reservation data when original_reservation_id is present', async () => {
      const originalRow = {
        id: 'orig-res',
        reservation_date: '2026-03-01',
        start_time: '08:00',
        confirmation_code: 'ZZZ999',
      };

      const changeRequestRow = makeRawReservation({
        id: 'change-res',
        original_reservation_id: 'orig-res',
      });

      // First call returns the main reservations; second call (for originals) returns the original
      const mainBuilder = buildChainableBuilder({ data: [changeRequestRow], error: null });
      const originalsBuilder = buildChainableBuilder({ data: [originalRow], error: null });

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        // First call = main reservations query, second call = originals lookup
        return callCount === 1 ? mainBuilder : originalsBuilder;
      });

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const res = result.current.reservations[0];
      expect(res.original_reservation).not.toBeNull();
      expect(res.original_reservation?.reservation_date).toBe('2026-03-01');
      expect(res.original_reservation?.start_time).toBe('08:00');
      expect(res.original_reservation?.confirmation_code).toBe('ZZZ999');
    });
  });

  // ----------------------------------------------------------
  // Cache manipulation: updateReservationInCache
  // ----------------------------------------------------------

  describe('updateReservationInCache', () => {
    it('updates an existing reservation in cache by id', async () => {
      const raw = makeRawReservation({ id: 'res-1', status: 'confirmed' });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.reservations[0].status).toBe('confirmed');

      const updated = { ...result.current.reservations[0], status: 'completed' } as Reservation;

      act(() => {
        result.current.updateReservationInCache(updated);
      });

      await waitFor(() => {
        expect(result.current.reservations[0].status).toBe('completed');
      });
    });

    it('appends a new reservation to cache when id does not exist', async () => {
      const raw = makeRawReservation({ id: 'res-1' });
      mockReservationsQuery([raw]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.reservations).toHaveLength(1);

      const newRes = {
        ...result.current.reservations[0],
        id: 'res-new',
        customer_name: 'Nowy Klient',
      } as Reservation;

      act(() => {
        result.current.updateReservationInCache(newRes);
      });

      await waitFor(() => {
        expect(result.current.reservations).toHaveLength(2);
      });
      expect(result.current.reservations.find((r) => r.id === 'res-new')).toBeDefined();
    });
  });

  // ----------------------------------------------------------
  // Cache manipulation: removeReservationFromCache
  // ----------------------------------------------------------

  describe('removeReservationFromCache', () => {
    it('removes a reservation from cache by id', async () => {
      const rows = [makeRawReservation({ id: 'res-1' }), makeRawReservation({ id: 'res-2' })];
      mockReservationsQuery(rows);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.reservations).toHaveLength(2);

      act(() => {
        result.current.removeReservationFromCache('res-1');
      });

      await waitFor(() => {
        expect(result.current.reservations).toHaveLength(1);
      });
      expect(result.current.reservations[0].id).toBe('res-2');
    });

    it('is a no-op when the id does not exist in cache', async () => {
      mockReservationsQuery([makeRawReservation({ id: 'res-1' })]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.removeReservationFromCache('does-not-exist');
      });

      expect(result.current.reservations).toHaveLength(1);
    });
  });

  // ----------------------------------------------------------
  // invalidateReservations
  // ----------------------------------------------------------

  describe('invalidateReservations', () => {
    it('triggers a refetch when called', async () => {
      mockReservationsQuery([makeRawReservation()]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const callsBeforeInvalidate = mockSupabase.from.mock.calls.length;

      act(() => {
        result.current.invalidateReservations();
      });

      await waitFor(() => {
        expect(mockSupabase.from.mock.calls.length).toBeGreaterThan(callsBeforeInvalidate);
      });
    });
  });

  // ----------------------------------------------------------
  // checkAndLoadMore
  // ----------------------------------------------------------

  describe('checkAndLoadMore', () => {
    it('does not trigger load when date is well within loaded range', async () => {
      mockReservationsQuery([]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useReservations({ instanceId: INSTANCE_ID, serviceDictMap: BASE_SERVICE_DICT_MAP }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const callsBefore = mockSupabase.from.mock.calls.length;

      act(() => {
        // Far future date — well within loaded range
        result.current.checkAndLoadMore(new Date('2027-01-01'));
      });

      // No additional DB calls (debounce won't fire immediately either)
      await new Promise((r) => setTimeout(r, 50));
      expect(mockSupabase.from.mock.calls.length).toBe(callsBefore);
    });
  });
});
