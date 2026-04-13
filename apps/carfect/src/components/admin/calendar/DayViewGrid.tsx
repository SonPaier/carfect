import { DragEvent, RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { CalendarOff } from 'lucide-react';
import { HOUR_HEIGHT, parseTime } from './useCalendarWorkingHours';
import { TimeColumn } from './TimeColumn';
import { StationColumn } from './StationColumn';
import { CalendarGridProvider, type CalendarGridContextValue } from './CalendarGridContext';
import type { Reservation } from '@/types/reservation';
import type { HallConfig } from '../AdminCalendar';
import type { Station, Break, Training, Employee } from './types';

export interface DayViewGridProps {
  // Date info
  currentDate: Date;
  currentDateStr: string;
  isToday: boolean;
  currentDateClosed: boolean;
  isPastDay: boolean;
  // Working hours
  hours: number[];
  startSlotOffset: number;
  displayStartTime: number;
  displayEndTime: number;
  workingStartTime: number;
  workingEndTime: number;
  dayCloseTime: string;
  // Data
  visibleStations: Station[];
  // Display
  isMobile: boolean;
  effectiveCompact: boolean;
  hallMode: boolean;
  hallConfig?: HallConfig;
  hallDataVisible?: boolean;
  employees: Employee[];
  showEmployeesOnReservations: boolean;
  // Drag state
  draggedReservation: Reservation | null;
  dragOverStation: string | null;
  dragOverSlot: { hour: number; slotIndex: number } | null;
  dragPreviewStyle: { top: string; height: string; time: string } | null;
  slotPreview: { date: string; startTime: string; endTime: string; stationId: string } | null;
  selectedReservationId: string | null;
  // Refs
  headerScrollRef: RefObject<HTMLDivElement | null>;
  gridScrollRef: RefObject<HTMLDivElement | null>;
  // Functions (DayViewGrid-specific)
  getReservationsForStation: (stationId: string) => Reservation[];
  getBreaksForStation: (stationId: string) => Break[];
  getAllTrainingsForStationAndDate: (
    stationId: string,
    dateStr: string,
    stationIdx: number,
  ) => Training[];
  getMobileStationsContainerStyle: (count: number) => React.CSSProperties;
  renderDayStationHeaders: () => React.ReactNode;
  handleHeaderScroll: () => void;
  handleGridScroll: () => void;
  // Context-provided functions (passed through to StationColumn via context)
  getOverlapInfo: (
    reservation: Reservation,
    allReservations: Reservation[],
    dateStr: string,
  ) => { hasOverlap: boolean; index: number; total: number };
  getDisplayTimesForDate: (
    reservation: Reservation,
    dateStr: string,
  ) => { displayStart: string; displayEnd: string };
  getReservationStyle: (
    startTime: string,
    endTime: string,
    displayStartTime?: number,
  ) => { top: string; height: string };
  getStationCellBg: (color: string) => string;
  getMobileColumnStyle: (count: number) => React.CSSProperties;
  // Callbacks (context-provided)
  onSlotClick: (stationId: string, hour: number, slotIndex: number) => void;
  onSlotContextMenu: (
    e: React.MouseEvent,
    stationId: string,
    hour: number,
    slotIndex: number,
    dateStr: string,
  ) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, reservation: Reservation) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, stationId: string, dateStr: string) => void;
  onSlotDragOver: (
    e: DragEvent<HTMLDivElement>,
    stationId: string,
    hour: number,
    slotIndex: number,
    dateStr: string,
  ) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (
    e: DragEvent<HTMLDivElement>,
    stationId: string,
    dateStr: string,
    hour?: number,
    slotIndex?: number,
  ) => void;
  onTouchStart: (
    stationId: string,
    hour: number,
    slotIndex: number,
    dateStr: string,
  ) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
  onReservationClick: (reservation: Reservation) => void;
  onDeleteBreak?: (breakId: string) => void;
  onTrainingClick?: (training: Training) => void;
}

