import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  format,
  addDays,
  subDays,
  isSameDay,
  startOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
  eachDayOfInterval,
  parseISO,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  Clock,
  X,
} from 'lucide-react';
import type { Training } from './AddTrainingDrawer';
import type { Reservation } from '@/types/reservation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { YardVehiclesList, YardVehicle } from './YardVehiclesList';
import SendSmsDialog from './SendSmsDialog';
import { Button } from '@shared/ui';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@shared/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui';
import { MonthCalendarView, WeekTileView, useCalendarViewPreference } from './calendar';
import type { GroupBy } from './calendar';
import { CalendarHeader } from './calendar/CalendarHeader';
import {
  useCalendarWorkingHours,
  parseTime,
  formatTimeSlot,
  getTimeBasedZIndex,
  DEFAULT_START_HOUR,
  DEFAULT_END_HOUR,
  SLOTS_PER_HOUR,
  SLOT_HEIGHT,
  HOUR_HEIGHT,
} from './calendar/useCalendarWorkingHours';
import { useCalendarOverlap } from './calendar/useCalendarOverlap';
import { useCalendarDragDrop } from './calendar/useCalendarDragDrop';
import { useCalendarVisibility } from './calendar/useCalendarVisibility';
import { DayViewGrid } from './calendar/DayViewGrid';
type ViewMode = 'day' | 'week' | 'month';
interface Station {
  id: string;
  name: string;
  type: string;
  color?: string | null;
}
interface Break {
  id: string;
  station_id: string;
  break_date: string;
  start_time: string;
  end_time: string;
  note: string | null;
}
interface ClosedDay {
  id: string;
  closed_date: string;
  reason: string | null;
}
export interface HallVisibleFields {
  customer_name: boolean;
  customer_phone: boolean;
  vehicle_plate: boolean;
  services: boolean;
  admin_notes: boolean;
}

export interface HallAllowedActions {
  add_services: boolean;
  change_time: boolean;
  change_station: boolean;
}

export interface HallConfig {
  visible_fields: HallVisibleFields;
  allowed_actions: HallAllowedActions;
}

interface Employee {
  id: string;
  name: string;
  photo_url: string | null;
}

interface AdminCalendarProps {
  stations: Station[];
  reservations: Reservation[];
  breaks?: Break[];
  closedDays?: ClosedDay[];
  workingHours?: Record<
    string,
    {
      open: string;
      close: string;
    } | null
  > | null;
  onReservationClick?: (reservation: Reservation) => void;
  onAddReservation?: (stationId: string, date: string, time: string) => void;
  onAddBreak?: (stationId: string, date: string, time: string) => void;
  onDeleteBreak?: (breakId: string) => void;
  onToggleClosedDay?: (date: string) => void;
  onReservationMove?: (
    reservationId: string,
    newStationId: string,
    newDate: string,
    newTime?: string,
  ) => void;
  onConfirmReservation?: (reservationId: string) => void;
  onYardVehicleDrop?: (vehicle: YardVehicle, stationId: string, date: string, time: string) => void;
  onDateChange?: (date: Date) => void; // Callback when calendar date changes
  // Hall view props
  allowedViews?: ViewMode[];
  readOnly?: boolean;
  showStationFilter?: boolean;
  showWeekView?: boolean;
  hallMode?: boolean; // Simplified view for hall workers
  hallConfig?: HallConfig; // Configuration for hall view (visible fields, allowed actions)
  hallDataVisible?: boolean; // Toggle for data visibility in hall mode
  onToggleHallDataVisibility?: () => void; // Callback when eye icon is clicked
  instanceId?: string; // Instance ID for yard vehicles
  yardVehicleCount?: number; // Count of vehicles on yard for badge
  selectedReservationId?: string | null; // ID of currently selected reservation (for drawer highlight)
  /** Slot preview for live highlight when creating reservation */
  slotPreview?: {
    date: string;
    startTime: string;
    endTime: string;
    stationId: string;
  } | null;
  /** Whether more reservations are being loaded */
  isLoadingMore?: boolean;
  /** Show protocols button in hall mode */
  showProtocolsButton?: boolean;
  /** Callback when protocols button is clicked */
  onProtocolsClick?: () => void;
  /** Employee assignment feature props */
  employees?: Employee[];
  stationEmployeesMap?: Map<string, string[]>;
  showEmployeesOnStations?: boolean;
  showEmployeesOnReservations?: boolean;
  /** Trainings feature props */
  trainings?: Training[];
  onTrainingClick?: (training: Training) => void;
  trainingsEnabled?: boolean;
  /** Force compact column mode (no min-width) — used when inline drawer is open */
  forceCompact?: boolean;
}


