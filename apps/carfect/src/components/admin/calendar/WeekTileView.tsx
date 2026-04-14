import { useMemo, useState, useEffect, useRef } from 'react';
import { startOfWeek, addDays, isSameDay, differenceInDays, max, min, format } from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@shared/ui';
import type { Reservation, Station, ClosedDay, GroupBy } from './types';
import { getStatusColor } from './types';
import { type WeekEvent, toDateOnly, assignLanes, formatDateStr } from './swimLaneUtils';
import { buildHolidayMap } from '@/lib/polishHolidays';

interface WeekTileViewProps {
  reservations: Reservation[];
  stations: Station[];
  currentDate: Date;
  closedDays?: ClosedDay[];
  onDayClick: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
  onAddClick?: (date: Date) => void;
  onReservationMove?: (reservationId: string, newStationId: string, newDate: string) => void;
  onDateRangeSelect?: (from: Date, to: Date) => void;
  groupBy?: GroupBy;
  employees?: { id: string; name: string }[];
  showNotes?: boolean;
  workingHours?: Record<string, { open?: string; close?: string } | null> | null;
  activeDateRange?: { from: string; to: string } | null;
}

function isInRange(day: Date, range: { from: Date; to: Date } | null): boolean {
  if (!range) return false;
  const d = day.getTime();
  return d >= range.from.getTime() && d <= range.to.getTime();
}

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

const BAR_HEIGHT_NORMAL = 22;
const BAR_HEIGHT_NOTES = 58;
const BAR_GAP = 3; // px gap between bars
const DATE_HEADER_HEIGHT = 48; // px for the day name + date number header + gap below

