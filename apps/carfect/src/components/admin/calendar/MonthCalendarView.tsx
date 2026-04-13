import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  differenceInDays,
  max,
  min,
} from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@shared/ui';
import type { Reservation, Station, ClosedDay, GroupBy } from './types';
import { getStatusColor } from './types';

interface MonthCalendarViewProps {
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

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

const BAR_HEIGHT = 22; // px per lane bar
const BAR_GAP = 2;    // px gap between bars
const DATE_HEADER_HEIGHT = 28; // px for the date number row

interface WeekEvent {
  reservation: Reservation;
  startCol: number;
  span: number;
  lane: number;
  isStart: boolean;
  isEnd: boolean;
}

function toDateOnly(dateStr: string): Date {
  // parseISO gives us UTC midnight; we need local date comparison
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function assignLanes(events: WeekEvent[]): void {
  // Sort: longer spans first, then earlier start
  events.sort((a, b) => b.span - a.span || a.startCol - b.startCol);
  const laneEnds: number[] = []; // tracks end column (exclusive) of last event in each lane
  for (const event of events) {
    let assigned = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] <= event.startCol) {
        assigned = i;
        break;
      }
    }
    if (assigned === -1) {
      assigned = laneEnds.length;
      laneEnds.push(0);
    }
    event.lane = assigned;
    laneEnds[assigned] = event.startCol + event.span;
  }
}

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface WeekRowProps {
  week: Date[];
  weekEvents: WeekEvent[];
  maxLanes: number;
  today: Date;
  currentDate: Date;
  closedDateSet: Set<string>;
  stations: Station[];
  isMobile: boolean;
  onDayClick: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
  onAddClick?: (date: Date) => void;
}

