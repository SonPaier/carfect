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
  onRefetch: () => void | Promise<void>;
  onNewCustomerReservation?: (reservation: Reservation) => void;
  onUpdateSelectedReservation?: (reservation: Reservation) => void;
  onTrainingInsert?: (training: Record<string, unknown>) => void;
  onTrainingUpdate?: (training: Record<string, unknown>) => void;
  onTrainingDelete?: (trainingId: string) => void;
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  // Minimum time between full refetches (prevents burst refetches on rapid reconnect)
  minRefetchInterval: 5000, // 5 seconds (matches inline AdminDashboard behavior)
  // Exponential backoff multiplier
  backoffMultiplier: 1.5
};

const FULL_RESERVATION_SELECT = `
  id, instance_id, customer_name, customer_phone, vehicle_plate,
  reservation_date, end_date, start_time, end_time, station_id,
  status, confirmation_code, price, price_netto, customer_notes, admin_notes,
  source, car_size, service_ids, service_items, assigned_employee_ids,
  original_reservation_id, created_by, created_by_username,
  offer_number, confirmation_sms_sent_at, pickup_sms_sent_at,
  has_unified_services, photo_urls, checked_service_ids,
  stations:station_id (name, type)
`;

const TRAINING_SELECT = '*, stations:station_id (name, type), training_type_record:training_type_id (id, name, duration_days, sort_order, active, instance_id)';

export function useReservationsRealtime({
  instanceId,
  servicesMapRef,
  loadedDateRangeFrom,
  onInsert,
  onUpdate,
  onDelete,
  onRefetch,
  onNewCustomerReservation,
  onUpdateSelectedReservation,
  onTrainingInsert,
  onTrainingUpdate,
  onTrainingDelete
}: UseReservationsRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(true);

  // Rate limiting refs
  const lastRefetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Rate-limited refetch matching inline AdminDashboard throttle logic
  const rateLimitedRefetch = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastRefetchTimeRef.current;

    if (timeSinceLastRefetch < RATE_LIMIT_CONFIG.minRefetchInterval || isFetchingRef.current) {
      console.log(`[Realtime] Skipping refetch - rate limited (${timeSinceLastRefetch}ms since last)`);
      return;
    }

    lastRefetchTimeRef.current = now;
    isFetchingRef.current = true;
    const result = onRefetch();
    if (result && typeof (result as Promise<void>).then === 'function') {
      (result as Promise<void>).finally(() => {
        isFetchingRef.current = false;
      });
    } else {
      isFetchingRef.current = false;
    }
  }, [onRefetch]);

  // Notification sound using Web Audio API oscillator (matching AdminDashboard inline impl)
  const playNotificationSound = useCallback(() => {
    try {
      type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };
      const AudioCtx = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      console.log('Could not play notification sound:', e);
    }
  }, []);

  // Map raw data to Reservation
  const mapRealtimeData = useCallback((data: RawReservation): Reservation => {
    return mapRawReservation(data, servicesMapRef.current as ServicesMap);
  }, [servicesMapRef]);

  useEffect(() => {
    if (!instanceId) return;

    let currentChannel: ReturnType<typeof supabase.channel> | null = null;
    let isCleanedUp = false;

    const setupRealtimeChannel = () => {
      if (isCleanedUp) return;

      // Remove previous channel if exists
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
        currentChannel = null;
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
              const { data } = await supabase.from('trainings').select(TRAINING_SELECT).eq('id', payload.new.id).single();
              if (data) onTrainingInsert(data as Record<string, unknown>);
            } else if (payload.eventType === 'UPDATE' && onTrainingUpdate) {
              const { data } = await supabase.from('trainings').select(TRAINING_SELECT).eq('id', payload.new.id).single();
              if (data) onTrainingUpdate(data as Record<string, unknown>);
            } else if (payload.eventType === 'DELETE' && onTrainingDelete) {
              onTrainingDelete(payload.old.id as string);
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
              const reservationDate = parseISO(newRecord.reservation_date as string);

              // Check if within loaded range
              if (reservationDate < loadedDateRangeFromRef.current) {
                return;
              }

              // Play sound for customer reservations
              if (newRecord.source === 'customer') {
                playNotificationSound();
              }

              // Fetch full reservation data
              const { data } = await supabase
                .from('reservations')
                .select(FULL_RESERVATION_SELECT)
                .eq('id', payload.new.id)
                .single();

              if (data) {
                const reservation = mapRealtimeData(data as RawReservation);
                onInsert(reservation);

                if ((data as Record<string, unknown>).source === 'customer') {
                  onNewCustomerReservation?.(reservation);
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              // Skip if recently updated locally
              const lastLocalUpdate = recentlyUpdatedRef.current.get(payload.new.id as string);
              if (lastLocalUpdate && Date.now() - lastLocalUpdate < 3000) {
                console.log('[Realtime] Skipping update for locally modified reservation:', payload.new.id);
                return;
              }

              // Fetch full reservation data
              const { data } = await supabase
                .from('reservations')
                .select(FULL_RESERVATION_SELECT)
                .eq('id', payload.new.id)
                .single();

              if (data) {
                const reservation = mapRealtimeData(data as RawReservation);
                onUpdate(reservation);
                onUpdateSelectedReservation?.(reservation);
              }
            } else if (payload.eventType === 'DELETE') {
              onDelete(payload.old.id as string);
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);

          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            retryCountRef.current = 0;
            // Sync after reconnect to recover any missed events
            // Throttled: skip if fetched less than 5s ago (prevents rapid reconnect loops)
            rateLimitedRefetch();
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
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
                setupRealtimeChannel();
              }, delay);
            } else {
              console.error('[Realtime] Max retries reached, falling back to periodic fetch');
              // Fallback: periodic fetch every 30s
              retryTimeoutRef.current = setTimeout(() => {
                if (isCleanedUp) return;
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
  }, [instanceId, mapRealtimeData, onInsert, onUpdate, onDelete, rateLimitedRefetch, onNewCustomerReservation, onUpdateSelectedReservation, onTrainingInsert, onTrainingUpdate, onTrainingDelete, playNotificationSound]);

  return {
    isConnected,
    markAsLocallyUpdated
  };
}
