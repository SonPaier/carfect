import { createContext, useContext } from 'react';
import type { DragEvent } from 'react';
import type { Reservation } from '@/types/reservation';
import type { HallConfig } from '../AdminCalendar';
import type { Break, Training, Employee } from './types';

export interface CalendarGridContextValue {
  // Display flags
  isMobile: boolean;
  effectiveCompact: boolean;
  hallConfig?: HallConfig;
  employees: Employee[];
  // Drag state (passed through unchanged)
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
  onTouchStart: (stationId: string, hour: number, slotIndex: number, dateStr: string) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
  onReservationClick: (reservation: Reservation) => void;
  onDeleteBreak?: (breakId: string) => void;
  onTrainingClick?: (training: Training) => void;
}

const CalendarGridContext = createContext<CalendarGridContextValue | null>(null);

export function CalendarGridProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: CalendarGridContextValue;
}) {
  return <CalendarGridContext.Provider value={value}>{children}</CalendarGridContext.Provider>;
}

export function useCalendarGrid(): CalendarGridContextValue {
  const ctx = useContext(CalendarGridContext);
  if (!ctx) {
    throw new Error('useCalendarGrid must be used within a CalendarGridProvider');
  }
  return ctx;
}

export type { Break, Training };
