import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReservationTile } from './ReservationTile';
import type { Reservation, Station, DragHandlers, GroupBy } from './types';

type Section = { label: string; color?: string | null; reservations: Reservation[] };

function groupReservations(
  reservations: Reservation[],
  groupBy: GroupBy,
  stations: Station[],
  employees: { id: string; name: string }[],
): Section[] {
  if (groupBy === 'none') return [{ label: '', reservations }];

  if (groupBy === 'station') {
    const buckets = new Map<string, Section>();
    for (const station of stations) {
      buckets.set(station.id, { label: station.name, color: station.color, reservations: [] });
    }
    const noStation: Section = { label: 'Bez stanowiska', reservations: [] };
    for (const r of reservations) {
      const bucket = r.station_id ? buckets.get(r.station_id) : null;
      if (bucket) bucket.reservations.push(r);
      else noStation.reservations.push(r);
    }
    const result = [...buckets.values()].filter(s => s.reservations.length > 0);
    if (noStation.reservations.length > 0) result.push(noStation);
    return result;
  }

  // employee
  const empMap = new Map(employees.map(e => [e.id, e.name]));
  const buckets = new Map<string, Section>();
  const unassigned: Section = { label: 'Nieprzypisane', reservations: [] };
  for (const r of reservations) {
    const ids = r.assigned_employee_ids ?? [];
    if (ids.length === 0) { unassigned.reservations.push(r); continue; }
    for (const empId of ids) {
      if (!buckets.has(empId)) buckets.set(empId, { label: empMap.get(empId) ?? empId, reservations: [] });
      buckets.get(empId)!.reservations.push(r);
    }
  }
  const result = [...buckets.values()];
  if (unassigned.reservations.length > 0) result.push(unassigned);
  return result;
}

interface CalendarDayCellProps {
  date: Date;
  reservations: Reservation[];
  stations: Station[];
  isToday: boolean;
  isCurrentMonth?: boolean;
  isClosed: boolean;
  onDayClick: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
  onAddClick?: (date: Date) => void;
  dragHandlers: DragHandlers;
  groupBy?: GroupBy;
  employees?: { id: string; name: string }[];
  showStationName?: boolean;
}

export const CalendarDayCell = ({
  date,
  reservations,
  stations,
  isToday,
  isCurrentMonth = true,
  isClosed,
  onDayClick,
  onReservationClick,
  onAddClick,
  dragHandlers,
  groupBy = 'none',
  employees = [],
  showStationName,
}: CalendarDayCellProps) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const isDragOver = dragHandlers.dragOverDate === dateStr;

  return (
    <div
      className={cn(
        'border-r border-border last:border-r-0 p-1 flex flex-col min-h-0 overflow-hidden overflow-y-auto transition-colors bg-white dark:bg-card',
        isDragOver && 'bg-primary/10 ring-1 ring-inset ring-primary/30',
        isClosed && 'bg-red-50 dark:bg-red-950/20',
      )}
      onDragOver={(e) => dragHandlers.onDragOver(e, dateStr)}
      onDragLeave={dragHandlers.onDragLeave}
      onDrop={(e) => dragHandlers.onDrop(e, dateStr)}
    >
      {/* Day number */}
      <button
        onClick={() => onDayClick(date)}
        className={cn(
          'text-xs font-medium mb-0.5 w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors self-start shrink-0',
          isToday && 'bg-primary text-primary-foreground hover:bg-primary/90',
          !isCurrentMonth && 'text-muted-foreground/40',
          isClosed && !isToday && 'text-red-500',
        )}
      >
        {format(date, 'd')}
      </button>

      {/* Reservation tiles */}
      <div className="flex flex-col gap-0.5 min-h-0 flex-1">
        {(() => {
          const sections = groupReservations(reservations, groupBy, stations, employees);
          const showHeaders = groupBy === 'station' || groupBy === 'employee';
          return sections.map((section, sIdx) => (
            <div key={sIdx} className="flex flex-col gap-0.5">
              {showHeaders && section.label && (
                <div
                  className="text-[9px] font-bold pl-0.5 border-l-2 leading-tight truncate mt-0.5"
                  style={section.color ? { borderColor: section.color } : { borderColor: 'transparent' }}
                >
                  {section.label}
                </div>
              )}
              {section.reservations.map((reservation) => (
                <ReservationTile
                  key={`${reservation.id}-${dateStr}-${sIdx}`}
                  reservation={reservation}
                  stations={stations}
                  onClick={onReservationClick}
                  draggable={!!dragHandlers.onDrop}
                  isDragging={dragHandlers.draggedId === reservation.id}
                  onDragStart={dragHandlers.onDragStart}
                  onDragEnd={dragHandlers.onDragEnd}
                  showStationName={showStationName}
                  employees={employees}
                />
              ))}
            </div>
          ));
        })()}

        {/* Add reservation button */}
        {onAddClick && !isClosed && isCurrentMonth && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(date); }}
            className="flex items-center justify-center gap-1 text-xs font-bold text-black hover:text-primary transition-colors mt-auto pt-1 w-full group"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj</span>
          </button>
        )}
      </div>
    </div>
  );
};
