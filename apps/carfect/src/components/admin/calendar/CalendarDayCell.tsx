import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReservationTile } from './ReservationTile';
import type { Reservation, Station, DragHandlers } from './types';

interface CalendarDayCellProps {
  date: Date;
  reservations: Reservation[];
  stations: Station[];
  isToday: boolean;
  isCurrentMonth?: boolean;
  isClosed: boolean;
  onDayClick: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
  onAddClick?: (date: Date) => void;
  dragHandlers: DragHandlers;
  showStationName?: boolean;
  employees?: { id: string; name: string }[];
}

export const CalendarDayCell = ({
  date,
  reservations,
  stations,
  isToday,
  isCurrentMonth = true,
  isClosed,
  onDayClick,
  onReservationClick,
  onAddClick,
  dragHandlers,
  showStationName = false,
  employees = [],
}: CalendarDayCellProps) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const isDragOver = dragHandlers.dragOverDate === dateStr;

  return (
    <div
      className={cn(
        'border-r border-border last:border-r-0 p-1 flex flex-col min-h-0 overflow-hidden overflow-y-auto transition-colors bg-white dark:bg-card',
        isDragOver && 'bg-primary/10 ring-1 ring-inset ring-primary/30',
        isClosed && 'bg-red-50 dark:bg-red-950/20',
      )}
      onDragOver={(e) => dragHandlers.onDragOver(e, dateStr)}
      onDragLeave={dragHandlers.onDragLeave}
      onDrop={(e) => dragHandlers.onDrop(e, dateStr)}
    >
      {/* Day number */}
      <button
        onClick={() => onDayClick(date)}
        className={cn(
          'text-xs font-medium mb-0.5 w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors self-start shrink-0',
          isToday && 'bg-primary text-primary-foreground hover:bg-primary/90',
          !isCurrentMonth && 'text-muted-foreground/40',
          isClosed && !isToday && 'text-red-500',
        )}
      >
        {format(date, 'd')}
      </button>

      {/* Reservation tiles */}
      <div className="flex flex-col gap-0.5 min-h-0 flex-1">
        {reservations.map((reservation) => (
          <ReservationTile
            key={`${reservation.id}-${dateStr}`}
            reservation={reservation}
            stations={stations}
            onClick={onReservationClick}
            draggable={!!dragHandlers.onDrop}
            isDragging={dragHandlers.draggedId === reservation.id}
            onDragStart={dragHandlers.onDragStart}
            onDragEnd={dragHandlers.onDragEnd}
            showStationName={showStationName}
            employees={employees}
          />
        ))}

        {/* Add reservation button */}
        {onAddClick && !isClosed && isCurrentMonth && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(date);
            }}
            className="flex items-center justify-center gap-1 text-xs font-bold text-black hover:text-primary transition-colors mt-auto pt-1 w-full group"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj</span>
          </button>
        )}
      </div>
    </div>
  );
};
