import { useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import type { Reservation } from '@/types/reservation';

// Constants
export const DEFAULT_START_HOUR = 9;
export const DEFAULT_END_HOUR = 19;
export const SLOT_MINUTES = 15;
export const SLOTS_PER_HOUR = 4;
export const SLOT_HEIGHT = 32;
export const HOUR_HEIGHT = SLOT_HEIGHT * SLOTS_PER_HOUR; // 128

// Pure utility: "HH:MM" or "HH:MM:SS" → decimal hours (e.g. "08:30" → 8.5)
export function parseTime(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours + (minutes || 0) / 60;
}

// Pure utility: (hour, slotIndex) → "HH:MM" (e.g. (8, 2) → "08:30")
export function formatTimeSlot(hour: number, slotIndex: number): string {
  const minutes = slotIndex * SLOT_MINUTES;
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Pure utility: z-index based on start time for layering overlaps
export function getTimeBasedZIndex(startTime: string): number {
  return Math.round(parseTime(startTime) * 10);
}

export interface HoursForDate {
  hours: number[];
  startHour: number;
  endHour: number;
  closeTime: string;
  workingStartTime: number;
  workingEndTime: number;
  displayStartTime: number;
  displayEndTime: number;
  startSlotOffset: number;
  isClosed: boolean;
}

export type WorkingHoursMap = Record<string, { open: string; close: string } | null> | null;

interface UseCalendarWorkingHoursOptions {
  workingHours: WorkingHoursMap;
}

export function useCalendarWorkingHours({ workingHours }: UseCalendarWorkingHoursOptions) {
  const getHoursForDate = useCallback(
    (date: Date): HoursForDate => {
      const defaultResult: HoursForDate = {
        hours: Array.from(
          { length: DEFAULT_END_HOUR - DEFAULT_START_HOUR },
          (_, i) => i + DEFAULT_START_HOUR,
        ),
        startHour: DEFAULT_START_HOUR,
        endHour: DEFAULT_END_HOUR,
        closeTime: `${DEFAULT_END_HOUR}:00`,
        workingStartTime: DEFAULT_START_HOUR,
        workingEndTime: DEFAULT_END_HOUR,
        displayStartTime: DEFAULT_START_HOUR,
        displayEndTime: DEFAULT_END_HOUR,
        startSlotOffset: 0,
        isClosed: false,
      };

      if (!workingHours) {
        return defaultResult;
      }

      const dayName = format(date, 'EEEE').toLowerCase();
      const dayHours = workingHours[dayName];

      if (!dayHours || !dayHours.open || !dayHours.close) {
        return { ...defaultResult, isClosed: true };
      }

      const parseTimeDecimal = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours + (minutes || 0) / 60;
      };

      const workingStartTime = parseTimeDecimal(dayHours.open);
      const workingEndTime = parseTimeDecimal(dayHours.close);

      if (isNaN(workingStartTime) || isNaN(workingEndTime) || workingEndTime <= workingStartTime) {
        return defaultResult;
      }

      const displayStartTime = Math.max(0, workingStartTime - 0.5);
      const displayEndTime = Math.min(24, workingEndTime + 0.5);
      const displayStartHour = Math.floor(displayStartTime);
      const displayEndHour = Math.ceil(displayEndTime);
      const startSlotOffset = Math.round((displayStartTime - displayStartHour) * SLOTS_PER_HOUR);

      return {
        hours: Array.from(
          { length: displayEndHour - displayStartHour },
          (_, i) => i + displayStartHour,
        ),
        startHour: displayStartHour,
        endHour: displayEndHour,
        closeTime: dayHours.close,
        workingStartTime,
        workingEndTime,
        displayStartTime,
        displayEndTime,
        startSlotOffset,
        isClosed: false,
      };
    },
    [workingHours],
  );

  const getWorkingHoursForDate = useCallback(
    (dateStr: string): { startTime: string; closeTime: string } => {
      if (!workingHours) {
        return {
          startTime: `${DEFAULT_START_HOUR}:00`,
          closeTime: `${DEFAULT_END_HOUR}:00`,
        };
      }
      const date = new Date(dateStr);
      const dayName = format(date, 'EEEE').toLowerCase();
      const dayHours = workingHours[dayName];
      if (!dayHours) {
        return {
          startTime: `${DEFAULT_START_HOUR}:00`,
          closeTime: `${DEFAULT_END_HOUR}:00`,
        };
      }
      return {
        startTime: dayHours.open,
        closeTime: dayHours.close,
      };
    },
    [workingHours],
  );

  const isWorkingDay = useCallback(
    (date: Date): boolean => {
      if (!workingHours) return true;
      const dayName = format(date, 'EEEE').toLowerCase();
      const dayHours = workingHours[dayName];
      return !!(dayHours && dayHours.open && dayHours.close);
    },
    [workingHours],
  );

  const findNextWorkingDay = useCallback(
    (
      startDate: Date,
      direction: 'forward' | 'backward' = 'forward',
      maxDays: number = 14,
    ): Date => {
      let checkDate = startDate;
      for (let i = 0; i < maxDays; i++) {
        if (isWorkingDay(checkDate)) {
          return checkDate;
        }
        checkDate = direction === 'forward' ? addDays(checkDate, 1) : subDays(checkDate, 1);
      }
      return startDate;
    },
    [isWorkingDay],
  );

  const getDisplayTimesForDate = useCallback(
    (
      reservation: Reservation,
      dateStr: string,
    ): { displayStart: string; displayEnd: string } => {
      const isFirstDay = reservation.reservation_date === dateStr;
      const isLastDay = (reservation.end_date || reservation.reservation_date) === dateStr;
      const { startTime: dayOpen, closeTime: dayClose } = getWorkingHoursForDate(dateStr);

      let displayStart = reservation.start_time;
      let displayEnd = reservation.end_time;

      if (!isFirstDay) {
        displayStart = dayOpen;
      }
      if (!isLastDay) {
        displayEnd = dayClose;
      }

      return { displayStart, displayEnd };
    },
    [getWorkingHoursForDate],
  );

  return {
    getHoursForDate,
    getWorkingHoursForDate,
    isWorkingDay,
    findNextWorkingDay,
    getDisplayTimesForDate,
  };
}
