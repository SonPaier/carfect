import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import {
  SLOT_HEIGHT,
  SLOTS_PER_HOUR,
  SLOT_MINUTES,
  HOUR_HEIGHT,
  getTimeBasedZIndex,
} from './useCalendarWorkingHours';
import { ReservationBlock } from './ReservationBlock';
import { BreakBlock } from './BreakBlock';
import { TrainingBlock } from './TrainingBlock';
import { useCalendarGrid } from './CalendarGridContext';
import type { Reservation } from '@/types/reservation';
import type { HallConfig } from '../AdminCalendar';
import type { Station, Break, Training } from './types';

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
  // Display (station-specific)
  hallMode: boolean;
  hallConfig?: HallConfig;
  hallDataVisible?: boolean;
  isPastDay: boolean;
  isDateClosed: boolean;
  showEmployeesOnReservations: boolean;
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
  hallMode,
  hallConfig,
  hallDataVisible,
  isPastDay,
  isDateClosed,
  showEmployeesOnReservations,
}: StationColumnProps) {
  const {
    isMobile,
    effectiveCompact,
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
  } = useCalendarGrid();

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
