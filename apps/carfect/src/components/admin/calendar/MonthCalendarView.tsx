import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { CalendarDayCell } from './CalendarDayCell';
import { useReservationsByDate } from './useReservationsByDate';
import { useDragReservation } from './useDragReservation';
import type { Reservation, Station, ClosedDay } from './types';

interface MonthCalendarViewProps {
  reservations: Reservation[];
  stations: Station[];
  currentDate: Date;
  closedDays?: ClosedDay[];
  onDayClick: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
  onAddClick?: (date: Date) => void;
  onReservationMove?: (reservationId: string, newStationId: string, newDate: string) => void;
}

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

export const MonthCalendarView = ({
  reservations,
  stations,
  currentDate,
  closedDays = [],
  onDayClick,
  onReservationClick,
  onAddClick,
  onReservationMove,
}: MonthCalendarViewProps) => {
  const reservationsByDate = useReservationsByDate(reservations);
  const dragHandlers = useDragReservation(reservations, onReservationMove);

  const closedDateSet = useMemo(() => {
    const set = new Set<string>();
    closedDays.forEach(d => set.add(d.closed_date));
    return set;
  }, [closedDays]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let day = calendarStart;
    let currentWeek: Date[] = [];

    while (day <= calendarEnd) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      day = addDays(day, 1);
    }
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    return result;
  }, [calendarStart.getTime(), calendarEnd.getTime()]);

  const today = new Date();

  return (
    <div className="flex flex-col">
      {/* Day names header */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-muted-foreground py-2 border-r border-border last:border-r-0">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div>
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b border-border last:border-b-0 min-h-[80px]">
            {week.map((day) => {
              const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
              const dayReservations = reservationsByDate.get(dateStr) || [];

              return (
                <CalendarDayCell
                  key={dateStr}
                  date={day}
                  reservations={dayReservations}
                  stations={stations}
                  isToday={isSameDay(day, today)}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  isClosed={closedDateSet.has(dateStr)}
                  onDayClick={onDayClick}
                  onReservationClick={onReservationClick}
                  onAddClick={onAddClick}
                  dragHandlers={dragHandlers}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
