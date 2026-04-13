import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseISO } from 'date-fns';
import type { Reservation } from './useReservations';
import { mapRawReservation, type ServicesMap, type ServicesMapEntry, type RawReservation } from '@/lib/reservationMapping';

interface UseReservationsRealtimeOptions {
  instanceId: string | null;
  servicesMapRef: React.MutableRefObject<Map<string, ServicesMapEntry>>;
  loadedDateRangeFrom: Date;
  onInsert: (reservation: Reservation) => void;
  onUpdate: (reservation: Reservation) => void;
  onDelete: (reservationId: string) => void;
  onRefetch: () => void;
  onNewCustomerReservation?: (reservation: Reservation) => void;
  onTrainingInsert?: (training: Record<string, unknown>) => void;
  onTrainingUpdate?: (training: Record<string, unknown>) => void;
  onTrainingDelete?: (trainingId: string) => void;
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  // Minimum time between full refetches (prevents burst refetches)
  minRefetchInterval: 10000, // 10 seconds
  // Exponential backoff multiplier
  backoffMultiplier: 1.5
};

export function useReservationsRealtime({
  instanceId,
  servicesMapRef,
  loadedDateRangeFrom,
  onInsert,
  onUpdate,
  onDelete,
  onRefetch,
  onNewCustomerReservation,
  onTrainingInsert,
  onTrainingUpdate,
  onTrainingDelete
}: UseReservationsRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(true);

  // Rate limiting refs
  const lastRefetchTimeRef = useRef<number>(0);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Polling fallback ref
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Stable ref for onRefetch to avoid effect re-runs
  const onRefetchRef = useRef(onRefetch);
  onRefetchRef.current = onRefetch;

  // Debounce mechanism to prevent realtime updates from overwriting local changes
  const recentlyUpdatedRef = useRef<Map<string, number>>(new Map());
  
  // Track loaded date range with ref to avoid re-subscriptions
  const loadedDateRangeFromRef = useRef(loadedDateRangeFrom);
  loadedDateRangeFromRef.current = loadedDateRangeFrom;

  const markAsLocallyUpdated = useCallback((reservationId: string, durationMs = 3000) => {
    recentlyUpdatedRef.current.set(reservationId, Date.now());
    setTimeout(() => {
      recentlyUpdatedRef.current.delete(reservationId);
    }, durationMs);
  }, []);

  // Rate-limited refetch
  const rateLimitedRefetch = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastRefetchTimeRef.current;
    
    if (timeSinceLastRefetch < RATE_LIMIT_CONFIG.minRefetchInterval) {
      console.log(`[Realtime] Skipping refetch - rate limited (${timeSinceLastRefetch}ms since last)`);
      return;
    }
    
    lastRefetchTimeRef.current = now;
    onRefetch();
  }, [onRefetch]);

  // Map raw data to Reservation
  const mapRealtimeData = useCallback((data: RawReservation): Reservation => {
    return mapRawReservation(data, servicesMapRef.current as ServicesMap);
  }, [servicesMapRef]);

  useEffect(() => {
    if (!instanceId) return;

    let currentChannel: ReturnType<typeof supabase.channel> | null = null;
    let isCleanedUp = false;

    // Notification sound
    const playNotificationSound = () => {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch { /* audio playback may fail silently */ }
    };

    const setupRealtimeChannel = () => {
      if (isCleanedUp) return;
      
      // Remove previous channel if exists
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
      }

      currentChannel = supabase
        .channel(`reservations-${instanceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trainings',
            filter: `instance_id=eq.${instanceId}`
          },
          async (payload) => {
            if (payload.eventType === 'INSERT' && onTrainingInsert) {
              const { data } = await supabase.from('trainings').select('*, stations:station_id (name, type)').eq('id', payload.new.id).single();
              if (data) onTrainingInsert(data);
            } else if (payload.eventType === 'UPDATE' && onTrainingUpdate) {
              const { data } = await supabase.from('trainings').select('*, stations:station_id (name, type)').eq('id', payload.new.id).single();
              if (data) onTrainingUpdate(data);
            } else if (payload.eventType === 'DELETE' && onTrainingDelete) {
              onTrainingDelete(payload.old.id);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reservations',
            filter: `instance_id=eq.${instanceId}`
          },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const newRecord = payload.new as Record<string, unknown>;
              const reservationDate = parseISO(newRecord.reservation_date);

              // Check if within loaded range
              if (reservationDate < loadedDateRangeFromRef.current) {
                return;
              }

              // Play sound for customer reservations
              if (newRecord.source === 'customer') {
                playNotificationSound();
              }

              // Fetch full reservation data
              const { data } = await supabase.from('reservations').select(`
                id, instance_id, customer_name, customer_phone, vehicle_plate,
                reservation_date, end_date, start_time, end_time, station_id,
                status, confirmation_code, price, price_netto, source, service_ids, service_items,
                created_by_username, offer_number, photo_urls, has_unified_services,
                checked_service_ids, stations:station_id (name, type)
              `).eq('id', payload.new.id).single();

              if (data) {
                const reservation = mapRealtimeData(data);
                onInsert(reservation);

                if (data.source === 'customer') {
                  onNewCustomerReservation?.(reservation);
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              // Skip if recently updated locally
              const lastLocalUpdate = recentlyUpdatedRef.current.get(payload.new.id);
              if (lastLocalUpdate && Date.now() - lastLocalUpdate < 3000) {
                console.log('[Realtime] Skipping update for locally modified reservation:', payload.new.id);
                return;
              }

              // Fetch full reservation data
              const { data } = await supabase.from('reservations').select(`
                id, instance_id, customer_name, customer_phone, vehicle_plate,
                reservation_date, end_date, start_time, end_time, station_id,
                status, confirmation_code, price, price_netto, source, service_ids, service_items,
                admin_notes, customer_notes, car_size, offer_number, photo_urls,
                has_unified_services, checked_service_ids, stations:station_id (name, type)
              `).eq('id', payload.new.id).single();

              if (data) {
                const reservation = mapRealtimeData(data);
                onUpdate(reservation);
              }
            } else if (payload.eventType === 'DELETE') {
              onDelete(payload.old.id);
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);

          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            retryCountRef.current = 0;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);

            if (isCleanedUp) return;

            // Rate-limited retry with exponential backoff
            if (retryCountRef.current < RATE_LIMIT_CONFIG.maxRetries) {
              retryCountRef.current++;
              const delay = Math.min(
                RATE_LIMIT_CONFIG.baseDelay * Math.pow(RATE_LIMIT_CONFIG.backoffMultiplier, retryCountRef.current),
                RATE_LIMIT_CONFIG.maxDelay
              );
              console.log(`[Realtime] Retry ${retryCountRef.current}/${RATE_LIMIT_CONFIG.maxRetries} in ${delay}ms`);

              retryTimeoutRef.current = setTimeout(() => {
                if (isCleanedUp) return;
                // Rate-limited refetch in case events were missed
                rateLimitedRefetch();
                setupRealtimeChannel();
              }, delay);
            } else {
              console.error('[Realtime] Max retries reached, falling back to periodic fetch');
              // Fallback: periodic fetch every 30s
              retryTimeoutRef.current = setTimeout(() => {
                if (isCleanedUp) return;
                rateLimitedRefetch();
                retryCountRef.current = 0;
                setupRealtimeChannel();
              }, 30000);
            }
          }
        });
    };

    // Initial connection
    setupRealtimeChannel();

    return () => {
      isCleanedUp = true;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (currentChannel) supabase.removeChannel(currentChannel);
    };
  }, [instanceId, mapRealtimeData, onInsert, onUpdate, onDelete, rateLimitedRefetch, onNewCustomerReservation]);

  // Polling fallback for flaky connections (shop floor displays)
  useEffect(() => {
    if (isConnected) {
      // Stop polling when reconnected
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Start polling after grace period when disconnected
    const startDelay = setTimeout(() => {
      pollIntervalRef.current = setInterval(() => {
        const result = onRefetchRef.current();
        if (result && typeof (result as Promise<void>).then === 'function') {
          (result as Promise<void>).catch(() => {});
        }
      }, 15000);
    }, 10000);

    return () => {
      clearTimeout(startDelay);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isConnected]);

  return {
    isConnected,
    markAsLocallyUpdated
  };
}
