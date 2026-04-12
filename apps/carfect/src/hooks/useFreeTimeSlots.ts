import { useMemo } from 'react';
import { format, getDay } from 'date-fns';

interface Station {
  id: string;
  name: string;
  type: string;
  color?: string | null;
}

interface Reservation {
  station_id: string | null;
  reservation_date: string;
  start_time: string;
  end_time: string;
}

type WorkingHours = Record<string, { open: string; close: string } | null> | null | undefined;

interface FreeRange {
  label: string;
  duration: string;
  durationMinutes: number;
}

type StationWithRanges = Station & {
  freeRanges: FreeRange[];
};

interface UseFreeTimeSlotsOptions {
  stations: Station[];
  reservations: Reservation[];
  workingHours: WorkingHours;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function useFreeTimeSlots({
  stations,
  reservations,
  workingHours,
}: UseFreeTimeSlotsOptions): StationWithRanges[] {
  return useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinutes;
    const today = format(now, 'yyyy-MM-dd');

    const todayDayName = DAY_NAMES[getDay(now)];
    const todayHours = workingHours?.[todayDayName];
    const workStart = todayHours?.open ? parseMinutes(todayHours.open) : 8 * 60;
    const workEnd = todayHours?.close ? parseMinutes(todayHours.close) : 18 * 60;

    return stations.map((station) => {
      const stationReservations = reservations
        .filter((r) => r.station_id === station.id && r.reservation_date === today)
        .map((r) => ({
          start: parseMinutes(r.start_time),
          end: parseMinutes(r.end_time),
        }))
        .sort((a, b) => a.start - b.start);

      const gaps: { start: number; end: number }[] = [];
      let searchStart = Math.max(workStart, currentTimeMinutes);

      for (const res of stationReservations) {
        if (res.start > searchStart) {
          gaps.push({ start: searchStart, end: res.start });
        }
        searchStart = Math.max(searchStart, res.end);
      }

      if (searchStart < workEnd) {
        gaps.push({ start: searchStart, end: workEnd });
      }

      const freeRanges: FreeRange[] = gaps.map((gap) => {
        const startHour = Math.floor(gap.start / 60);
        const startMin = gap.start % 60;
        const endHour = Math.floor(gap.end / 60);
        const endMin = gap.end % 60;
        const durationHours = (gap.end - gap.start) / 60;
        const startStr = `${startHour}:${startMin.toString().padStart(2, '0')}`;
        const endStr = `${endHour}:${endMin.toString().padStart(2, '0')}`;
        const durationStr =
          durationHours >= 1
            ? `${Math.floor(durationHours)}h${durationHours % 1 > 0 ? ` ${Math.round((durationHours % 1) * 60)}min` : ''}`
            : `${Math.round(durationHours * 60)}min`;
        return {
          label: `${startStr} - ${endStr}`,
          duration: durationStr,
          durationMinutes: gap.end - gap.start,
        };
      });

      return { ...station, freeRanges };
    });
  }, [stations, reservations, workingHours]);
}
