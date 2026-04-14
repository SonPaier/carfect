import { useCallback } from 'react';
import { parseTime } from './useCalendarWorkingHours';
import type { Reservation } from '@/types/reservation';
import type { Break } from './types';

interface UseCalendarOverlapOptions {
  reservations: Reservation[];
  breaks: Break[];
  getDisplayTimesForDate: (
    reservation: Reservation,
    dateStr: string,
  ) => { displayStart: string; displayEnd: string };
  getWorkingHoursForDate: (dateStr: string) => { startTime: string; closeTime: string };
  getBreaksForStationAndDate: (stationId: string, dateStr: string) => Break[];
  isDateClosed: (dateStr: string) => boolean;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function useCalendarOverlap({
  reservations,
  breaks,
  getDisplayTimesForDate,
  getWorkingHoursForDate,
  getBreaksForStationAndDate,
  isDateClosed,
  t,
}: UseCalendarOverlapOptions) {
  const getOverlapInfo = useCallback(
    (
      reservation: Reservation,
      allReservations: Reservation[],
      dateStr: string,
    ): { hasOverlap: boolean; index: number; total: number; sameStartIndex: number; sameStartTotal: number } => {
      const activeReservations = allReservations.filter(
        (r) => r.status !== 'cancelled' && r.status !== 'no_show',
      );

      if (activeReservations.length <= 1) {
        return { hasOverlap: false, index: 0, total: 1, sameStartIndex: 0, sameStartTotal: 1 };
      }

      const doOverlap = (r1: Reservation, r2: Reservation): boolean => {
        const { displayStart: r1Start, displayEnd: r1End } = getDisplayTimesForDate(r1, dateStr);
        const { displayStart: r2Start, displayEnd: r2End } = getDisplayTimesForDate(r2, dateStr);
        const r1StartNum = parseTime(r1Start);
        const r1EndNum = parseTime(r1End);
        const r2StartNum = parseTime(r2Start);
        const r2EndNum = parseTime(r2End);
        return r1StartNum < r2EndNum && r1EndNum > r2StartNum;
      };

      // Build overlap groups using transitive closure (union-find approach)
      const groups: Reservation[][] = [];
      const assignedGroup = new Map<string, number>();

      for (const res of activeReservations) {
        const connectedGroupIndices = new Set<number>();

        for (const other of activeReservations) {
          if (res.id === other.id) continue;
          if (doOverlap(res, other) && assignedGroup.has(other.id)) {
            connectedGroupIndices.add(assignedGroup.get(other.id)!);
          }
        }

        if (connectedGroupIndices.size === 0) {
          const newGroupIndex = groups.length;
          groups.push([res]);
          assignedGroup.set(res.id, newGroupIndex);
        } else {
          const groupIndicesArray = Array.from(connectedGroupIndices).sort((a, b) => a - b);
          const targetGroup = groupIndicesArray[0];

          groups[targetGroup].push(res);
          assignedGroup.set(res.id, targetGroup);

          for (let i = groupIndicesArray.length - 1; i >= 1; i--) {
            const groupToMerge = groupIndicesArray[i];
            for (const r of groups[groupToMerge]) {
              groups[targetGroup].push(r);
              assignedGroup.set(r.id, targetGroup);
            }
            groups[groupToMerge] = [];
          }
        }
      }

      const groupIndex = assignedGroup.get(reservation.id);
      if (groupIndex === undefined) {
        return { hasOverlap: false, index: 0, total: 1, sameStartIndex: 0, sameStartTotal: 1 };
      }

      const group = groups[groupIndex];
      if (group.length <= 1) {
        return { hasOverlap: false, index: 0, total: 1, sameStartIndex: 0, sameStartTotal: 1 };
      }

      group.sort((a, b) => {
        const { displayStart: aStart } = getDisplayTimesForDate(a, dateStr);
        const { displayStart: bStart } = getDisplayTimesForDate(b, dateStr);
        const timeDiff = parseTime(aStart) - parseTime(bStart);
        if (timeDiff !== 0) return timeDiff;
        return a.id.localeCompare(b.id);
      });

      const index = group.findIndex((r) => r.id === reservation.id);

      // Find sub-group of reservations with the same start time
      const { displayStart: currentStart } = getDisplayTimesForDate(reservation, dateStr);
      const currentStartNum = parseTime(currentStart);
      const sameStartGroup = group.filter((r) => {
        const { displayStart } = getDisplayTimesForDate(r, dateStr);
        return parseTime(displayStart) === currentStartNum;
      });
      const sameStartIndex = sameStartGroup.findIndex((r) => r.id === reservation.id);
      const sameStartTotal = sameStartGroup.length;

      return { hasOverlap: true, index, total: group.length, sameStartIndex, sameStartTotal };
    },
    [getDisplayTimesForDate],
  );

  const getFreeTimeForStation = useCallback(
    (
      stationId: string,
      dateStr: string,
    ): { hours: number; minutes: number } | null => {
      const { startTime, closeTime } = getWorkingHoursForDate(dateStr);

      if (!startTime || !closeTime) {
        return null;
      }

      const openHour = parseTime(startTime);
      const closeHour = parseTime(closeTime);

      if (isNaN(openHour) || isNaN(closeHour) || closeHour <= openHour) {
        return null;
      }

      const totalWorkingMinutes = (closeHour - openHour) * 60;

      const stationReservations = reservations.filter((r) => {
        if (
          r.station_id !== stationId ||
          r.status === 'cancelled' ||
          r.status === 'no_show'
        )
          return false;
        const startDate = r.reservation_date;
        const endDate = r.end_date || r.reservation_date;
        return dateStr >= startDate && dateStr <= endDate;
      });

      let bookedMinutes = 0;
      stationReservations.forEach((r) => {
        const { displayStart, displayEnd } = getDisplayTimesForDate(r, dateStr);
        const start = parseTime(displayStart);
        const end = parseTime(displayEnd);
        if (!isNaN(start) && !isNaN(end)) {
          bookedMinutes += (end - start) * 60;
        }
      });

      const stationBreaks = getBreaksForStationAndDate(stationId, dateStr);
      stationBreaks.forEach((b) => {
        const start = parseTime(b.start_time);
        const end = parseTime(b.end_time);
        if (!isNaN(start) && !isNaN(end)) {
          bookedMinutes += (end - start) * 60;
        }
      });

      const freeMinutes = Math.max(0, totalWorkingMinutes - bookedMinutes);
      return {
        hours: Math.floor(freeMinutes / 60),
        minutes: Math.round(freeMinutes % 60),
      };
    },
    [reservations, getDisplayTimesForDate, getWorkingHoursForDate, getBreaksForStationAndDate],
  );

  const formatFreeTime = useCallback(
    (stationId: string, dateStr: string): string | null => {
      if (isDateClosed(dateStr)) return null;
      const date = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return null;

      const freeTime = getFreeTimeForStation(stationId, dateStr);
      if (!freeTime) return null;

      const { hours, minutes } = freeTime;
      if (hours === 0 && minutes === 0) return t('calendar.noFreeTime');
      if (hours === 0) return t('calendar.freeMinutes', { minutes });
      if (minutes === 0) return t('calendar.freeHours', { hours });
      return t('calendar.freeHoursMinutes', { hours, minutes });
    },
    [isDateClosed, getFreeTimeForStation, t],
  );

  return {
    getOverlapInfo,
    getFreeTimeForStation,
    formatFreeTime,
  };
}
