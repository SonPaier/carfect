import { useState, useCallback, DragEvent } from 'react';
import { differenceInDays, addDays, format } from 'date-fns';
import type { Reservation, DragHandlers } from './types';
import { toDateOnly } from './swimLaneUtils';

export function useDragReservation(
  reservations: Reservation[],
  onReservationMove?: (reservationId: string, newStationId: string, newDate: string, newTime?: string, newEndDate?: string) => void,
): DragHandlers {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const onDragStart = useCallback((e: DragEvent<HTMLButtonElement>, reservation: Reservation) => {
    setDraggedId(reservation.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', reservation.id);
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverDate(null);
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateStr);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && (e.currentTarget as HTMLElement).contains(relatedTarget)) return;
    setDragOverDate(null);
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDate(null);
    const itemId = e.dataTransfer.getData('text/plain');
    setDraggedId(null);
    if (!itemId || !onReservationMove) return;
    const item = reservations.find(r => r.id === itemId);
    if (!item || item.reservation_date === dateStr) return;

    // Calculate date offset for multi-day reservations
    const oldStart = toDateOnly(item.reservation_date);
    const newStart = toDateOnly(dateStr);
    const dayOffset = differenceInDays(newStart, oldStart);

    let newEndDate: string | undefined;
    if (item.end_date && item.end_date !== item.reservation_date) {
      const oldEnd = toDateOnly(item.end_date);
      const shiftedEnd = addDays(oldEnd, dayOffset);
      newEndDate = format(shiftedEnd, 'yyyy-MM-dd');
    }

    onReservationMove(itemId, item.station_id || '', dateStr, undefined, newEndDate);
  }, [reservations, onReservationMove]);

  return { onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, draggedId, dragOverDate };
}