export function DayViewGrid({
  currentDate: _currentDate,
  currentDateStr,
  isToday,
  currentDateClosed,
  isPastDay,
  hours,
  startSlotOffset,
  displayStartTime,
  displayEndTime,
  workingStartTime,
  workingEndTime,
  dayCloseTime,
  visibleStations,
  isMobile,
  effectiveCompact,
  hallMode,
  hallConfig,
  hallDataVisible,
  employees,
  showEmployeesOnReservations,
  draggedReservation,
  dragOverStation,
  dragOverSlot,
  dragPreviewStyle,
  slotPreview,
  selectedReservationId,
  headerScrollRef,
  gridScrollRef,
  getReservationsForStation,
  getBreaksForStation,
  getAllTrainingsForStationAndDate,
  getMobileStationsContainerStyle,
  renderDayStationHeaders,
  handleHeaderScroll,
  handleGridScroll,
  getOverlapInfo,
  getDisplayTimesForDate,
  getReservationStyle,
  getStationCellBg,
  getMobileColumnStyle,
  onSlotClick,
  onSlotContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onSlotDragOver,
  onDragLeave,
  onDrop,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  onReservationClick,
  onDeleteBreak,
  onTrainingClick,
}: DayViewGridProps) {
  const { t } = useTranslation();
  // Current time indicator
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const showCurrentTime =
    isToday && currentHour >= displayStartTime && currentHour <= parseTime(dayCloseTime);
  const currentTimeTop = (currentHour - displayStartTime) * HOUR_HEIGHT;

  const contextValue: CalendarGridContextValue = {
    isMobile,
    effectiveCompact,
    hallConfig,
    employees,
    draggedReservation,
    dragOverStation,
    dragOverSlot,
    dragPreviewStyle,
    slotPreview,
    selectedReservationId,
    getOverlapInfo,
    getDisplayTimesForDate,
    getReservationStyle,
    getStationCellBg,
    getMobileColumnStyle,
    onSlotClick,
    onSlotContextMenu,
    onDragStart,
    onDragEnd,
    onDragOver,
    onSlotDragOver,
    onDragLeave,
    onDrop,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onReservationClick,
    onDeleteBreak,
    onTrainingClick,
  };

  return (
    <CalendarGridProvider value={contextValue}>
      {/* Station Headers - outside grid on desktop (JS-synced horizontal scroll) */}
      {!isMobile && (
        <div
          ref={headerScrollRef}
          onScroll={handleHeaderScroll}
          className="flex border-b border-border/50 bg-card sticky top-0 z-40 overflow-x-auto"
        >
          {renderDayStationHeaders()}
        </div>
      )}

      {/* Main scrollable container */}
      <div
        ref={gridScrollRef}
        onScroll={!isMobile ? handleGridScroll : undefined}
        className="flex-1 overflow-auto"
      >
        {/* Station Headers - inside grid on mobile (native sticky, no JS sync needed) */}
        {isMobile && (
          <div className="flex border-b border-border/50 bg-card sticky top-0 z-40">
            {renderDayStationHeaders()}
          </div>
        )}

        {/* Calendar Grid - Day View */}
        <div
          className={cn('flex relative', currentDateClosed && 'opacity-50')}
          style={{
            minHeight: (displayEndTime - displayStartTime) * HOUR_HEIGHT,
          }}
        >
          {/* Closed day overlay */}
          {currentDateClosed && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div className="bg-red-500/20 backdrop-blur-[1px] absolute inset-0" />
              <div className="relative bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                <CalendarOff className="w-5 h-5" />
                <span className="font-semibold">{t('calendar.closedDay')}</span>
              </div>
            </div>
          )}

          {/* Time column */}
          <TimeColumn
            hours={hours}
            startSlotOffset={startSlotOffset}
            displayEndTime={displayEndTime}
          />

          {/* Station columns container */}
          <div
            className={cn('flex', !isMobile && 'flex-1')}
            style={getMobileStationsContainerStyle(visibleStations.length)}
          >
            {visibleStations.map((station, idx) => (
              <StationColumn
                key={station.id}
                station={station}
                dateStr={currentDateStr}
                index={idx}
                totalStations={visibleStations.length}
                hours={hours}
                startSlotOffset={startSlotOffset}
                displayStartTime={displayStartTime}
                displayEndTime={displayEndTime}
                workingStartTime={workingStartTime}
                workingEndTime={workingEndTime}
                stationReservations={getReservationsForStation(station.id)}
                stationBreaks={getBreaksForStation(station.id)}
                stationTrainings={getAllTrainingsForStationAndDate(
                  station.id,
                  currentDateStr,
                  idx,
                )}
                hallMode={hallMode}
                hallDataVisible={hallDataVisible}
                isPastDay={isPastDay}
                isDateClosed={currentDateClosed}
                showEmployeesOnReservations={showEmployeesOnReservations}
              />
            ))}
          </div>

          {/* Current time indicator with time label */}
          {showCurrentTime && (
            <div
              className="absolute left-0 right-0 z-40 pointer-events-none"
              style={{ top: currentTimeTop }}
            >
              <div className="flex items-center">
                <div className="w-12 md:w-16 flex items-center justify-end pr-1 gap-0.5">
                  <span className="text-[10px] md:text-xs font-semibold text-red-500 bg-background/90 px-1 rounded">
                    {`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                </div>
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </CalendarGridProvider>
  );
}
