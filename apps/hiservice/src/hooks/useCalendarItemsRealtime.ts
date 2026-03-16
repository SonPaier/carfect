import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CalendarItem, AssignedEmployee } from '@/components/admin/AdminCalendar';

interface UseCalendarItemsRealtimeOptions {
  instanceId: string | null;
  onInsert: (item: CalendarItem) => void;
  onUpdate: (item: CalendarItem) => void;
  onDelete: (itemId: string) => void;
  onRefetch: () => void;
  onBreakChange: () => void;
}

const RATE_LIMIT_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  minRefetchInterval: 10000,
  backoffMultiplier: 1.5,
};

/** Debounce window (ms) — skip realtime updates for items modified locally */
const LOCAL_UPDATE_DEBOUNCE = 3000;

async function fetchFullItem(itemId: string): Promise<CalendarItem | null> {
  const { data } = await supabase
    .from('calendar_items')
    .select(
      'id, column_id, title, customer_name, customer_phone, customer_email, customer_id, customer_address_id, assigned_employee_ids, item_date, end_date, start_time, end_time, status, admin_notes, price, photo_urls, media_items, payment_status, order_number, priority, project_id',
    )
    .eq('id', itemId)
    .maybeSingle();

  if (!data) return null;

  // Enrich with address
  if (data.customer_address_id) {
    const { data: addr } = await supabase
      .from('customer_addresses')
      .select('id, name, lat, lng, city, street')
      .eq('id', data.customer_address_id)
      .maybeSingle();
    if (addr) {
      (data as any).address_name = addr.name;
      (data as any).address_lat = addr.lat;
      (data as any).address_lng = addr.lng;
      (data as any).address_city = addr.city;
      (data as any).address_street = addr.street;
    }
  }

  // Enrich with employees
  if (data.assigned_employee_ids?.length) {
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, photo_url')
      .in('id', data.assigned_employee_ids);
    if (employees) {
      (data as any).assigned_employees = employees as AssignedEmployee[];
    }
  }

  // Enrich with project name
  if (data.project_id) {
    const { data: proj } = await (supabase.from('projects' as any) as any)
      .select('id, title')
      .eq('id', data.project_id)
      .maybeSingle();
    if (proj) {
      (data as any).project_name = proj.title;
    }
  }

  return data as CalendarItem;
}

export function useCalendarItemsRealtime({
  instanceId,
  onInsert,
  onUpdate,
  onDelete,
  onRefetch,
  onBreakChange,
}: UseCalendarItemsRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(true);

  const lastRefetchTimeRef = useRef<number>(0);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentlyUpdatedRef = useRef<Map<string, number>>(new Map());

  const markAsLocallyUpdated = useCallback((itemId: string, durationMs = LOCAL_UPDATE_DEBOUNCE) => {
    recentlyUpdatedRef.current.set(itemId, Date.now());
    setTimeout(() => {
      recentlyUpdatedRef.current.delete(itemId);
    }, durationMs);
  }, []);

  const rateLimitedRefetch = useCallback(() => {
    const now = Date.now();
    if (now - lastRefetchTimeRef.current < RATE_LIMIT_CONFIG.minRefetchInterval) {
      return;
    }
    lastRefetchTimeRef.current = now;
    onRefetch();
  }, [onRefetch]);

  useEffect(() => {
    if (!instanceId) return;

    let currentChannel: ReturnType<typeof supabase.channel> | null = null;
    let isCleanedUp = false;

    const setupChannel = () => {
      if (isCleanedUp) return;
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
      }

      currentChannel = supabase
        .channel(`calendar-items-${instanceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'calendar_items',
            filter: `instance_id=eq.${instanceId}`,
          },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const item = await fetchFullItem(payload.new.id);
              if (item) onInsert(item);
            } else if (payload.eventType === 'UPDATE') {
              // Skip if recently updated locally (debounce)
              const lastLocal = recentlyUpdatedRef.current.get(payload.new.id);
              if (lastLocal && Date.now() - lastLocal < LOCAL_UPDATE_DEBOUNCE) {
                return;
              }
              const item = await fetchFullItem(payload.new.id);
              if (item) onUpdate(item);
            } else if (payload.eventType === 'DELETE') {
              onDelete(payload.old.id);
            }
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'breaks', filter: `instance_id=eq.${instanceId}` },
          () => {
            onBreakChange();
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            retryCountRef.current = 0;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            if (isCleanedUp) return;

            if (retryCountRef.current < RATE_LIMIT_CONFIG.maxRetries) {
              retryCountRef.current++;
              const delay = Math.min(
                RATE_LIMIT_CONFIG.baseDelay *
                  Math.pow(RATE_LIMIT_CONFIG.backoffMultiplier, retryCountRef.current),
                RATE_LIMIT_CONFIG.maxDelay,
              );
              retryTimeoutRef.current = setTimeout(() => {
                if (isCleanedUp) return;
                rateLimitedRefetch();
                setupChannel();
              }, delay);
            } else {
              // Fallback: periodic reconnect every 30s
              retryTimeoutRef.current = setTimeout(() => {
                if (isCleanedUp) return;
                rateLimitedRefetch();
                retryCountRef.current = 0;
                setupChannel();
              }, 30000);
            }
          }
        });
    };

    setupChannel();

    return () => {
      isCleanedUp = true;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (currentChannel) supabase.removeChannel(currentChannel);
    };
  }, [instanceId, onInsert, onUpdate, onDelete, onBreakChange, rateLimitedRefetch]);

  return { isConnected, markAsLocallyUpdated };
}
