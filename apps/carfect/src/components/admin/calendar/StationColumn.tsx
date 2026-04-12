import { DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import {
  SLOT_HEIGHT,
  SLOTS_PER_HOUR,
  SLOT_MINUTES,
  HOUR_HEIGHT,
  parseTime,
  getTimeBasedZIndex,
} from './useCalendarWorkingHours';
import { ReservationBlock } from './ReservationBlock';
import { BreakBlock } from './BreakBlock';
import { TrainingBlock } from './TrainingBlock';
import type { Reservation } from '@/types/reservation';
import type { HallConfig } from '../AdminCalendar';

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

interface Training {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  station_id: string | null;
  status: string;
  assigned_employee_ids: string[];
}

interface Employee {
  id: string;
  name: string;
  photo_url: string | null;
}

export interface StationColumnProps {
  station: Station;
  dateStr: string;
  index: number;
  totalStations: number;
  // Working hours
  hours: number[];
  startSlotOffset: number;
  displayStartTime: number;
  displayEndTime: number;
  workingStartTime: number;
  workingEndTime: number;
  // Data
  stationReservations: Reservation[];
  stationBreaks: Break[];
  stationTrainings: Training[];
  // Display
  isMobile: boolean;
  effectiveCompact: boolean;
  hallMode: boolean;
  hallConfig?: HallConfig;
  hallDataVisible?: boolean;
  isPastDay: boolean;
  isDateClosed: boolean;
  employees: Employee[];
  showEmployeesOnReservations: boolean;
  // Drag state
  draggedReservation: Reservation | null;
  dragOverStation: string | null;
  dragOverSlot: { hour: number; slotIndex: number } | null;
  dragPreviewStyle: { top: string; height: string; time: string } | null;
  slotPreview: { date: string; startTime: string; endTime: string; stationId: string } | null;
  selectedReservationId: string | null;
  // Functions
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
  // Callbacks
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

export function StationColumn({
  station,
  dateStr,
  index,
  totalStations,
  hours,
  startSlotOffset,
  displayStartTime,
  displayEndTime,
  workingStartTime,
  workingEndTime,
  stationReservations,
  stationBreaks,
  stationTrainings,
  isMobile,
  effectiveCompact,
  hallMode,
  hallConfig,
  hallDataVisible,
  isPastDay,
  isDateClosed,
  employees,
  showEmployeesOnReservations,
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
}: StationColumnProps) {
  const totalVisibleHeight = (displayEndTime - displayStartTime) * HOUR_HEIGHT;

  let pastHatchHeight = 0;
  if (isPastDay) {
    pastHatchHeight = totalVisibleHeight;
  }

  return (
    <div
      className={cn(
        'relative transition-colors duration-150 shrink-0',
        !isMobile && 'flex-1',
        !isMobile && !effectiveCompact && 'min-w-[220px]',
        !isMobile && effectiveCompact && 'min-w-0',
        index < totalStations - 1 && 'border-r border-border',
        dragOverStation === station.id && !dragOverSlot && 'bg-primary/10',
      )}
      style={{
        ...(isMobile ? getMobileColumnStyle(totalStations) : {}),
        ...(station.color && !dragOverStation
          ? { backgroundColor: getStationCellBg(station.color) }
          : {}),
      }}
      onDragOver={(e) => onDragOver(e, station.id, dateStr)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, station.id, dateStr)}
    >
      {/* Hatched area for PAST time slots */}
      {pastHatchHeight > 0 && (
        <div
          className="absolute left-0 right-0 top-0 hatched-pattern pointer-events-none z-10"
          style={{ height: pastHatchHeight }}
        />
      )}

      {/* Hatched area BEFORE working hours */}
      {displayStartTime < workingStartTime && (
        <div
          className="absolute left-0 right-0 top-0 hatched-pattern pointer-events-none z-5"
          style={{ height: (workingStartTime - displayStartTime) * HOUR_HEIGHT }}
        />
      )}

      {/* Hatched area AFTER working hours */}
      {displayEndTime > workingEndTime && (
        <div
          className="absolute left-0 right-0 hatched-pattern pointer-events-none z-5"
          style={{
            top: (workingEndTime - displayStartTime) * HOUR_HEIGHT,
            height: (displayEndTime - workingEndTime) * HOUR_HEIGHT,
          }}
        />
      )}

      {/* 15-minute grid slots */}
      {hours.map((hour, hourIndex) => {
        const isFirstHour = hourIndex === 0;
        const isLastHour = hourIndex === hours.length - 1;
        const slotsToSkip = isFirstHour ? startSlotOffset : 0;
        const endSlotOffset = isLastHour
          ? Math.round((displayEndTime - hour) * SLOTS_PER_HOUR)
          : SLOTS_PER_HOUR;
        const slotsToRender = Math.max(0, endSlotOffset - slotsToSkip);
        if (slotsToRender <= 0) return null;
        const hourBlockHeight = slotsToRender * SLOT_HEIGHT;

        return (
          <div key={hour} style={{ height: hourBlockHeight }}>
            {Array.from({ length: slotsToRender }, (_, i) => {
              const slotIndex = i + slotsToSkip;
              const slotMinutes = slotIndex * SLOT_MINUTES;
              const slotTimeDecimal = hour + slotMinutes / 60;
              const isDropTarget =
                dragOverStation === station.id &&
                dragOverSlot?.hour === hour &&
                dragOverSlot?.slotIndex === slotIndex;
              const isOutsideWorkingHours =
                slotTimeDecimal < workingStartTime || slotTimeDecimal >= workingEndTime;
              const isDisabled = isPastDay || isOutsideWorkingHours || isDateClosed;

              return (
                <div
                  key={slotIndex}
                  data-testid="calendar-slot"
                  data-time={`${hour.toString().padStart(2, '0')}:${(slotIndex * SLOT_MINUTES).toString().padStart(2, '0')}`}
                  data-station={station.id}
                  data-disabled={isDisabled ? 'true' : undefined}
                  className={cn(
                    'border-b group transition-colors relative',
                    slotIndex === SLOTS_PER_HOUR - 1 ? 'border-border' : 'border-border/40',
                    isDropTarget && !isDisabled && 'bg-primary/30 border-primary',
                    !isDropTarget && !isDisabled && 'hover:bg-primary/10 hover:z-50 cursor-pointer',
                    isDisabled && 'cursor-not-allowed',
                  )}
                  style={{ height: SLOT_HEIGHT }}
                  onClick={() => !isDisabled && onSlotClick(station.id, hour, slotIndex)}
                  onContextMenu={(e) =>
                    !isDisabled && onSlotContextMenu(e, station.id, hour, slotIndex, dateStr)
                  }
                  onTouchStart={() =>
                    !isDisabled && onTouchStart(station.id, hour, slotIndex, dateStr)
                  }
                  onTouchEnd={onTouchEnd}
                  onTouchMove={onTouchMove}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDisabled) onSlotDragOver(e, station.id, hour, slotIndex, dateStr);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDisabled) onDrop(e, station.id, dateStr, hour, slotIndex);
                  }}
                >
                  {!hallMode && !isDisabled && (
                    <div className="h-full w-full flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {`${hour.toString().padStart(2, '0')}:${(slotIndex * SLOT_MINUTES).toString().padStart(2, '0')}`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Drag preview ghost */}
      {draggedReservation && dragOverStation === station.id && dragPreviewStyle && (
        <div
          className="absolute left-1 right-1 rounded-lg border-2 border-dashed border-primary bg-primary/20 pointer-events-none flex items-center justify-center"
          style={{
            top: dragPreviewStyle.top,
            height: dragPreviewStyle.height,
            zIndex: 10000,
          }}
        >
          <span className="text-sm font-bold text-foreground bg-background px-3 py-1.5 rounded-md shadow-lg border border-border">
            Przenieś na {dragPreviewStyle.time}
          </span>
        </div>
      )}

      {/* Slot Preview Highlight */}
      {slotPreview &&
        slotPreview.date === dateStr &&
        slotPreview.stationId === station.id && (
          <div
            className="absolute left-0.5 right-0.5 rounded-lg border-2 border-dashed border-fuchsia-400 pointer-events-none z-40 animate-pulse"
            style={{
              ...getReservationStyle(slotPreview.startTime, slotPreview.endTime),
              background:
                'repeating-linear-gradient(45deg, rgba(236,72,153,0.15), rgba(236,72,153,0.15) 4px, transparent 4px, transparent 8px)',
            }}
          >
            <div className="px-2 py-1 text-xs font-medium text-fuchsia-600">
              {slotPreview.startTime.slice(0, 5)} - {slotPreview.endTime.slice(0, 5)}
            </div>
          </div>
        )}

      {/* Reservations */}
      {stationReservations.map((reservation) => {
        const { displayStart, displayEnd } = getDisplayTimesForDate(reservation, dateStr);
        const style = getReservationStyle(displayStart, displayEnd);
        const isDragging = draggedReservation?.id === reservation.id;
        const isSelected = selectedReservationId === reservation.id;
        const overlapInfo = getOverlapInfo(reservation, stationReservations, dateStr);

        return (
          <ReservationBlock
            key={reservation.id}
            reservation={reservation}
            displayStart={displayStart}
            displayEnd={displayEnd}
            style={style}
            overlapInfo={overlapInfo}
            isDragging={isDragging}
            isAnyDragging={!!draggedReservation}
            isSelected={isSelected}
            hallMode={hallMode}
            hallConfig={hallConfig}
            hallDataVisible={hallDataVisible}
            isMobile={isMobile}
            stationType={station.type}
            employees={employees}
            showEmployeesOnReservations={showEmployeesOnReservations}
            zIndex={
              overlapInfo.hasOverlap
                ? 10 + overlapInfo.index
                : getTimeBasedZIndex(displayStart)
            }
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onReservationClick}
          />
        );
      })}

      {/* Breaks */}
      {stationBreaks.map((breakItem) => (
        <BreakBlock
          key={breakItem.id}
          breakItem={breakItem}
          style={getReservationStyle(breakItem.start_time, breakItem.end_time, displayStartTime)}
          onDelete={onDeleteBreak}
        />
      ))}

      {/* Trainings */}
      {stationTrainings.map((training) => (
        <TrainingBlock
          key={`training-${training.id}`}
          training={training}
          style={getReservationStyle(
            training.start_time.substring(0, 5),
            training.end_time.substring(0, 5),
            displayStartTime,
          )}
          zIndex={getTimeBasedZIndex(training.start_time)}
          employees={employees}
          onClick={onTrainingClick}
        />
      ))}
    </div>
  );
}
