import { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarDayCell } from './CalendarDayCell';
import { useReservationsByDate } from './useReservationsByDate';
import { useDragReservation } from './useDragReservation';
import type { Reservation, Station, ClosedDay, GroupBy } from './types';

interface WeekTileViewProps {
  reservations: Reservation[];
  stations: Station[];
  currentDate: Date;
  closedDays?: ClosedDay[];
  onDayClick: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
  onAddClick?: (date: Date) => void;
  onReservationMove?: (reservationId: string, newStationId: string, newDate: string) => void;
  groupBy?: GroupBy;
  employees?: { id: string; name: string }[];
}

export const WeekTileView = ({
  reservations,
  stations,
  currentDate,
  closedDays = [],
  onDayClick,
  onReservationClick,
  onAddClick,
  onReservationMove,
  groupBy = 'none',
  employees = [],
}: WeekTileViewProps) => {
  const reservationsByDate = useReservationsByDate(reservations);
  const dragHandlers = useDragReservation(reservations, onReservationMove);

  const closedDateSet = useMemo(() => {
    const set = new Set<string>();
    closedDays.forEach(d => set.add(d.closed_date));
    return set;
  }, [closedDays]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartTime = weekStart.getTime();
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(weekStartTime), i));
  }, [weekStartTime]);

  const today = new Date();

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isDayToday = isSameDay(day, today);
          const isClosed = closedDateSet.has(dateStr);
          const dayReservations = reservationsByDate.get(dateStr) || [];

          return (
            <div
              key={dateStr}
              className={cn(
                'p-2 text-center font-medium text-xs cursor-pointer hover:bg-muted/50 transition-colors',
                idx < 6 && 'border-r border-border',
                isDayToday && 'bg-primary/10',
                isClosed && 'bg-red-50 dark:bg-red-950/20',
              )}
              onClick={() => onDayClick(day)}
            >
              <div className={cn(
                'text-foreground capitalize',
                isDayToday && 'text-primary font-bold',
                isClosed && 'text-red-500',
              )}>
                {format(day, 'EEE', { locale: pl })}
              </div>
              <div className={cn(
                'text-lg font-bold',
                isDayToday && 'text-primary',
                isClosed && 'text-red-500',
              )}>
                {format(day, 'd')}
              </div>
              <div className={cn(
                'text-[10px]',
                isClosed ? 'text-red-500' : 'text-muted-foreground',
              )}>
                {isClosed ? 'zamknięte' : `${dayReservations.length} rez.`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 flex-1">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayReservations = reservationsByDate.get(dateStr) || [];

          return (
            <CalendarDayCell
              key={dateStr}
              date={day}
              reservations={dayReservations}
              stations={stations}
              isToday={isSameDay(day, today)}
              isClosed={closedDateSet.has(dateStr)}
              onDayClick={onDayClick}
              onReservationClick={onReservationClick}
              onAddClick={onAddClick}
              dragHandlers={dragHandlers}
              groupBy={groupBy}
              employees={employees}
            />
          );
        })}
      </div>
    </div>
  );
};
