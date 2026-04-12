import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfWeek, subWeeks, addDays } from 'date-fns';
import { buildServicesMapFromDictionary, type DictionaryService, type ServiceMapEntry } from '@/hooks/useServiceDictionary';
import type { Reservation, ServiceItem } from '@/types/reservation';
import { mapRawReservation, type ServicesMap, type RawReservation } from '@/lib/reservationMapping';

export type { Reservation, ServiceItem };

interface DateRange {
  from: Date;
  to: Date | null;
}

// Fetch reservations for a specific date range
async function fetchReservationsForRange(
  instanceId: string,
  from: Date,
  to: Date | null,
  servicesMap: Map<string, ServiceMapEntry>,
): Promise<Reservation[]> {
  let query = supabase
    .from('reservations')
    .select(
      `
    id,
    instance_id,
    customer_name,
    customer_phone,
    vehicle_plate,
    reservation_date,
    end_date,
    start_time,
    end_time,
    station_id,
    status,
    confirmation_code,
    price,
    price_netto,
    customer_notes,
    admin_notes,
    source,
    car_size,
    service_ids,
    service_items,
    assigned_employee_ids,
    original_reservation_id,
    created_by,
    created_by_username,
    offer_number,
    confirmation_sms_sent_at,
    pickup_sms_sent_at,
    has_unified_services,
    photo_urls,
    checked_service_ids,
    stations:station_id (name, type)
  `,
    )
    .eq('instance_id', instanceId)
    .neq('status', 'cancelled')
    .gte('reservation_date', format(from, 'yyyy-MM-dd'));

  if (to !== null) {
    query = query.lte('reservation_date', format(to, 'yyyy-MM-dd'));
  }

  const { data, error } = await query;

  if (error || !data) {
    throw error ?? new Error('Failed to fetch reservations');
  }

  // Fetch original reservation data for change requests
  const changeRequestIds = data
    .filter((r): r is typeof r & { original_reservation_id: string } => !!r.original_reservation_id)
    .map((r) => r.original_reservation_id);

  const originalReservationsMap = new Map<
    string,
    { id: string; reservation_date: string; start_time: string; confirmation_code: string }
  >();
  if (changeRequestIds.length > 0) {
    const { data: originals } = await supabase
      .from('reservations')
      .select('id, reservation_date, start_time, confirmation_code')
      .in('id', changeRequestIds);

    if (originals) {
      originals.forEach((o) => originalReservationsMap.set(o.id, o));
    }
  }

  // Map reservation data
  return data.map((r) => {
    const mapped = mapRawReservation(r as RawReservation, servicesMap as ServicesMap);

    const originalReservation = r.original_reservation_id
      ? originalReservationsMap.get(r.original_reservation_id)
      : null;

    return {
      ...mapped,
      original_reservation: originalReservation || null,
    };
  });
}

interface UseReservationsOptions {
  instanceId: string | null;
  serviceDictMap: Map<string, DictionaryService>;
}

