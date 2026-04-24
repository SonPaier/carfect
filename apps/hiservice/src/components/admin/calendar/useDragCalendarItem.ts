import { useState, useCallback, DragEvent } from 'react';
import type { CalendarItem } from '../AdminCalendar';

export interface DragHandlers {
  onDragStart: (e: DragEvent<HTMLButtonElement>, item: CalendarItem) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, dateStr: string) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, dateStr: string) => void;
  draggedId: string | null;
  dragOverDate: string | null;
}

export function useDragCalendarItem(
  items: CalendarItem[],
  onItemMove?: (itemId: string, newColumnId: string, newDate: string) => void,
): DragHandlers {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const onDragStart = useCallback((e: DragEvent<HTMLButtonElement>, item: CalendarItem) => {
    setDraggedId(item.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
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
    if (!itemId || !onItemMove) return;
    const item = items.find((i) => i.id === itemId);
    if (!item || item.item_date === dateStr) return;

    // end_date shifting happens in the parent handler (Dashboard.handleItemMove)
    onItemMove(item.id, item.column_id || '', dateStr);
  }, [items, onItemMove]);

  return { onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, draggedId, dragOverDate };
}
