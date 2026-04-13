import { useMemo, useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  differenceInDays,
  max,
  min,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@shared/ui';
import type { Reservation, Station, ClosedDay, GroupBy } from './types';
import { getStatusColor } from './types';
import { type WeekEvent, toDateOnly, assignLanes, formatDateStr } from './swimLaneUtils';

interface MonthCalendarViewProps {
  reservations: Reservation[];
  stations: Station[];
  currentDate: Date;
  closedDays?: ClosedDay[];
  onDayClick: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
  onAddClick?: (date: Date) => void;
  onDateRangeSelect?: (from: Date, to: Date) => void;
  onReservationMove?: (reservationId: string, newStationId: string, newDate: string) => void;
  groupBy?: GroupBy;
  employees?: { id: string; name: string }[];
  showNotes?: boolean;
  workingHours?: Record<string, { open?: string; close?: string } | null> | null;
  monthRange?: number;
}

function isInRange(day: Date, range: { from: Date; to: Date } | null): boolean {
  if (!range) return false;
  const d = day.getTime();
  return d >= range.from.getTime() && d <= range.to.getTime();
}

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

const BAR_HEIGHT_NORMAL = 22;
const BAR_HEIGHT_NOTES = 58;
const BAR_GAP = 2;
const DATE_HEADER_HEIGHT = 28;

interface WeekRowProps {
  week: Date[];
  visibleWeek: Date[];
  colToVisibleIndex: Map<number, number>;
  weekEvents: WeekEvent[];
  maxLanes: number;
  today: Date;
  monthDate: Date;
  closedDateSet: Set<string>;
  stations: Station[];
  isMobile: boolean;
  showNotes?: boolean;
  highlightRange: { from: Date; to: Date } | null;
  onDayClick: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
  onAddClick?: (date: Date) => void;
  onDayMouseDown: (day: Date) => void;
  onDayMouseEnter: (day: Date) => void;
  onDayMouseUp: (day: Date) => void;
}

const WeekRow = ({
  week,
  visibleWeek,
  colToVisibleIndex,
  weekEvents,
  maxLanes,
  today,
  monthDate,
  closedDateSet,
  stations,
  isMobile,
  showNotes,
  highlightRange,
  onDayClick,
  onReservationClick,
  onAddClick,
  onDayMouseDown,
  onDayMouseEnter,
  onDayMouseUp,
}: WeekRowProps) => {
  const barHeight = showNotes ? BAR_HEIGHT_NOTES : BAR_HEIGHT_NORMAL;
  const minRowHeight = DATE_HEADER_HEIGHT + maxLanes * (barHeight + BAR_GAP) + 8;
  const rowHeight = Math.max(minRowHeight, 80);
  const numCols = visibleWeek.length;
  // Use first day of week for reference (not dependent on month)
  const weekStart = week[0];

  return (
    <div
      className="relative grid border-b border-border last:border-b-0"
      style={{
        minHeight: rowHeight,
        gridTemplateColumns: `repeat(${numCols}, 1fr)`,
      }}
    >
      {/* Day background cells — only visible (working) days */}
      {visibleWeek.map((day) => {
        const dateStr = formatDateStr(day);
        const isToday = isSameDay(day, today);
        const isClosed = closedDateSet.has(dateStr);
        const isThisMonth = isSameMonth(day, monthDate);

        // Days outside this month: empty cell with just background
        if (!isThisMonth) {
          return (
            <div
              key={dateStr}
              className="bg-background"
            />
          );
        }

        return (
          <div
            key={dateStr}
            className={cn(
              'border-r border-border last:border-r-0 group relative cursor-pointer bg-white',
              isClosed && 'bg-red-50',
              !isClosed && isInRange(day, highlightRange) && 'bg-primary/10',
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              onDayMouseDown(day);
            }}
            onMouseEnter={() => onDayMouseEnter(day)}
            onMouseUp={() => onDayMouseUp(day)}
          >
            {/* Date number */}
            <div
              className={cn(
                'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full m-1',
                isToday && 'bg-primary text-primary-foreground font-bold',
                !isToday && 'text-foreground',
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

      {/* Event bars overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ top: DATE_HEADER_HEIGHT }}>
        {weekEvents.map((evt) => {
          const visStartCol = colToVisibleIndex.get(evt.startCol);
          if (visStartCol === undefined) return null;

          // Clamp bar to only columns belonging to this month
          // Find the start day and check if it's in this month
          const startDay = visibleWeek[visStartCol];
          if (!startDay || !isSameMonth(startDay, monthDate)) return null;

          // Calculate max span within this month's days
          let clampedSpan = 0;
          for (let i = visStartCol; i < numCols && i < visStartCol + evt.span; i++) {
            if (visibleWeek[i] && isSameMonth(visibleWeek[i], monthDate)) {
              clampedSpan++;
            } else {
              break;
            }
          }
          if (clampedSpan === 0) return null;

          const maxSpan = numCols - visStartCol;
          const visSpan = Math.min(clampedSpan, maxSpan);
          const leftPct = (visStartCol / numCols) * 100;
          const widthPct = (visSpan / numCols) * 100;
          const topPx = evt.lane * (barHeight + BAR_GAP);

          const reservation = evt.reservation;
          const station = stations.find(s => s.id === reservation.station_id);
          const stationColor = station?.color;
          const serviceName = reservation.service?.shortcut || reservation.service?.name ||
            reservation.services_data?.[0]?.shortcut || reservation.services_data?.[0]?.name || '';

          const colorClasses = getStatusColor(reservation.status, station?.type);

          return (
            <button
              key={`${reservation.id}-${weekStart.getTime()}-${evt.startCol}`}
              type="button"
              className={cn(
                'absolute pointer-events-auto text-left border-l-[3px] overflow-hidden',
                'hover:opacity-80 cursor-pointer transition-opacity',
                showNotes ? 'flex flex-col justify-start px-1.5 py-0.5' : 'flex items-center gap-1 px-1.5',
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
              onClick={(e) => { e.stopPropagation(); onReservationClick(reservation); }}
            >
              {isMobile ? (
                <span className="text-[10px] font-semibold truncate">
                  {serviceName || reservation.customer_name}
                </span>
              ) : (
                <span className={cn('text-[11px] flex items-center gap-1 w-full', showNotes ? 'flex-wrap' : 'truncate')}>
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
              {showNotes && reservation.admin_notes && (
                <span className="text-xs text-foreground/70 truncate w-full leading-tight">
                  {reservation.admin_notes}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface MonthSectionProps {
  monthDate: Date;
  visibleReservations: Reservation[];
  stations: Station[];
  closedDateSet: Set<string>;
  workingDayIndices: Set<number> | null;
  today: Date;
  isMobile: boolean;
  showNotes?: boolean;
  highlightRange: { from: Date; to: Date } | null;
  onDayClick: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
  onAddClick?: (date: Date) => void;
  onDayMouseDown: (day: Date) => void;
  onDayMouseEnter: (day: Date) => void;
  onDayMouseUp: (day: Date) => void;
  dayNamesCount: number;
}

const MonthSection = forwardRef<HTMLDivElement, MonthSectionProps>(({
  monthDate,
  visibleReservations,
  stations,
  closedDateSet,
  workingDayIndices,
  today,
  isMobile,
  showNotes,
  highlightRange,
  onDayClick,
  onReservationClick,
  onAddClick,
  onDayMouseDown,
  onDayMouseEnter,
  onDayMouseUp,
}, ref) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
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
    if (currentWeek.length > 0) result.push(currentWeek);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthDate.getTime()]);

  const weeklyData = useMemo(() => {
    return weeks.map((week) => {
      const weekStart = week[0];
      const weekEnd = week[6];

      const visibleWeek = workingDayIndices
        ? week.filter((_, idx) => workingDayIndices.has(idx))
        : week;

      const colToVisibleIndex = new Map<number, number>();
      visibleWeek.forEach((day, visIdx) => {
        const absIdx = differenceInDays(day, weekStart);
        colToVisibleIndex.set(absIdx, visIdx);
      });

      const events: WeekEvent[] = [];

      for (const reservation of visibleReservations) {
        const resStart = toDateOnly(reservation.reservation_date);
        const resEnd = toDateOnly(reservation.end_date || reservation.reservation_date);

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

      return { week, visibleWeek, colToVisibleIndex, events, maxLanes };
    });
  }, [weeks, visibleReservations, workingDayIndices]);

  return (
    <div ref={ref} data-month={format(monthDate, 'yyyy-MM')}>
      {/* Month label — large bold, scrolls with content, separated from previous month */}
      <div className="px-4 pt-10 pb-4">
        <h2 className="text-[22px] font-bold text-foreground">
          {format(monthDate, 'LLLL yyyy', { locale: pl })}
        </h2>
      </div>

      {weeklyData
        .filter(({ visibleWeek: vw }) => vw.some(d => isSameMonth(d, monthDate)))
        .map(({ week, visibleWeek, colToVisibleIndex, events, maxLanes }, weekIdx) => (
        <WeekRow
          key={weekIdx}
          week={week}
          visibleWeek={visibleWeek}
          colToVisibleIndex={colToVisibleIndex}
          weekEvents={events}
          maxLanes={maxLanes}
          today={today}
          monthDate={monthDate}
          closedDateSet={closedDateSet}
          stations={stations}
          isMobile={isMobile}
          showNotes={showNotes}
          highlightRange={highlightRange}
          onDayClick={onDayClick}
          onReservationClick={onReservationClick}
          onAddClick={onAddClick}
          onDayMouseDown={onDayMouseDown}
          onDayMouseEnter={onDayMouseEnter}
          onDayMouseUp={onDayMouseUp}
        />
      ))}
    </div>
  );
});

MonthSection.displayName = 'MonthSection';

export const MonthCalendarView = ({
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
  monthRange = 1,
}: MonthCalendarViewProps) => {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const isDragging = dragStart !== null;

  const highlightRange = useMemo(() => {
    if (!dragStart || !dragEnd) return null;
    const from = dragStart < dragEnd ? dragStart : dragEnd;
    const to = dragStart < dragEnd ? dragEnd : dragStart;
    return { from, to };
  }, [dragStart, dragEnd]);

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

  const handleDayMouseDown = useCallback((day: Date) => {
    setDragStart(day);
    setDragEnd(day);
  }, []);

  const handleDayMouseEnter = useCallback((day: Date) => {
    if (isDragging) setDragEnd(day);
  }, [isDragging]);

  const handleDayMouseUp = useCallback((day: Date) => {
    if (dragStart && isSameDay(dragStart, day)) {
      onDayClick(day);
    }
    // Range selection is handled by the document mouseup listener above
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, onDayClick]);

  // Determine which day-of-week indices (0=Mon…6=Sun) are working days
  const workingDayIndices = useMemo(() => {
    if (!workingHours) return null;
    const indices = new Set<number>();
    DAY_NAMES.forEach((_, idx) => {
      const dayName = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][idx];
      const wh = workingHours[dayName];
      if (wh != null && wh.open != null && wh.close != null) {
        indices.add(idx);
      }
    });
    return indices;
  }, [workingHours]);

  const visibleDayNames = useMemo(() => {
    if (!workingDayIndices) return DAY_NAMES;
    return DAY_NAMES.filter((_, idx) => workingDayIndices.has(idx));
  }, [workingDayIndices]);

  const closedDateSet = useMemo(() => {
    const set = new Set<string>();
    closedDays.forEach(d => set.add(d.closed_date));
    return set;
  }, [closedDays]);

  // Filter out cancelled/no_show and reservations from hidden stations
  const visibleStationIds = useMemo(() => new Set(stations.map(s => s.id)), [stations]);
  const visibleReservations = useMemo(
    () => reservations.filter(r =>
      r.status !== 'cancelled' && r.status !== 'no_show' &&
      (!r.station_id || visibleStationIds.has(r.station_id))
    ),
    [reservations, visibleStationIds],
  );

  // Build list of months to render: current ± range, plus 2 more into the future
  const months = useMemo(() => {
    const result: Date[] = [];
    for (let i = -monthRange; i <= monthRange + 2; i++) {
      result.push(addMonths(currentDate, i));
    }
    return result;
  }, [currentDate.getTime(), monthRange]);

  // Scroll to current month on mount (instant, no animation)
  useEffect(() => {
    const currentMonthKey = format(currentDate, 'yyyy-MM');
    const el = monthRefs.current.get(currentMonthKey);
    if (el && scrollContainerRef.current) {
      // Use offsetTop relative to scroll container
      scrollContainerRef.current.scrollTop = el.offsetTop;
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = useMemo(() => new Date(), []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Sticky day names header */}
      <div
        className="sticky top-0 z-20 bg-background border-b border-border grid"
        style={{ gridTemplateColumns: `repeat(${visibleDayNames.length}, 1fr)` }}
      >
        {visibleDayNames.map((name) => (
          <div
            key={name}
            className="text-center text-xs font-medium text-muted-foreground py-2 border-r border-border last:border-r-0"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Scrollable months container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {months.map((monthDate) => {
          const monthKey = format(monthDate, 'yyyy-MM');
          return (
            <MonthSection
              key={monthKey}
              ref={(el) => {
                if (el) monthRefs.current.set(monthKey, el);
                else monthRefs.current.delete(monthKey);
              }}
              monthDate={monthDate}
              visibleReservations={visibleReservations}
              stations={stations}
              closedDateSet={closedDateSet}
              workingDayIndices={workingDayIndices}
              today={today}
              isMobile={isMobile}
              showNotes={showNotes}
              highlightRange={highlightRange}
              onDayClick={onDayClick}
              onReservationClick={onReservationClick}
              onAddClick={onAddClick}
              onDayMouseDown={handleDayMouseDown}
              onDayMouseEnter={handleDayMouseEnter}
              onDayMouseUp={handleDayMouseUp}
              dayNamesCount={visibleDayNames.length}
            />
          );
        })}
      </div>
    </div>
  );
};