const WeekRow = ({
  week,
  weekEvents,
  maxLanes,
  today,
  currentDate,
  closedDateSet,
  stations,
  isMobile,
  onDayClick,
  onReservationClick,
  onAddClick,
}: WeekRowProps) => {
  const minRowHeight = DATE_HEADER_HEIGHT + maxLanes * (BAR_HEIGHT + BAR_GAP) + 8;
  const rowHeight = Math.max(minRowHeight, 80);

  return (
    <div
      className="relative grid grid-cols-7 border-b border-border last:border-b-0"
      style={{ minHeight: rowHeight }}
    >
      {/* Day background cells */}
      {week.map((day) => {
        const dateStr = formatDateStr(day);
        const isToday = isSameDay(day, today);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isClosed = closedDateSet.has(dateStr);

        return (
          <div
            key={dateStr}
            className={cn(
              'border-r border-border last:border-r-0 cursor-pointer group relative',
              isClosed && 'bg-red-50',
              !isCurrentMonth && !isClosed && 'bg-muted/30',
              isCurrentMonth && !isClosed && 'bg-background',
            )}
            onClick={() => onDayClick(day)}
          >
            {/* Date number */}
            <div
              className={cn(
                'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full m-1',
                isToday && 'bg-primary text-primary-foreground font-bold',
                !isToday && isCurrentMonth && 'text-foreground',
                !isToday && !isCurrentMonth && 'text-muted-foreground',
              )}
              style={{ height: DATE_HEADER_HEIGHT - 4 }}
            >
              {day.getDate()}
            </div>

            {/* Add button on hover */}
            {onAddClick && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAddClick(day); }}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary"
                tabIndex={-1}
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Event bars overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ top: DATE_HEADER_HEIGHT }}>
        {weekEvents.map((evt) => {
          const leftPct = (evt.startCol / 7) * 100;
          const widthPct = (evt.span / 7) * 100;
          const topPx = evt.lane * (BAR_HEIGHT + BAR_GAP);

          const reservation = evt.reservation;
          const station = stations.find(s => s.id === reservation.station_id);
          const stationColor = station?.color;
          const serviceName = reservation.service?.shortcut || reservation.service?.name ||
            reservation.services_data?.[0]?.shortcut || reservation.services_data?.[0]?.name || '';

          const colorClasses = getStatusColor(reservation.status, station?.type);

          return (
            <button
              key={`${reservation.id}-${evt.startCol}`}
              type="button"
              className={cn(
                'absolute pointer-events-auto text-left border-l-[3px] overflow-hidden',
                'hover:opacity-80 cursor-pointer transition-opacity',
                'flex items-center gap-1 px-1.5',
                colorClasses,
                evt.isStart && evt.isEnd && 'rounded',
                evt.isStart && !evt.isEnd && 'rounded-l',
                !evt.isStart && evt.isEnd && 'rounded-r',
                !evt.isStart && !evt.isEnd && 'rounded-none',
              )}
              style={{
                left: `calc(${leftPct}% + 2px)`,
                width: `calc(${widthPct}% - 4px)`,
                top: topPx,
                height: BAR_HEIGHT,
                borderLeftColor: stationColor || undefined,
              }}
              onClick={(e) => { e.stopPropagation(); onReservationClick(reservation); }}
            >
              {isMobile ? (
                <span className="text-[10px] font-semibold truncate">
                  {serviceName || reservation.customer_name}
                </span>
              ) : (
                <span className="text-[11px] truncate flex items-center gap-1 w-full">
                  {evt.isStart && reservation.start_time && (
                    <span className="font-bold tabular-nums shrink-0">
                      {reservation.start_time.slice(0, 5)}
                    </span>
                  )}
                  {serviceName && (
                    <span className="font-semibold shrink-0 hidden sm:inline">{serviceName}</span>
                  )}
                  <span className="truncate">{reservation.customer_name}</span>
                  {!isMobile && reservation.vehicle_plate && (
                    <span className="font-semibold shrink-0 hidden md:inline">{reservation.vehicle_plate}</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const MonthCalendarView = ({
  reservations,
  stations,
  currentDate,
  closedDays = [],
  onDayClick,
  onReservationClick,
  onAddClick,
  // onReservationMove is accepted for backward compat but drag-drop is not implemented in bar view
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onReservationMove: _onReservationMove,
  // groupBy and employees are accepted for backward compat
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  groupBy: _groupBy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  employees: _employees,
}: MonthCalendarViewProps) => {
  const isMobile = useIsMobile();

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
  }, [calendarStart, calendarEnd]);

  // Filter out cancelled and no_show reservations
  const visibleReservations = useMemo(
    () => reservations.filter(r => r.status !== 'cancelled' && r.status !== 'no_show'),
    [reservations],
  );

  // Per-week events with lane assignments
  const weeklyData = useMemo(() => {
    return weeks.map((week) => {
      const weekStart = week[0];
      const weekEnd = week[6];

      const events: WeekEvent[] = [];

      for (const reservation of visibleReservations) {
        const resStart = toDateOnly(reservation.reservation_date);
        const resEnd = toDateOnly(reservation.end_date || reservation.reservation_date);

        // Check if reservation overlaps with this week
        if (resEnd < weekStart || resStart > weekEnd) continue;

        const clampedStart = max([resStart, weekStart]);
        const clampedEnd = min([resEnd, weekEnd]);

        const startCol = differenceInDays(clampedStart, weekStart);
        const span = differenceInDays(clampedEnd, clampedStart) + 1;

        events.push({
          reservation,
          startCol,
          span,
          lane: 0,
          isStart: isSameDay(clampedStart, resStart),
          isEnd: isSameDay(clampedEnd, resEnd),
        });
      }

      assignLanes(events);
      const maxLanes = events.length > 0 ? Math.max(...events.map(e => e.lane)) + 1 : 0;

      return { week, events, maxLanes };
    });
  }, [weeks, visibleReservations]);

  const today = new Date();

  return (
    <div className="flex flex-col h-full">
      {/* Day names header */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center text-xs font-medium text-muted-foreground py-2 border-r border-border last:border-r-0"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid — one row per week */}
      <div>
        {weeklyData.map(({ week, events, maxLanes }, weekIdx) => (
          <WeekRow
            key={weekIdx}
            week={week}
            weekEvents={events}
            maxLanes={maxLanes}
            today={today}
            currentDate={currentDate}
            closedDateSet={closedDateSet}
            stations={stations}
            isMobile={isMobile}
            onDayClick={onDayClick}
            onReservationClick={onReservationClick}
            onAddClick={onAddClick}
          />
        ))}
      </div>
    </div>
  );
};
