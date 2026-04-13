import { useMemo } from 'react';
import {
  startOfWeek,
  addDays,
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
import { type WeekEvent, toDateOnly, assignLanes, formatDateStr } from './swimLaneUtils';

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

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

const BAR_HEIGHT = 26; // px per lane bar — taller since only 1 week
const BAR_GAP = 3;    // px gap between bars
const DATE_HEADER_HEIGHT = 64; // px for the day name + date number + count header

export const WeekTileView = ({
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
}: WeekTileViewProps) => {
  const isMobile = useIsMobile();
  const today = new Date();

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

  // Filter out cancelled and no_show reservations
  const visibleReservations = useMemo(
    () => reservations.filter(r => r.status !== 'cancelled' && r.status !== 'no_show'),
    [reservations],
  );

  // Count reservations per day (all statuses for the header badge)
  const reservationCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of reservations) {
      const dateStr = r.reservation_date;
      counts.set(dateStr, (counts.get(dateStr) ?? 0) + 1);
    }
    return counts;
  }, [reservations]);

  // Compute week events with lane assignments
  const { events, maxLanes } = useMemo(() => {
    const weekEnd = weekDays[6];
    const weekEvents: WeekEvent[] = [];

    for (const reservation of visibleReservations) {
      const resStart = toDateOnly(reservation.reservation_date);
      const resEnd = toDateOnly(reservation.end_date || reservation.reservation_date);

      // Check if reservation overlaps with this week
      if (resEnd < weekStart || resStart > weekEnd) continue;

      const clampedStart = max([resStart, weekStart]);
      const clampedEnd = min([resEnd, weekEnd]);

      const startCol = differenceInDays(clampedStart, weekStart);
      const span = differenceInDays(clampedEnd, clampedStart) + 1;

      weekEvents.push({
        reservation,
        startCol,
        span,
        lane: 0,
        isStart: isSameDay(clampedStart, resStart),
        isEnd: isSameDay(clampedEnd, resEnd),
      });
    }

    assignLanes(weekEvents);
    const lanes = weekEvents.length > 0 ? Math.max(...weekEvents.map(e => e.lane)) + 1 : 0;

    return { events: weekEvents, maxLanes: lanes };
  }, [weekDays, weekStart, visibleReservations]);

  const minRowHeight = maxLanes * (BAR_HEIGHT + BAR_GAP) + 16;
  const rowHeight = Math.max(minRowHeight, 80);

  return (
    <div className="flex flex-col h-full">
      {/* Single week row: day headers + event area combined */}
      <div
        className="relative grid grid-cols-7 border-b border-border"
        style={{ minHeight: DATE_HEADER_HEIGHT + rowHeight }}
      >
        {/* Day background cells (includes date header + click target) */}
        {weekDays.map((day, idx) => {
          const dateStr = formatDateStr(day);
          const isToday = isSameDay(day, today);
          const isClosed = closedDateSet.has(dateStr);
          const count = reservationCountByDate.get(dateStr) ?? 0;
          const dayName = DAY_NAMES[idx];

          return (
            <div
              key={dateStr}
              className={cn(
                'border-r border-border last:border-r-0 cursor-pointer group relative',
                isClosed && 'bg-red-50',
                isToday && !isClosed && 'bg-primary/5',
                !isToday && !isClosed && 'bg-background',
              )}
              onClick={() => onDayClick(day)}
            >
              {/* Day name + date + count header */}
              <div
                className="flex flex-col items-center justify-center gap-0.5 px-1"
                style={{ height: DATE_HEADER_HEIGHT }}
              >
                <div
                  className={cn(
                    'text-xs font-medium uppercase tracking-wide',
                    isToday && 'text-primary font-bold',
                    isClosed && 'text-red-500',
                    !isToday && !isClosed && 'text-muted-foreground',
                  )}
                >
                  {dayName}
                </div>
                <div
                  className={cn(
                    'text-xl font-bold w-9 h-9 flex items-center justify-center rounded-full',
                    isToday && 'bg-primary text-primary-foreground',
                    !isToday && isClosed && 'text-red-500',
                    !isToday && !isClosed && 'text-foreground',
                  )}
                >
                  {day.getDate()}
                </div>
                <div
                  className={cn(
                    'text-[10px]',
                    isClosed ? 'text-red-400' : 'text-muted-foreground',
                  )}
                >
                  {isClosed ? 'zamknięte' : `${count} rez.`}
                </div>
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

        {/* Event bars overlay — positioned below the date headers */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ top: DATE_HEADER_HEIGHT, height: rowHeight }}
        >
          {events.map((evt) => {
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
                  <span className="text-xs truncate flex items-center gap-1 w-full">
                    {evt.isStart && reservation.start_time && (
                      <span className="font-bold tabular-nums shrink-0">
                        {reservation.start_time.slice(0, 5)}
                      </span>
                    )}
                    {serviceName && (
                      <>
                        <span className="text-muted-foreground/50 shrink-0 hidden sm:inline">|</span>
                        <span className="font-semibold shrink-0 hidden sm:inline">{serviceName}</span>
                      </>
                    )}
                    {!isMobile && reservation.vehicle_plate && (
                      <>
                        <span className="text-muted-foreground/50 shrink-0 hidden md:inline">|</span>
                        <span className="font-semibold shrink-0 hidden md:inline">{reservation.vehicle_plate}</span>
                      </>
                    )}
                    <span className="text-muted-foreground/50 shrink-0 hidden sm:inline">|</span>
                    <span className="truncate">{reservation.customer_name}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