export const WeekTileView = ({
  reservations,
  stations,
  currentDate,
  closedDays = [],
  onDayClick,
  onReservationClick,
  onAddClick,
  onDateRangeSelect,
  // onReservationMove is accepted for backward compat but drag-drop is not implemented in bar view
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onReservationMove: _onReservationMove,
  // groupBy and employees are accepted for backward compat
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  groupBy: _groupBy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  employees: _employees,
  showNotes,
  workingHours,
  activeDateRange,
}: WeekTileViewProps) => {
  const isMobile = useIsMobile();
  const barHeight = showNotes ? BAR_HEIGHT_NOTES : BAR_HEIGHT_NORMAL;
  const today = new Date();

  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const isDragging = dragStart !== null;
  // Refs to avoid stale closures in touch handlers
  const dragStartRef = useRef<Date | null>(null);
  const dragEndRef = useRef<Date | null>(null);

  const highlightRange = useMemo(() => {
    if (!dragStart || !dragEnd) return null;
    const from = dragStart < dragEnd ? dragStart : dragEnd;
    const to = dragStart < dragEnd ? dragEnd : dragStart;
    return { from, to };
  }, [dragStart, dragEnd]);

  // displayRange: drag highlight takes priority; falls back to activeDateRange
  const displayRange = useMemo(() => {
    if (highlightRange) return highlightRange;
    if (activeDateRange) {
      return {
        from: toDateOnly(activeDateRange.from),
        to: toDateOnly(activeDateRange.to),
      };
    }
    return null;
  }, [highlightRange, activeDateRange]);

  useEffect(() => {
    if (!isDragging) return;
    const handleUp = () => {
      if (dragStart && dragEnd && !isSameDay(dragStart, dragEnd)) {
        const from = dragStart < dragEnd ? dragStart : dragEnd;
        const to = dragStart < dragEnd ? dragEnd : dragStart;
        onDateRangeSelect?.(from, to);
      }
      setDragStart(null);
      setDragEnd(null);
    };
    document.addEventListener('mouseup', handleUp);
    return () => document.removeEventListener('mouseup', handleUp);
  }, [isDragging, dragStart, dragEnd, onDateRangeSelect]);

  const closedDateSet = useMemo(() => {
    const set = new Set<string>();
    closedDays.forEach((d) => set.add(d.closed_date));
    return set;
  }, [closedDays]);

  const holidayMap = useMemo(() => {
    const year = currentDate.getFullYear();
    return buildHolidayMap([year]);
  }, [currentDate]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartTime = weekStart.getTime();

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(weekStartTime), i));
  }, [weekStartTime]);

  // Determine which days are working days; if no workingHours provided, show all 7
  const visibleDays = useMemo(() => {
    if (!workingHours) return weekDays;
    return weekDays.filter((day) => {
      const dayName = format(day, 'EEEE').toLowerCase();
      const wh = workingHours[dayName];
      return wh != null && wh.open != null && wh.close != null;
    });
  }, [weekDays, workingHours]);

  // Map from absolute week column (0-6) to visible column index
  const colToVisibleIndex = useMemo(() => {
    const map = new Map<number, number>();
    visibleDays.forEach((day, visIdx) => {
      const absIdx = differenceInDays(day, weekDays[0]);
      map.set(absIdx, visIdx);
    });
    return map;
  }, [visibleDays, weekDays]);

  // Filter out cancelled/no_show and reservations from hidden stations
  const visibleStationIds = useMemo(() => new Set(stations.map((s) => s.id)), [stations]);
  const visibleReservations = useMemo(
    () =>
      reservations.filter(
        (r) =>
          r.status !== 'cancelled' &&
          r.status !== 'no_show' &&
          (!r.station_id || visibleStationIds.has(r.station_id)),
      ),
    [reservations, visibleStationIds],
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
    const lanes = weekEvents.length > 0 ? Math.max(...weekEvents.map((e) => e.lane)) + 1 : 0;

    return { events: weekEvents, maxLanes: lanes };
  }, [weekDays, weekStart, visibleReservations]);

  const minRowHeight = maxLanes * (barHeight + BAR_GAP) + 16;
  const rowHeight = Math.max(minRowHeight, 80);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Sticky day name headers */}
      <div
        className="sticky top-0 z-20 bg-background grid px-2 border-b border-border/50"
        style={{ gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)` }}
      >
        {visibleDays.map((day, i) => {
          const absIdx = differenceInDays(day, weekDays[0]);
          return (
            <div key={i} className="text-center py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {DAY_NAMES[absIdx]}
            </div>
          );
        })}
      </div>

      {/* Single week row: day headers + event area combined */}
      <div
        className="relative grid gap-1.5 px-2 pt-2"
        style={{
          minHeight: DATE_HEADER_HEIGHT + rowHeight,
          gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)`,
        }}
        onTouchMove={isDragging ? (e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const el = document.elementFromPoint(touch.clientX, touch.clientY);
          const dateAttr = el?.closest('[data-date]')?.getAttribute('data-date');
          if (dateAttr) {
            const d = toDateOnly(dateAttr);
            dragEndRef.current = d;
            setDragEnd(d);
          }
        } : undefined}
      >
        {/* Day background cells (includes date header + click target) */}
        {visibleDays.map((day) => {
          const dateStr = formatDateStr(day);
          const isToday = isSameDay(day, today);
          const isClosed = closedDateSet.has(dateStr);
          const holidayName = holidayMap.get(dateStr);
          const isHoliday = !!holidayName;
          const count = reservationCountByDate.get(dateStr) ?? 0;

          return (
            <div
              key={dateStr}
              data-date={dateStr}
              className={cn(
                'rounded-lg cursor-pointer group relative bg-white border border-border/60 hover:border-border transition-colors overflow-hidden',
                isClosed && 'bg-red-50',
                !isClosed && isInRange(day, displayRange) && 'bg-primary/5 !border-primary/40',
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                setDragStart(day);
                setDragEnd(day);
              }}
              onMouseEnter={() => {
                if (isDragging) setDragEnd(day);
              }}
              onMouseUp={() => {
                // Single-day click only — range handled by document mouseup
                if (dragStart && isSameDay(dragStart, day)) {
                  setDragStart(null);
                  setDragEnd(null);
                  onDayClick(day);
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                dragStartRef.current = day;
                dragEndRef.current = day;
                setDragStart(day);
                setDragEnd(day);
              }}
              onTouchEnd={() => {
                const start = dragStartRef.current;
                const end = dragEndRef.current;
                if (start && end && !isSameDay(start, end)) {
                  const from = start < end ? start : end;
                  const to = start < end ? end : start;
                  onDateRangeSelect?.(from, to);
                } else if (start) {
                  onDayClick(start);
                }
                dragStartRef.current = null;
                dragEndRef.current = null;
                setDragStart(null);
                setDragEnd(null);
              }}
            >
              {/* Day name + date header */}
              <div
                className="p-1.5 flex items-center gap-1.5 overflow-hidden min-w-0"
                style={{ height: DATE_HEADER_HEIGHT }}
              >
                <div
                  className={cn(
                    'text-base font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0',
                    isToday && !isHoliday && 'bg-primary text-primary-foreground',
                    isHoliday && 'bg-red-500 text-white',
                    !isToday && !isHoliday && 'text-foreground',
                  )}
                >
                  {day.getDate()}
                </div>
                {isHoliday ? (
                  <span className="text-xs font-semibold text-red-500 truncate">{holidayName}</span>
                ) : (
                  <>
                    {count > 0 && !isClosed && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {count} rez.
                      </span>
                    )}
                    {isClosed && (
                      <span className="text-[10px] text-red-400 shrink-0">zamknięte</span>
                    )}
                  </>
                )}
              </div>

              {/* Add button on hover */}
              {onAddClick && (
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddClick(day);
                  }}
                  className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-semibold flex items-center gap-0.5 shadow-sm"
                  tabIndex={-1}
                >
                  <Plus className="w-3 h-3" />
                  Dodaj
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
            const numCols = visibleDays.length;
            const visStartCol = colToVisibleIndex.get(evt.startCol);
            // Skip bars that start on a hidden (non-working) day
            if (visStartCol === undefined) return null;
            // Clamp span to visible columns from visStartCol
            const maxSpan = numCols - visStartCol;
            const visSpan = Math.min(evt.span, maxSpan);
            const leftPct = (visStartCol / numCols) * 100;
            const widthPct = (visSpan / numCols) * 100;
            const topPx = evt.lane * (barHeight + BAR_GAP);

            const reservation = evt.reservation;
            const station = stations.find((s) => s.id === reservation.station_id);
            const stationColor = station?.color;
            const serviceName =
              reservation.service?.shortcut ||
              reservation.service?.name ||
              reservation.services_data?.[0]?.shortcut ||
              reservation.services_data?.[0]?.name ||
              '';

            const colorClasses = getStatusColor(reservation.status, station?.type);

            return (
              <button
                key={`${reservation.id}-${evt.startCol}`}
                type="button"
                className={cn(
                  'absolute pointer-events-auto text-left border-l-[3px] overflow-hidden',
                  'hover:opacity-80 cursor-pointer transition-opacity',
                  showNotes
                    ? 'flex flex-col justify-start px-1.5 py-0.5'
                    : 'flex items-center gap-1 px-1.5',
                  colorClasses,
                  '!text-foreground',
                  evt.isStart && evt.isEnd && 'rounded',
                  evt.isStart && !evt.isEnd && 'rounded-l',
                  !evt.isStart && evt.isEnd && 'rounded-r',
                  !evt.isStart && !evt.isEnd && 'rounded-none',
                )}
                style={{
                  left: `calc(${leftPct}% + 2px)`,
                  width: `calc(${widthPct}% - 4px)`,
                  top: topPx,
                  height: barHeight,
                  borderLeftColor: stationColor || undefined,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onReservationClick(reservation);
                }}
              >
                {isMobile ? (
                  <span className="text-[10px] flex items-center gap-0.5 w-full truncate">
                    {evt.isStart && reservation.start_time && (
                      <span className="font-bold tabular-nums shrink-0">
                        {reservation.start_time.slice(0, 5)}
                      </span>
                    )}
                    {serviceName && (
                      <span className="font-semibold shrink-0">{serviceName}</span>
                    )}
                    <span className="truncate">{reservation.customer_name}</span>
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[11px] flex items-center gap-1 w-full',
                      showNotes ? 'flex-wrap' : 'truncate',
                    )}
                  >
                    {evt.isStart && reservation.start_time && (
                      <span className="font-bold tabular-nums shrink-0">
                        {reservation.start_time.slice(0, 5)}
                      </span>
                    )}
                    {serviceName && (
                      <>
                        <span className="text-muted-foreground/50 shrink-0 hidden sm:inline">
                          |
                        </span>
                        <span className="font-semibold shrink-0 hidden sm:inline">
                          {serviceName}
                        </span>
                      </>
                    )}
                    {!isMobile && reservation.vehicle_plate && (
                      <>
                        <span className="text-muted-foreground/50 shrink-0 hidden md:inline">
                          |
                        </span>
                        <span className="font-semibold shrink-0 hidden md:inline">
                          {reservation.vehicle_plate}
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground/50 shrink-0 hidden sm:inline">|</span>
                    <span className="truncate">{reservation.customer_name}</span>
                  </span>
                )}
                {showNotes && reservation.admin_notes && (
                  <span className="text-[11px] text-foreground/70 truncate w-full leading-tight">
                    {reservation.admin_notes}
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
