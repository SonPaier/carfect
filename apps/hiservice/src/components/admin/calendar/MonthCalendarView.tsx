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
import { useIsMobile } from '@/hooks/use-mobile';
import type { CalendarItem, CalendarColumn } from '../AdminCalendar';
import { getStatusColor } from './statusColors';
import { type WeekEvent, toDateOnly, assignLanes, formatDateStr } from './swimLaneUtils';
import { useDragCalendarItem } from './useDragCalendarItem';
import { buildHolidayMap } from '@/lib/polishHolidays';

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

/** Convert hex color to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface MonthCalendarViewProps {
  items: CalendarItem[];
  columns: CalendarColumn[];
  currentDate: Date;
  onDayClick: (date: Date) => void;
  onItemClick: (item: CalendarItem) => void;
  onAddClick?: (date: Date) => void;
  onDateRangeSelect?: (from: Date, to: Date) => void;
  onItemMove?: (itemId: string, newColumnId: string, newDate: string) => void;
  showNotes?: boolean;
  workingHours?: Record<string, { open?: string; close?: string } | null> | null;
  monthRange?: number;
  onLoadMore?: (direction: 'past' | 'future') => void;
}

function isInRange(day: Date, range: { from: Date; to: Date } | null): boolean {
  if (!range) return false;
  const d = day.getTime();
  return d >= range.from.getTime() && d <= range.to.getTime();
}

const BAR_HEIGHT_NORMAL = 22;
const BAR_HEIGHT_NOTES = 58;
const BAR_GAP = 3;
const DATE_HEADER_HEIGHT = 38;

interface WeekRowProps {
  week: Date[];
  visibleWeek: Date[];
  colToVisibleIndex: Map<number, number>;
  weekEvents: WeekEvent[];
  maxLanes: number;
  today: Date;
  monthDate: Date;
  closedDateSet: Set<string>;
  columns: CalendarColumn[];
  isMobile: boolean;
  showNotes?: boolean;
  highlightRange: { from: Date; to: Date } | null;
  holidayMap: Map<string, string>;
  onDayClick: (date: Date) => void;
  onItemClick: (item: CalendarItem) => void;
  onAddClick?: (date: Date) => void;
  onDayMouseDown: (day: Date) => void;
  onDayMouseEnter: (day: Date) => void;
  onDayMouseUp: (day: Date) => void;
  onDayTouchStart?: (day: Date) => void;
  onDayTouchEnd?: () => void;
  drag?: ReturnType<typeof useDragCalendarItem>;
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
  columns,
  isMobile,
  showNotes,
  highlightRange,
  holidayMap,
  onDayClick: _onDayClick,
  onItemClick,
  onAddClick,
  onDayMouseDown,
  onDayMouseEnter,
  onDayMouseUp,
  onDayTouchStart,
  onDayTouchEnd,
  drag,
}: WeekRowProps) => {
  const barHeight = showNotes ? BAR_HEIGHT_NOTES : BAR_HEIGHT_NORMAL;
  const minRowHeight = DATE_HEADER_HEIGHT + maxLanes * (barHeight + BAR_GAP) + 8;
  const rowHeight = Math.max(minRowHeight, 80);
  const numCols = visibleWeek.length;
  // Use first day of week for reference (not dependent on month)
  const weekStart = week[0];

  return (
    <div
      className="relative grid gap-1.5 px-2 mb-1.5"
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
        const holidayName = holidayMap.get(dateStr);
        const isHoliday = !!holidayName;

        // Days outside this month: empty cell with just background
        if (!isThisMonth) {
          return <div key={dateStr} className="bg-background" />;
        }

        return (
          <div
            key={dateStr}
            data-date={dateStr}
            className={cn(
              'rounded-lg group relative cursor-pointer bg-white border border-border/60 hover:border-border transition-colors overflow-hidden',
              isClosed && 'bg-red-50',
              !isClosed && isInRange(day, highlightRange) && 'bg-primary/5 !border-primary/40',
              drag?.dragOverDate === dateStr && 'ring-2 ring-primary/50 bg-primary/5',
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              onDayMouseDown(day);
            }}
            onMouseEnter={() => onDayMouseEnter(day)}
            onMouseUp={() => onDayMouseUp(day)}
            onDragOver={drag ? (e) => drag.onDragOver(e, dateStr) : undefined}
            onDragLeave={drag ? drag.onDragLeave : undefined}
            onDrop={drag ? (e) => drag.onDrop(e, dateStr) : undefined}
            onTouchStart={(e) => {
              e.preventDefault();
              onDayTouchStart?.(day);
            }}
            onTouchEnd={() => onDayTouchEnd?.()}
          >
            {/* Date number + holiday label */}
            <div className="p-1.5 flex items-center gap-1.5 overflow-hidden min-w-0">
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
              {isHoliday && (
                <span className="text-xs font-semibold text-red-500 truncate">{holidayName}</span>
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
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 shadow-sm hover:bg-primary/90"
                tabIndex={-1}
              >
                <Plus className="w-3.5 h-3.5" />
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
          const startDay = visibleWeek[visStartCol];
          // If bar starts on out-of-month day, find first in-month column
          let adjustedStartCol = visStartCol;
          if (startDay && !isSameMonth(startDay, monthDate)) {
            let found = false;
            for (let i = visStartCol + 1; i < numCols; i++) {
              if (visibleWeek[i] && isSameMonth(visibleWeek[i], monthDate)) {
                adjustedStartCol = i;
                found = true;
                break;
              }
            }
            if (!found) return null; // entire bar is outside this month
          } else if (!startDay) {
            return null;
          }

          // Recalculate span from adjusted start
          let clampedSpan = 0;
          const remainingSpan = evt.span - (adjustedStartCol - visStartCol);
          for (let i = adjustedStartCol; i < numCols && i < adjustedStartCol + remainingSpan; i++) {
            if (visibleWeek[i] && isSameMonth(visibleWeek[i], monthDate)) clampedSpan++;
            else break;
          }
          if (clampedSpan === 0) return null;

          const leftPct = (adjustedStartCol / numCols) * 100;
          const widthPct = (clampedSpan / numCols) * 100;
          const topPx = evt.lane * (barHeight + BAR_GAP);

          const item = evt.item;
          const column = columns.find((c) => c.id === item.column_id);
          const columnColor = column?.color || undefined;
          const titleText = item.title || item.customer_name || '';

          const colorClasses = getStatusColor(item.status);

          return (
            <button
              key={`${item.id}-${weekStart.getTime()}-${evt.startCol}`}
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
                borderLeftColor: columnColor,
                // Subtle column tint on the bar background when column has a color
                boxShadow: columnColor ? `inset 0 0 0 9999px ${hexToRgba(columnColor, 0.08)}` : undefined,
              }}
              draggable={!!drag}
              onDragStart={drag ? (e) => drag.onDragStart(e, item) : undefined}
              onDragEnd={drag?.onDragEnd}
              onClick={(e) => {
                e.stopPropagation();
                onItemClick(item);
              }}
            >
              {isMobile ? (
                <span className="text-[10px] font-semibold truncate">
                  {titleText || item.customer_name}
                </span>
              ) : (
                <span
                  className={cn(
                    'text-[11px] flex items-center gap-1 w-full',
                    showNotes ? 'flex-wrap' : 'truncate',
                  )}
                >
                  {evt.isStart && item.start_time && (
                    <span className="font-bold tabular-nums shrink-0">
                      {item.start_time.slice(0, 5)}
                    </span>
                  )}
                  {titleText && (
                    <>
                      <span className="text-muted-foreground/50 shrink-0 hidden sm:inline">|</span>
                      <span className="font-semibold shrink-0 hidden sm:inline truncate">
                        {titleText}
                      </span>
                    </>
                  )}
                  {item.customer_name && titleText !== item.customer_name && (
                    <>
                      <span className="text-muted-foreground/50 shrink-0 hidden sm:inline">|</span>
                      <span className="truncate">{item.customer_name}</span>
                    </>
                  )}
                </span>
              )}
              {showNotes && item.admin_notes && (
                <span className="text-xs text-foreground/70 truncate w-full leading-tight">
                  {item.admin_notes}
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
  visibleItems: CalendarItem[];
  columns: CalendarColumn[];
  closedDateSet: Set<string>;
  workingDayIndices: Set<number> | null;
  today: Date;
  isMobile: boolean;
  showNotes?: boolean;
  highlightRange: { from: Date; to: Date } | null;
  holidayMap: Map<string, string>;
  onDayClick: (date: Date) => void;
  onItemClick: (item: CalendarItem) => void;
  onAddClick?: (date: Date) => void;
  onDayMouseDown: (day: Date) => void;
  onDayMouseEnter: (day: Date) => void;
  onDayMouseUp: (day: Date) => void;
  onDayTouchStart?: (day: Date) => void;
  onDayTouchEnd?: () => void;
  drag?: ReturnType<typeof useDragCalendarItem>;
}

const MonthSection = forwardRef<HTMLDivElement, MonthSectionProps>(
  (
    {
      monthDate,
      visibleItems,
      columns,
      closedDateSet,
      workingDayIndices,
      today,
      isMobile,
      showNotes,
      highlightRange,
      holidayMap,
      onDayClick,
      onItemClick,
      onAddClick,
      onDayMouseDown,
      onDayMouseEnter,
      onDayMouseUp,
      onDayTouchStart,
      onDayTouchEnd,
      drag,
    },
    ref,
  ) => {
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

        for (const item of visibleItems) {
          const itStart = toDateOnly(item.item_date);
          const itEnd = toDateOnly(item.end_date || item.item_date);

          if (itEnd < weekStart || itStart > weekEnd) continue;

          const clampedStart = max([itStart, weekStart]);
          const clampedEnd = min([itEnd, weekEnd]);

          const startCol = differenceInDays(clampedStart, weekStart);
          const span = differenceInDays(clampedEnd, clampedStart) + 1;

          events.push({
            item,
            startCol,
            span,
            lane: 0,
            isStart: isSameDay(clampedStart, itStart),
            isEnd: isSameDay(clampedEnd, itEnd),
          });
        }

        assignLanes(events);
        const maxLanes = events.length > 0 ? Math.max(...events.map((e) => e.lane)) + 1 : 0;

        return { week, visibleWeek, colToVisibleIndex, events, maxLanes };
      });
    }, [weeks, visibleItems, workingDayIndices]);

    return (
      <div ref={ref} data-month={format(monthDate, 'yyyy-MM')}>
        {/* Month label — large bold, scrolls with content, separated from previous month */}
        <div className="px-4 pt-10 pb-4">
          <h2 className="text-[25px] font-bold text-foreground">
            {format(monthDate, 'LLLL yyyy', { locale: pl })}
          </h2>
        </div>

        {weeklyData
          .filter(({ week: w, visibleWeek: vw }) =>
            vw.length > 0 && w.some((d) => isSameMonth(d, monthDate)),
          )
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
              columns={columns}
              isMobile={isMobile}
              showNotes={showNotes}
              highlightRange={highlightRange}
              holidayMap={holidayMap}
              onDayClick={onDayClick}
              onItemClick={onItemClick}
              onAddClick={onAddClick}
              onDayMouseDown={onDayMouseDown}
              onDayMouseEnter={onDayMouseEnter}
              onDayMouseUp={onDayMouseUp}
              onDayTouchStart={onDayTouchStart}
              onDayTouchEnd={onDayTouchEnd}
              drag={drag}
            />
          ))}
      </div>
    );
  },
);

