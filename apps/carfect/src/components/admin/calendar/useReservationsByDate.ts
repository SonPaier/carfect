import { useMemo } from 'react';
import { format, addDays } from 'date-fns';
import type { Reservation } from './types';

/**
 * Groups reservations by date string, handling multi-day reservations.
 * Returns Map<'yyyy-MM-dd', Reservation[]> sorted by start_time.
 */
export function useReservationsByDate(reservations: Reservation[]): Map<string, Reservation[]> {
  return useMemo(() => {
    const map = new Map<string, Reservation[]>();

    // Deduplicate by ID first — prevents duplicates from realtime/fetch overlap
    const seen = new Set<string>();

    for (const reservation of reservations) {
      if (reservation.status === 'cancelled') continue;
      if (!reservation.reservation_date) continue;
      if (seen.has(reservation.id)) continue;
      seen.add(reservation.id);

      const startDate = reservation.reservation_date;
      const endDate = reservation.end_date || reservation.reservation_date;

      let current = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');

      while (current <= end) {
        const dateStr = format(current, 'yyyy-MM-dd');
        if (!map.has(dateStr)) map.set(dateStr, []);
        map.get(dateStr)!.push(reservation);
        current = addDays(current, 1);
      }
    }

    // Sort each day's reservations by start_time
    for (const [, dayReservations] of map) {
      dayReservations.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    }

    return map;
  }, [reservations]);
}
