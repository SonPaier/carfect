import { useState, useCallback, DragEvent } from 'react';
import type { Reservation, DragHandlers } from './types';

export function useDragReservation(
  reservations: Reservation[],
  onReservationMove?: (reservationId: string, newStationId: string, newDate: string) => void,
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
    onReservationMove(itemId, item.station_id || '', dateStr);
  }, [reservations, onReservationMove]);

  return { onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, draggedId, dragOverDate };
}
