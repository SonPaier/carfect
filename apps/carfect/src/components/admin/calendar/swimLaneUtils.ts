import type { Reservation } from './types';

export interface WeekEvent {
  reservation: Reservation;
  startCol: number;
  span: number;
  lane: number;
  isStart: boolean;
  isEnd: boolean;
}

export function toDateOnly(dateStr: string): Date {
  // parseISO gives us UTC midnight; we need local date comparison
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function assignLanes(events: WeekEvent[]): void {
  // Sort: earlier start column first, then longer spans first, then earlier time
  events.sort((a, b) =>
    a.startCol - b.startCol ||
    b.span - a.span ||
    (a.reservation.start_time || '').localeCompare(b.reservation.start_time || '')
  );
  const laneEnds: number[] = []; // tracks end column (exclusive) of last event in each lane
  for (const event of events) {
    // Find the first lane where this event fits (no overlap)
    let assigned = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] <= event.startCol) {
        assigned = i;
        break;
      }
    }
    if (assigned === -1) {
      assigned = laneEnds.length;
      laneEnds.push(0);
    }
    event.lane = assigned;
    laneEnds[assigned] = event.startCol + event.span;
  }
}

export function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