const getStatusColor = (status: string, stationType?: string) => {
  // PPF reservations get special colors
  if (stationType === 'ppf') {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-200 border-emerald-400 text-emerald-900';
      case 'pending':
        return 'bg-amber-100 border-amber-300 text-amber-900';
      case 'in_progress':
        // Pomarańczowy - w trakcie realizacji
        return 'bg-orange-200 border-orange-400 text-orange-900';
      case 'completed':
        return 'bg-slate-200 border-slate-400 text-slate-700';
      case 'cancelled':
        return 'bg-slate-100/40 border-slate-200 text-slate-500 line-through opacity-60';
      case 'change_requested':
        // Jasny czerwony - prośba o przeniesienie
        return 'bg-red-200 border-red-400 text-red-900';
      default:
        return 'bg-amber-100 border-amber-300 text-amber-900';
    }
  }

  // Pastel colors for regular stations
  switch (status) {
    case 'pending':
      // Żółty pastelowy - oczekuje na potwierdzenie
      return 'bg-amber-100 border-amber-300 text-amber-900';
    case 'confirmed':
      // Zielony pastelowy - potwierdzona
      return 'bg-emerald-200 border-emerald-400 text-emerald-900';
    case 'in_progress':
      // Pomarańczowy - w trakcie realizacji
      return 'bg-orange-200 border-orange-400 text-orange-900';
    case 'completed':
      // Szary - zakończony
      return 'bg-slate-200 border-slate-400 text-slate-700';
    case 'cancelled':
      // Czerwony - anulowana
      return 'bg-red-100/60 border-red-300 text-red-700 line-through opacity-60';
    case 'change_requested':
      // Jasny czerwony - prośba o przeniesienie
      return 'bg-red-200 border-red-400 text-red-900';
    default:
      return 'bg-amber-100 border-amber-300 text-amber-900';
  }
};
const AdminCalendar = ({
  stations,
  reservations,
  breaks = [],
  closedDays = [],
  workingHours,
  onReservationClick,
  onAddReservation,
  onAddBreak,
  onDeleteBreak,
  onToggleClosedDay,
  onReservationMove,
  onConfirmReservation,
  onYardVehicleDrop,
  onDateChange,
  allowedViews = ['day', 'week', 'month'],
  readOnly = false,
  showStationFilter = true,
  showWeekView = true,
  hallMode = false,
  hallConfig,
  hallDataVisible = true,
  onToggleHallDataVisibility,
  instanceId,
  yardVehicleCount = 0,
  selectedReservationId,
  slotPreview,
  isLoadingMore = false,
  showProtocolsButton = false,
  onProtocolsClick,
  employees = [],
  stationEmployeesMap,
  showEmployeesOnStations = false,
  showEmployeesOnReservations = false,
  trainings = [],
  onTrainingClick,
  trainingsEnabled = false,
  forceCompact = false,
}: AdminCalendarProps) => {
  const { t } = useTranslation();
  const {
    getHoursForDate,
    getWorkingHoursForDate,
    isWorkingDay,
    findNextWorkingDay,
    getDisplayTimesForDate,
  } = useCalendarWorkingHours({ workingHours: workingHours ?? null });
  const [currentDate, setCurrentDate] = useState(() => {
    const saved = localStorage.getItem('admin-calendar-date');
    if (saved) {
      try {
        const parsed = new Date(saved);
        if (!isNaN(parsed.getTime())) return parsed;
      } catch {
        /* invalid date in localStorage */
      }
    }
    return new Date();
  });
  const { defaultView, saveDefaultView } = useCalendarViewPreference();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [groupingMode, setGroupingMode] = useState<GroupBy>(() => {
    const saved = localStorage.getItem('calendar-grouping-mode');
    return (saved === 'station' || saved === 'employee') ? saved : 'station';
  });
  // Per-view station visibility + notes toggle
  const {
    hiddenStationIds,
    hasHiddenStations,
    visibleStations,
    toggleStationVisibility,
    showAllStations,
    showNotesInBars,
    toggleShowNotesInBars,
  } = useCalendarVisibility({ viewMode, stations });
  // Drag & drop state + handlers extracted to hook
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [weekViewStationId, setWeekViewStationId] = useState<string | null>(null);
  const [placDrawerOpen, setPlacDrawerOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsDialogData, setSmsDialogData] = useState<{
    phone: string;
    customerName: string;
  } | null>(null);
  const [closeDayDialogOpen, setCloseDayDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompact, setIsCompact] = useState(() => {
    return localStorage.getItem('calendar-compact-mode') === 'true';
  });
  const isMobile = useIsMobile();
  const effectiveCompact = isCompact || forceCompact;

  // Helper: mix station color 5% with 95% white for cell background
  const getStationCellBg = (color: string): string => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const mixR = Math.round(r * 0.05 + 255 * 0.95);
    const mixG = Math.round(g * 0.05 + 255 * 0.95);
    const mixB = Math.round(b * 0.05 + 255 * 0.95);
    return `rgb(${mixR}, ${mixG}, ${mixB})`;
  };

  // Toggle compact mode
  const toggleCompact = useCallback(() => {
    setIsCompact((prev) => {
      const next = !prev;
      localStorage.setItem('calendar-compact-mode', String(next));
      return next;
    });
  }, []);


  // Listen for fullscreen changes (e.g., user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  // Stabilize onDateChange callback to prevent unnecessary effect re-runs
  // The parent's callback may recreate on every render, but we only care about currentDate changes
  const onDateChangeRef = useRef(onDateChange);
  onDateChangeRef.current = onDateChange;

  // Notify parent when currentDate changes (using ref to avoid callback in dependencies)
  useEffect(() => {
    onDateChangeRef.current?.(currentDate);
  }, [currentDate]);

  // Refs for synchronized horizontal scroll between headers and grid
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Touch handling for mobile - lock scroll to one axis
  const scrollTouchStartRef = useRef<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const scrollDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);
  const AXIS_LOCK_THRESHOLD = 8;

  // Use native event listeners with {passive: false} to allow preventDefault
  // Re-attach when view/date changes since the DOM element may remount
  useEffect(() => {
    if (!isMobile) return;

    const abortController = new AbortController();

    // Small delay to ensure DOM element is mounted after conditional renders
    const timerId = setTimeout(() => {
      const el = gridScrollRef.current;
      if (!el || abortController.signal.aborted) return;

      const onTouchStart = (e: TouchEvent) => {
        scrollTouchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop,
        };
        scrollDirectionRef.current = null;
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!scrollTouchStartRef.current) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - scrollTouchStartRef.current.x;
        const deltaY = touch.clientY - scrollTouchStartRef.current.y;
        const absDx = Math.abs(deltaX);
        const absDy = Math.abs(deltaY);

        // Lock axis on first significant movement
        if (
          !scrollDirectionRef.current &&
          (absDx > AXIS_LOCK_THRESHOLD || absDy > AXIS_LOCK_THRESHOLD)
        ) {
          scrollDirectionRef.current = absDx > absDy ? 'horizontal' : 'vertical';
        }

        if (scrollDirectionRef.current) {
          e.preventDefault(); // block native diagonal scroll
          if (scrollDirectionRef.current === 'horizontal') {
            el.scrollLeft = scrollTouchStartRef.current.scrollLeft - deltaX;
          } else {
            el.scrollTop = scrollTouchStartRef.current.scrollTop - deltaY;
          }
        }
      };

      const onTouchEnd = () => {
        scrollTouchStartRef.current = null;
        scrollDirectionRef.current = null;
      };

      el.addEventListener('touchstart', onTouchStart, { passive: true, signal: abortController.signal });
      el.addEventListener('touchmove', onTouchMove, { passive: false, signal: abortController.signal });
      el.addEventListener('touchend', onTouchEnd, { passive: true, signal: abortController.signal });
    }, 50);

    return () => {
      clearTimeout(timerId);
      abortController.abort();
    };
  }, [isMobile, currentDate, viewMode]);

  // Sync horizontal scroll between headers and grid
  const handleHeaderScroll = useCallback(() => {
    if (headerScrollRef.current && gridScrollRef.current) {
      gridScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
    }
  }, []);
  const handleGridScroll = useCallback(() => {
    if (headerScrollRef.current && gridScrollRef.current) {
      headerScrollRef.current.scrollLeft = gridScrollRef.current.scrollLeft;
    }
  }, []);

  // Mobile column width calculation helpers
  // Column widths are calculated as percentage of available space (screen width minus time column)
  // 1 column: 100%, 2 columns: 50% each, 3+ columns: 40% each (showing 40+40+20% of third)
  const getMobileColumnStyle = (stationCount: number): React.CSSProperties => {
    if (!isMobile) return {};
    if (stationCount === 1)
      return {
        width: 'calc(100vw - 48px)',
        minWidth: 'calc(100vw - 48px)',
      };
    if (stationCount === 2)
      return {
        width: 'calc((100vw - 48px) / 2)',
        minWidth: 'calc((100vw - 48px) / 2)',
      };
    // 3+ columns: 40% of available width each
    return {
      width: 'calc((100vw - 48px) * 0.4)',
      minWidth: 'calc((100vw - 48px) * 0.4)',
    };
  };
  const getMobileStationsContainerStyle = (stationCount: number): React.CSSProperties => {
    // Only apply fixed widths on mobile for horizontal scrolling
    if (!isMobile) return {};
    if (stationCount <= 2) return {};
    // For 3+ columns on mobile, set total width to allow horizontal scroll
    return {
      width: `calc((100vw - 48px) * 0.4 * ${stationCount})`,
    };
  };

  // Save current date to localStorage
  useEffect(() => {
    localStorage.setItem('admin-calendar-date', format(currentDate, 'yyyy-MM-dd'));
  }, [currentDate]);

  // Set initial view from DB preference
  useEffect(() => {
    if (defaultView === 'week' || defaultView === 'month') {
      setViewMode(defaultView);
    }
  }, [defaultView]);

  const handleViewModeChange = (mode: 'day' | 'week' | 'month') => {
    setViewMode(mode);
    saveDefaultView(mode);
  };

  const handleGroupingModeChange = (mode: GroupBy) => {
    setGroupingMode(mode);
    localStorage.setItem('calendar-grouping-mode', mode);
  };

  // Calculate hours based on working hours for current day
  const {
    hours: HOURS,
    startHour: DAY_START_HOUR,
    closeTime: DAY_CLOSE_TIME,
    workingStartTime: WORKING_START_TIME,
    workingEndTime: WORKING_END_TIME,
    displayStartTime: DISPLAY_START_TIME,
    displayEndTime: DISPLAY_END_TIME,
    startSlotOffset: START_SLOT_OFFSET,
  } = getHoursForDate(currentDate);

  // Drag & drop
  const {
    draggedReservation,
    dragOverStation,
    dragOverSlot,
    dragPreviewStyle,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleSlotDragOver,
    handleDragLeave,
    handleDrop,
  } = useCalendarDragDrop({
    reservations,
    readOnly,
    isMobile,
    displayStartTime: DISPLAY_START_TIME,
    getWorkingHoursForDate,
    onReservationMove,
    onYardVehicleDrop,
  });

  // Long-press handling for mobile
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const LONG_PRESS_DURATION = 500; // ms

  const handleTouchStart = useCallback(
    (stationId: string, hour: number, slotIndex: number, dateStr?: string) => {
      longPressTriggered.current = false;
      longPressTimeout.current = setTimeout(() => {
        longPressTriggered.current = true;
        const time = formatTimeSlot(hour, slotIndex);
        const targetDate = dateStr || format(currentDate, 'yyyy-MM-dd');
        onAddBreak?.(stationId, targetDate, time);
      }, LONG_PRESS_DURATION);
    },
    [currentDate, onAddBreak],
  );
  const handleTouchEnd = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  }, []);
  const handleTouchMove = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  }, []);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      // For day view, skip closed days
      let newDate = subDays(currentDate, 1);
      newDate = findNextWorkingDay(newDate, 'backward');
      setCurrentDate(newDate);
    }
  };
  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      // For day view, skip closed days
      let newDate = addDays(currentDate, 1);
      newDate = findNextWorkingDay(newDate, 'forward');
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setViewMode('day');
  };

  // Get week days for week view
  const weekStart = startOfWeek(currentDate, {
    weekStartsOn: 1,
  }); // Monday
  const weekDays = Array.from(
    {
      length: 7,
    },
    (_, i) => addDays(weekStart, i),
  );
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  const isToday = isSameDay(currentDate, new Date());

  // Check if a date is closed
  const isDateClosed = (dateStr: string) => {
    return closedDays.some((cd) => cd.closed_date === dateStr);
  };
  const currentDateClosed = isDateClosed(currentDateStr);

  // Filter stations based on hidden station IDs
  // visibleStations and hasHiddenStations come from useCalendarVisibility hook

  // Get reservations for a specific date and station (including multi-day reservations)
  const getReservationsForStationAndDate = (stationId: string, dateStr: string) => {
    return reservations.filter((r) => {
      if (r.station_id !== stationId) return false;
      // Exclude cancelled and no_show from calendar view
      if (r.status === 'cancelled' || r.status === 'no_show') return false;

      // Check if date falls within reservation range
      const startDate = r.reservation_date;
      const endDate = r.end_date || r.reservation_date; // Use reservation_date if no end_date

      // dateStr should be >= startDate and <= endDate
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  // Get breaks for a specific date and station
  const getBreaksForStationAndDate = (stationId: string, dateStr: string) => {
    return breaks.filter((b) => b.break_date === dateStr && b.station_id === stationId);
  };

  const { getOverlapInfo, getFreeTimeForStation, formatFreeTime } = useCalendarOverlap({
    reservations,
    breaks,
    getDisplayTimesForDate,
    getWorkingHoursForDate,
    getBreaksForStationAndDate,
    isDateClosed,
    t,
  });

  // Get trainings for a specific date and station (including multi-day trainings)
  const getTrainingsForStationAndDate = (stationId: string, dateStr: string): Training[] => {
    if (!trainingsEnabled) return [];
    return trainings.filter((tr) => {
      if (tr.station_id !== stationId) return false;
      const startDate = tr.start_date;
      const endDate = tr.end_date || tr.start_date;
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  // Get trainings without station for a specific date (shown on first visible station or all)
  const getUnstationedTrainingsForDate = (dateStr: string): Training[] => {
    if (!trainingsEnabled) return [];
    return trainings.filter((tr) => {
      if (tr.station_id) return false;
      const startDate = tr.start_date;
      const endDate = tr.end_date || tr.start_date;
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  // Get all trainings for a station+date (including unstationed ones on first visible station)
  const getAllTrainingsForStationAndDate = (
    stationId: string,
    dateStr: string,
    stationIndex: number,
  ): Training[] => {
    const stationTrainings = getTrainingsForStationAndDate(stationId, dateStr);
    // Show unstationed trainings on first visible station
    const unstationedTrainings = stationIndex === 0 ? getUnstationedTrainingsForDate(dateStr) : [];
    return [...stationTrainings, ...unstationedTrainings];
  };

  const getTrainingStatusColor = (status: string) => {
    return status === 'sold_out'
      ? 'bg-fuchsia-600 border-fuchsia-700 text-white'
      : 'bg-pink-200 border-pink-300 text-pink-900';
  };

  // Get reservations for current day grouped by station (day view)
  const getReservationsForStation = (stationId: string) => {
    return getReservationsForStationAndDate(stationId, currentDateStr);
  };

  // Get breaks for current day grouped by station (day view)
  const getBreaksForStation = (stationId: string) => {
    return getBreaksForStationAndDate(stationId, currentDateStr);
  };

  // Calculate position and height based on time
  // Note: position is relative to DISPLAY_START_TIME (the visible start of calendar)
  const getReservationStyle = (startTime: string, endTime: string, displayStartTime?: number) => {
    const referenceStart = displayStartTime ?? DISPLAY_START_TIME;
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const top = (start - referenceStart) * HOUR_HEIGHT + 1; // +1px offset from top
    const height = (end - start) * HOUR_HEIGHT - 2; // -2px to create 1px gap top and bottom
    return {
      top: `${top}px`,
      height: `${Math.max(height, 28)}px`,
    };
  };

  // Handle click on empty time slot - show context menu or default to reservation
  const handleSlotClick = (
    stationId: string,
    hour: number,
    slotIndex: number,
    dateStr?: string,
  ) => {
    // In read-only mode, do nothing
    if (readOnly) return;

    // Prevent click if long-press was triggered
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    const time = formatTimeSlot(hour, slotIndex);
    const targetDate = dateStr || currentDateStr;
    onAddReservation?.(stationId, targetDate, time);
  };

  // Handle right-click to add break
  const handleSlotContextMenu = (
    e: React.MouseEvent,
    stationId: string,
    hour: number,
    slotIndex: number,
    dateStr?: string,
  ) => {
    e.preventDefault();
    // In read-only mode, do nothing
    if (readOnly) return;
    const time = formatTimeSlot(hour, slotIndex);
    const targetDate = dateStr || currentDateStr;
    onAddBreak?.(stationId, targetDate, time);
  };

  // Current time indicator position (relative to displayStartTime)
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const showCurrentTime =
    isToday && currentHour >= DISPLAY_START_TIME && currentHour <= parseTime(DAY_CLOSE_TIME);
  const currentTimeTop = (currentHour - DISPLAY_START_TIME) * HOUR_HEIGHT;

  // Render station headers for day view (shared between mobile and desktop layouts)
  const renderDayStationHeaders = () => (
    <>
      {/* Time column header - sticky left */}
      <div
        className={cn(
          'w-12 md:w-16 shrink-0 p-1 md:p-2 flex items-center justify-center text-muted-foreground border-r border-border/50 bg-card',
          'sticky left-0 z-50',
        )}
      >
        <Clock className="w-5 h-5" />
      </div>
      {/* Station headers container */}
      <div
        className={cn('flex', !isMobile && 'flex-1')}
        style={getMobileStationsContainerStyle(visibleStations.length)}
      >
        {visibleStations.map((station, idx) => {
          const stationEmployeeIds = stationEmployeesMap?.get(station.id) || [];
          const stationEmployees = stationEmployeeIds
            .map((id) => employees.find((e) => e.id === id))
            .filter((e): e is Employee => !!e);

          return (
            <div
              key={station.id}
              className={cn(
                'p-1 md:p-2 text-center font-semibold text-sm md:text-base shrink-0',
                !isMobile && 'flex-1',
                !isMobile && !effectiveCompact && 'min-w-[220px]',
                !isMobile && effectiveCompact && 'min-w-0',
                idx < visibleStations.length - 1 && 'border-r border-border/50',
              )}
              style={{
                ...(isMobile ? getMobileColumnStyle(visibleStations.length) : {}),
                ...(station.color ? { backgroundColor: station.color } : {}),
              }}
            >
              <div
                className={cn(
                  'text-foreground',
                  isMobile ? 'truncate' : 'whitespace-normal break-words',
                )}
              >
                {station.name}
              </div>
              {showEmployeesOnStations && stationEmployees.length > 0 && (
                <div className="hidden md:flex items-center justify-center gap-1 mt-1 flex-wrap overflow-hidden">
                  {stationEmployees.slice(0, 2).map((emp) => (
                    <span
                      key={emp.id}
                      className="inline-flex items-center py-1.5 text-sm font-semibold rounded-md leading-none text-secondary bg-[#0f1729]/0 px-[6px]"
                    >
                      {emp.name.split(' ')[0]}
                    </span>
                  ))}
                  {stationEmployees.length > 2 && (
                    <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold bg-foreground text-background rounded-md leading-none">
                      +{stationEmployees.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div data-testid="admin-calendar" className="flex flex-col h-full bg-card rounded-xl relative">
      {/* Calendar Header - sticky */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        groupingMode={groupingMode}
        weekStart={weekStart}
        isMobile={isMobile}
        isToday={isToday}
        currentDateClosed={currentDateClosed}
        hallMode={hallMode}
        readOnly={readOnly}
        hallDataVisible={hallDataVisible}
        allowedViews={allowedViews}
        showWeekView={showWeekView}
        showStationFilter={showStationFilter}
        hasHiddenStations={hasHiddenStations}
        isFullscreen={isFullscreen}
        isCompact={isCompact}
        isLoadingMore={isLoadingMore}
        stations={stations}
        hiddenStationIds={hiddenStationIds}
        datePickerOpen={datePickerOpen}
        closeDayDialogOpen={closeDayDialogOpen}
        showProtocolsButton={showProtocolsButton}
        yardVehicleCount={yardVehicleCount}
        onToggleClosedDay={onToggleClosedDay}
        onToggleHallDataVisibility={onToggleHallDataVisibility}
        onProtocolsClick={onProtocolsClick}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onDateSelect={setCurrentDate}
        onViewModeChange={handleViewModeChange}
        onGroupingModeChange={handleGroupingModeChange}
        onDatePickerOpenChange={setDatePickerOpen}
        onCloseDayDialogOpenChange={setCloseDayDialogOpen}
        onToggleStation={toggleStationVisibility}
        onShowAllStations={showAllStations}
        onToggleCompact={toggleCompact}
        onToggleFullscreen={toggleFullscreen}
        onPlacDrawerOpen={() => setPlacDrawerOpen(true)}
        onSaveDefaultView={saveDefaultView}
        showNotesInBars={showNotesInBars}
        onToggleShowNotesInBars={toggleShowNotesInBars}
      />

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <DayViewGrid
          currentDate={currentDate}
          currentDateStr={currentDateStr}
          isToday={isToday}
          currentDateClosed={currentDateClosed}
          isPastDay={(() => {
            const currentDateObj = new Date(currentDateStr);
            const todayDate = new Date(format(new Date(), 'yyyy-MM-dd'));
            return currentDateObj < todayDate;
          })()}
          hours={HOURS}
          startSlotOffset={START_SLOT_OFFSET}
          displayStartTime={DISPLAY_START_TIME}
          displayEndTime={DISPLAY_END_TIME}
          workingStartTime={WORKING_START_TIME}
          workingEndTime={WORKING_END_TIME}
          dayCloseTime={DAY_CLOSE_TIME}
          visibleStations={visibleStations}
          isMobile={isMobile}
          effectiveCompact={effectiveCompact}
          hallMode={hallMode}
          hallConfig={hallConfig}
          hallDataVisible={hallDataVisible}
          employees={employees}
          showEmployeesOnReservations={showEmployeesOnReservations}
          draggedReservation={draggedReservation}
          dragOverStation={dragOverStation}
          dragOverSlot={dragOverSlot}
          dragPreviewStyle={dragPreviewStyle}
          slotPreview={slotPreview}
          selectedReservationId={selectedReservationId}
          headerScrollRef={headerScrollRef}
          gridScrollRef={gridScrollRef}
          getReservationsForStation={getReservationsForStation}
          getBreaksForStation={getBreaksForStation}
          getAllTrainingsForStationAndDate={getAllTrainingsForStationAndDate}
          getOverlapInfo={getOverlapInfo}
          getDisplayTimesForDate={getDisplayTimesForDate}
          getReservationStyle={getReservationStyle}
          getStationCellBg={getStationCellBg}
          getMobileColumnStyle={getMobileColumnStyle}
          getMobileStationsContainerStyle={getMobileStationsContainerStyle}
          renderDayStationHeaders={renderDayStationHeaders}
          handleHeaderScroll={handleHeaderScroll}
          handleGridScroll={handleGridScroll}
          onSlotClick={handleSlotClick}
          onSlotContextMenu={handleSlotContextMenu}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onSlotDragOver={handleSlotDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onReservationClick={onReservationClick!}
          onDeleteBreak={onDeleteBreak}
          onTrainingClick={onTrainingClick}
        />
      )}


      {/* WEEK VIEW (Tile-based) */}
      {viewMode === 'week' && (
        <div className="overflow-x-auto flex-1">
          <WeekTileView
            reservations={reservations}
            stations={visibleStations}
            currentDate={currentDate}
            closedDays={closedDays}
            groupBy={groupingMode}
            employees={employees}
            showNotes={showNotesInBars}
            workingHours={workingHours}
            onDayClick={(date) => {
              setCurrentDate(date);
              setViewMode('day');
            }}
            onReservationClick={(r) => onReservationClick?.(r)}
            onAddClick={
              onAddReservation && !readOnly
                ? (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    setCurrentDate(date);
                    setViewMode('day');
                    onAddReservation(stations[0]?.id || '', dateStr, '08:00');
                  }
                : undefined
            }
            onReservationMove={
              onReservationMove
                ? (id, stationId, date) => onReservationMove(id, stationId, date)
                : undefined
            }
          />
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="overflow-x-auto flex-1">
          <MonthCalendarView
            reservations={reservations}
            stations={visibleStations}
            currentDate={currentDate}
            closedDays={closedDays}
            groupBy={groupingMode}
            employees={employees}
            showNotes={showNotesInBars}
            workingHours={workingHours}
            onDayClick={(date) => {
              setCurrentDate(date);
              setViewMode('day');
            }}
            onReservationClick={(r) => onReservationClick?.(r)}
            onAddClick={
              onAddReservation && !readOnly
                ? (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    setCurrentDate(date);
                    setViewMode('day');
                    onAddReservation(stations[0]?.id || '', dateStr, '08:00');
                  }
                : undefined
            }
            onReservationMove={
              onReservationMove
                ? (id, stationId, date) => onReservationMove(id, stationId, date)
                : undefined
            }
          />
        </div>
      )}

      {/* Color Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4 pb-2 border-t border-border/50 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-400/80 border border-orange-500/70" />
          <span className="text-xs text-muted-foreground">W trakcie</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-400/80 border border-green-500/70" />
          <span className="text-xs text-muted-foreground">Potwierdzona</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-400/80 border border-slate-500/70" />
          <span className="text-xs text-muted-foreground">Zakończona</span>
        </div>
        {trainingsEnabled && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-pink-300/80 border border-pink-400/70" />
              <span className="text-xs text-muted-foreground">Szkolenie (otwarte)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-fuchsia-600 border border-fuchsia-700" />
              <span className="text-xs text-muted-foreground">Szkolenie (zamknięte)</span>
            </div>
          </>
        )}
      </div>

      {/* Plac Sheet - from right side, no overlay, non-modal for drag & drop */}
      <Sheet open={placDrawerOpen} onOpenChange={setPlacDrawerOpen} modal={false}>
        <SheetContent
          side="right"
          hideOverlay
          className="w-[20%] min-w-[280px] bg-white border-l border-border shadow-[-8px_0_30px_-10px_rgba(0,0,0,0.15)] p-0 [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3 space-y-0">
            <SheetTitle className="text-lg font-semibold text-slate-900">Plac</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-600 hover:text-slate-900"
              onClick={() => setPlacDrawerOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </SheetHeader>
          {instanceId && <YardVehiclesList instanceId={instanceId} hallMode={hallMode} />}
        </SheetContent>
      </Sheet>

      {/* SMS Dialog */}
      {smsDialogData && (
        <SendSmsDialog
          open={smsDialogOpen}
          onClose={() => {
            setSmsDialogOpen(false);
            setSmsDialogData(null);
          }}
          phone={smsDialogData.phone}
          customerName={smsDialogData.customerName}
          instanceId={instanceId || null}
        />
      )}

      {/* Close/Open Day AlertDialog */}
      <AlertDialog open={closeDayDialogOpen} onOpenChange={setCloseDayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentDateClosed ? t('calendar.openDayTitle') : t('calendar.closeDayTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentDateClosed
                ? t('calendar.openDayDescription', {
                    date: format(currentDate, 'd MMMM yyyy', { locale: pl }),
                  })
                : t('calendar.closeDayDescription', {
                    date: format(currentDate, 'd MMMM yyyy', { locale: pl }),
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onToggleClosedDay?.(currentDateStr);
                setCloseDayDialogOpen(false);
              }}
              className={
                currentDateClosed
                  ? ''
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }
            >
              {currentDateClosed ? t('calendar.open') : t('calendar.close')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default AdminCalendar;