MonthSection.displayName = 'MonthSection';

export const MonthCalendarView = ({
  items,
  columns,
  currentDate,
  onDayClick,
  onItemClick,
  onAddClick,
  onDateRangeSelect,
  onItemMove,
  showNotes,
  workingHours,
  monthRange = 1,
  onLoadMore,
}: MonthCalendarViewProps) => {
  const drag = useDragCalendarItem(items, onItemMove);
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const isDragging = dragStart !== null;
  const dragStartRef = useRef<Date | null>(null);
  const dragEndRef = useRef<Date | null>(null);

  const highlightRange = useMemo(() => {
    if (dragStart && dragEnd) {
      const from = dragStart < dragEnd ? dragStart : dragEnd;
      const to = dragStart < dragEnd ? dragEnd : dragStart;
      return { from, to };
    }
    return null;
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

  const handleDayMouseEnter = useCallback(
    (day: Date) => {
      if (isDragging) setDragEnd(day);
    },
    [isDragging],
  );

  const handleDayMouseUp = useCallback(
    (day: Date) => {
      // Single-day click: handle here and reset
      if (dragStart && isSameDay(dragStart, day)) {
        setDragStart(null);
        setDragEnd(null);
        onDayClick(day);
      }
      // Multi-day range: do NOT reset here — document mouseup handler does it
    },
    [dragStart, onDayClick],
  );

  const handleDayTouchStart = useCallback((day: Date) => {
    dragStartRef.current = day;
    dragEndRef.current = day;
    setDragStart(day);
    setDragEnd(day);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const dateAttr = el?.closest('[data-date]')?.getAttribute('data-date');
    if (dateAttr) {
      const d = toDateOnly(dateAttr);
      dragEndRef.current = d;
      setDragEnd(d);
    }
  }, []);

  const handleDayTouchEnd = useCallback(() => {
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
  }, [onDateRangeSelect, onDayClick]);

  // Determine which day-of-week indices (0=Mon…6=Sun) are working days
  const workingDayIndices = useMemo(() => {
    if (!workingHours) return null;
    const indices = new Set<number>();
    DAY_NAMES.forEach((_, idx) => {
      const dayName = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ][idx];
      const wh = workingHours[dayName];
      if (wh != null && wh.open != null && wh.close != null) {
        indices.add(idx);
      }
    });
    // Fallback: if working hours object exists but no day is configured,
    // show all days rather than rendering an empty grid.
    if (indices.size === 0) return null;
    return indices;
  }, [workingHours]);

  const visibleDayNames = useMemo(() => {
    if (!workingDayIndices) return DAY_NAMES;
    return DAY_NAMES.filter((_, idx) => workingDayIndices.has(idx));
  }, [workingDayIndices]);

  // hiservice has no closedDays concept — keep a stable empty set for future wiring
  const closedDateSet = useMemo(() => new Set<string>(), []);

  // Filter out cancelled items and items from hidden columns
  const visibleColumnIds = useMemo(() => new Set(columns.map((c) => c.id)), [columns]);

  const visibleItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.status !== 'cancelled' &&
          (!i.column_id || visibleColumnIds.has(i.column_id)),
      ),
    [items, visibleColumnIds],
  );

  const [pastMonths, setPastMonths] = useState(monthRange);
  const [futureMonths, setFutureMonths] = useState(monthRange + 5);

  const months = useMemo(() => {
    const result: Date[] = [];
    for (let i = -pastMonths; i <= futureMonths; i++) {
      result.push(addMonths(currentDate, i));
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate.getTime(), pastMonths, futureMonths]);

  // Polish public holidays map
  const holidayMap = useMemo(() => {
    const years = months.map((m) => m.getFullYear());
    const uniqueYears = [...new Set(years)];
    return buildHolidayMap(uniqueYears);
  }, [months]);

  const isLoadingMoreFutureRef = useRef(false);
  const isLoadingMorePastRef = useRef(false);

  // Load more months on scroll near edges
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      // Near bottom — load more future months
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 500) {
        if (!isLoadingMoreFutureRef.current) {
          isLoadingMoreFutureRef.current = true;
          setFutureMonths((prev) => prev + 3);
          onLoadMore?.('future');
          setTimeout(() => {
            isLoadingMoreFutureRef.current = false;
          }, 1000);
        }
      }
      // Near top — load more past months
      if (el.scrollTop < 500) {
        if (!isLoadingMorePastRef.current) {
          isLoadingMorePastRef.current = true;
          setPastMonths((prev) => prev + 3);
          onLoadMore?.('past');
          setTimeout(() => {
            isLoadingMorePastRef.current = false;
          }, 1000);
        }
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [onLoadMore]);

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
        className="sticky top-0 z-20 bg-background grid px-2 border-b border-border/50"
        style={{ gridTemplateColumns: `repeat(${visibleDayNames.length}, 1fr)` }}
      >
        {visibleDayNames.map((name) => (
          <div key={name} className="text-center text-xs font-bold text-foreground py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Scrollable months container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onTouchMove={isDragging ? handleTouchMove : undefined}
      >
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
              visibleItems={visibleItems}
              columns={columns}
              closedDateSet={closedDateSet}
              workingDayIndices={workingDayIndices}
              today={today}
              isMobile={isMobile}
              showNotes={showNotes}
              highlightRange={highlightRange}
              holidayMap={holidayMap}
              onDayClick={onDayClick}
              onItemClick={onItemClick}
              onAddClick={onAddClick}
              onDayMouseDown={handleDayMouseDown}
              onDayMouseEnter={handleDayMouseEnter}
              onDayMouseUp={handleDayMouseUp}
              onDayTouchStart={handleDayTouchStart}
              onDayTouchEnd={handleDayTouchEnd}
              drag={drag}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendarView;