export function useReservations({ instanceId, serviceDictMap }: UseReservationsOptions) {
  const queryClient = useQueryClient();

  // Calculate initial date range: 1 week back from Monday
  const initialDateRange = useMemo(() => {
    const today = new Date();
    const mondayThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    return {
      from: subWeeks(mondayThisWeek, 1),
      to: null as null, // All future reservations
    };
  }, []);

  // Track loaded date range for incremental loading
  // State drives the queryKey (reactive); ref mirror lets callbacks read latest value without re-creating
  const [loadedRange, setLoadedRange] = useState<DateRange>(initialDateRange);
  const loadedRangeRef = useRef(loadedRange);
  loadedRangeRef.current = loadedRange;

  // Debounce ref for loadMore
  const loadMoreDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // State for reactive UI; ref as mutex guard to prevent concurrent loads
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreMutex = useRef(false);

  // Build services map from dictionary (same as inline buildServicesMapFromDictionary)
  const servicesMap = useMemo(
    () => buildServicesMapFromDictionary(serviceDictMap),
    [serviceDictMap],
  );

  // Ref for realtime handler
  const servicesMapRef = useRef(servicesMap);
  servicesMapRef.current = servicesMap;

  // Main query - fetches reservations for the loaded range
  const {
    data: reservations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reservations', instanceId, format(loadedRange.from, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!instanceId) return [];
      return fetchReservationsForRange(
        instanceId,
        loadedRangeRef.current.from,
        loadedRangeRef.current.to,
        servicesMapRef.current,
      );
    },
    enabled: !!instanceId && serviceDictMap.size > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Load more past reservations
  const loadMoreReservations = useCallback(async () => {
    if (!instanceId || isLoadingMoreMutex.current) return;

    isLoadingMoreMutex.current = true;
    setIsLoadingMore(true);

    try {
      const currentFrom = loadedRangeRef.current.from;
      const newFrom = subMonths(currentFrom, 1);

      // Fetch additional reservations
      const additionalReservations = await fetchReservationsForRange(
        instanceId,
        newFrom,
        currentFrom, // Up to old 'from' date
        servicesMapRef.current,
      );

      // Merge into the new key so useQuery reads the combined data after re-render
      queryClient.setQueryData<Reservation[]>(
        ['reservations', instanceId, format(newFrom, 'yyyy-MM-dd')],
        () => {
          const existing =
            queryClient.getQueryData<Reservation[]>([
              'reservations',
              instanceId,
              format(currentFrom, 'yyyy-MM-dd'),
            ]) ?? [];
          const existingIds = new Set(existing.map((r) => r.id));
          const uniqueNew = additionalReservations.filter((r) => !existingIds.has(r.id));
          return [...uniqueNew, ...existing];
        },
      );

      // Update state — this triggers useQuery to switch to the new key
      setLoadedRange((prev) => ({ ...prev, from: newFrom }));
    } finally {
      isLoadingMoreMutex.current = false;
      setIsLoadingMore(false);
    }
  }, [instanceId, queryClient]);

  // Debounced version for calendar navigation
  const loadMoreReservationsDebounced = useCallback(() => {
    if (loadMoreDebounceRef.current) {
      clearTimeout(loadMoreDebounceRef.current);
    }
    loadMoreDebounceRef.current = setTimeout(() => {
      loadMoreReservations();
    }, 300);
  }, [loadMoreReservations]);

  // Check if date is approaching edge of loaded data
  const checkAndLoadMore = useCallback(
    (date: Date) => {
      const bufferDays = 7;
      if (date < addDays(loadedRangeRef.current.from, bufferDays)) {
        loadMoreReservationsDebounced();
      }
    },
    [loadMoreReservationsDebounced],
  );

  // Expand loaded range to include a specific date (e.g., load all history from 2020)
  const expandDateRange = useCallback(
    (fromDate: Date) => {
      if (fromDate < loadedRangeRef.current.from) {
        setLoadedRange((prev) => ({ ...prev, from: fromDate }));
      }
    },
    [],
  );

  // General-purpose cache updater — replaces setReservations(fn) pattern
  const updateReservationsCache = useCallback(
    (updater: (prev: Reservation[]) => Reservation[]) => {
      queryClient.setQueryData<Reservation[]>(
        ['reservations', instanceId, format(loadedRangeRef.current.from, 'yyyy-MM-dd')],
        (old = []) => updater(old),
      );
    },
    [instanceId, queryClient],
  );

  // Update a single reservation in cache (for realtime updates)
  const updateReservationInCache = useCallback(
    (updatedReservation: Reservation) => {
      updateReservationsCache((old) => {
        const exists = old.some((r) => r.id === updatedReservation.id);
        if (exists) {
          return old.map((r) => (r.id === updatedReservation.id ? updatedReservation : r));
        }
        return [...old, updatedReservation];
      });
    },
    [updateReservationsCache],
  );

  // Remove a reservation from cache
  const removeReservationFromCache = useCallback(
    (reservationId: string) => {
      updateReservationsCache((old) => old.filter((r) => r.id !== reservationId));
    },
    [updateReservationsCache],
  );

  // Invalidate and refetch
  const invalidateReservations = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['reservations', instanceId],
      exact: false,
    });
  }, [instanceId, queryClient]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (loadMoreDebounceRef.current) {
        clearTimeout(loadMoreDebounceRef.current);
      }
    };
  }, []);

  return {
    reservations,
    isLoading,
    isLoadingMore,
    error,
    refetch,
    loadMoreReservations: loadMoreReservationsDebounced,
    checkAndLoadMore,
    expandDateRange,
    updateReservationInCache,
    removeReservationFromCache,
    updateReservationsCache,
    invalidateReservations,
    servicesMapRef,
    loadedDateRange: loadedRange,
  };
}
