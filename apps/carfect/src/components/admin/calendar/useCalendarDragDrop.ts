import { useState, useCallback, DragEvent } from 'react';
import type { Reservation } from '@/types/reservation';
import { parseTime, formatTimeSlot, SLOT_MINUTES, HOUR_HEIGHT } from './useCalendarWorkingHours';
import type { HoursForDate } from './useCalendarWorkingHours';

interface YardVehicle {
  id: string;
  [key: string]: unknown;
}

interface DragOverSlot {
  hour: number;
  slotIndex: number;
}

interface DragPreviewStyle {
  top: string;
  height: string;
  time: string;
}

interface UseCalendarDragDropOptions {
  reservations: Reservation[];
  readOnly?: boolean;
  isMobile: boolean;
  displayStartTime: number;
  getWorkingHoursForDate: (dateStr: string) => HoursForDate;
  onReservationMove?: (reservationId: string, stationId: string, date: string, time?: string) => void;
  onYardVehicleDrop?: (vehicle: YardVehicle, stationId: string, date: string, time: string) => void;
}

interface UseCalendarDragDropReturn {
  draggedReservation: Reservation | null;
  dragOverStation: string | null;
  dragOverSlot: DragOverSlot | null;
  dragPreviewStyle: DragPreviewStyle | null;
  handleDragStart: (e: DragEvent<HTMLDivElement>, reservation: Reservation) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: DragEvent<HTMLDivElement>, stationId: string, dateStr?: string) => void;
  handleSlotDragOver: (e: DragEvent<HTMLDivElement>, stationId: string, hour: number, slotIndex: number, dateStr?: string) => void;
  handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>, stationId: string, dateStr: string, hour?: number, slotIndex?: number) => void;
}

export function useCalendarDragDrop({
  reservations,
  readOnly,
  isMobile,
  displayStartTime,
  getWorkingHoursForDate,
  onReservationMove,
  onYardVehicleDrop,
}: UseCalendarDragDropOptions): UseCalendarDragDropReturn {
  const [draggedReservation, setDraggedReservation] = useState<Reservation | null>(null);
  const [dragOverStation, setDragOverStation] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<DragOverSlot | null>(null);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, reservation: Reservation) => {
    if (readOnly || isMobile) {
      e.preventDefault();
      return;
    }
    setDraggedReservation(reservation);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', reservation.id);
  }, [readOnly, isMobile]);

  const handleDragEnd = useCallback(() => {
    setDraggedReservation(null);
    setDragOverStation(null);
    setDragOverDate(null);
    setDragOverSlot(null);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, stationId: string, dateStr?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStation(stationId);
    if (dateStr) {
      setDragOverDate(dateStr);
    }
  }, []);

  const handleSlotDragOver = useCallback((
    e: DragEvent<HTMLDivElement>,
    stationId: string,
    hour: number,
    slotIndex: number,
    dateStr?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStation(stationId);
    setDragOverSlot({ hour, slotIndex });
    if (dateStr) {
      setDragOverDate(dateStr);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverStation(null);
      setDragOverSlot(null);
    }
  }, []);

  const handleDrop = useCallback((
    e: DragEvent<HTMLDivElement>,
    stationId: string,
    dateStr: string,
    hour?: number,
    slotIndex?: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStation(null);
    setDragOverDate(null);
    setDragOverSlot(null);

    // Check if this is a yard vehicle drop
    const yardVehicleData = e.dataTransfer.getData('application/yard-vehicle');
    if (yardVehicleData && hour !== undefined && slotIndex !== undefined) {
      try {
        const vehicle = JSON.parse(yardVehicleData) as YardVehicle;
        const dropTime = formatTimeSlot(hour, slotIndex);
        onYardVehicleDrop?.(vehicle, stationId, dateStr, dropTime);
      } catch (err) {
        console.error('Error parsing yard vehicle data:', err);
      }
      return;
    }

    if (draggedReservation) {
      const newTime =
        hour !== undefined && slotIndex !== undefined ? formatTimeSlot(hour, slotIndex) : undefined;

      // Validate working hours
      if (newTime) {
        const { startTime: dayStartTime, closeTime: dayCloseTime } =
          getWorkingHoursForDate(dateStr);
        const newStartNum = parseTime(newTime);
        const dayStartNum = parseTime(dayStartTime);

        if (newStartNum < dayStartNum) {
          console.warn('Cannot drop reservation before opening time');
          setDraggedReservation(null);
          return;
        }

        const originalStart = parseTime(draggedReservation.start_time);
        const originalEnd = parseTime(draggedReservation.end_time);
        const duration = originalEnd - originalStart;
        const newEndNum = newStartNum + duration;
        const closeNum = parseTime(dayCloseTime);
        if (newEndNum > closeNum) {
          console.warn('Reservation would end after closing time');
          setDraggedReservation(null);
          return;
        }
      }

      const stationChanged = draggedReservation.station_id !== stationId;
      const dateChanged = draggedReservation.reservation_date !== dateStr;
      const timeChanged = newTime && newTime !== draggedReservation.start_time;
      if (stationChanged || dateChanged || timeChanged) {
        onReservationMove?.(draggedReservation.id, stationId, dateStr, newTime);
      }
    }
    setDraggedReservation(null);
  }, [draggedReservation, getWorkingHoursForDate, onReservationMove, onYardVehicleDrop]);

  // Drag preview position
  const getDragPreviewStyle = (): DragPreviewStyle | null => {
    if (!draggedReservation || !dragOverSlot) return null;
    const start = parseTime(draggedReservation.start_time);
    const end = parseTime(draggedReservation.end_time);
    const duration = end - start;
    const newStartTime = dragOverSlot.hour + (dragOverSlot.slotIndex * SLOT_MINUTES) / 60;
    const top = (newStartTime - displayStartTime) * HOUR_HEIGHT;
    const height = duration * HOUR_HEIGHT;
    return {
      top: `${top}px`,
      height: `${Math.max(height, 30)}px`,
      time: formatTimeSlot(dragOverSlot.hour, dragOverSlot.slotIndex),
    };
  };

  return {
    draggedReservation,
    dragOverStation,
    dragOverSlot,
    dragPreviewStyle: getDragPreviewStyle(),
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleSlotDragOver,
    handleDragLeave,
    handleDrop,
  };
}
