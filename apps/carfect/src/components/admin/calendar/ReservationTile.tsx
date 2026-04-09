import { DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@shared/ui';
import type { Reservation, Station } from './types';
import { getStatusColor } from './types';

interface EmployeeInfo {
  id: string;
  name: string;
}

interface ReservationTileProps {
  reservation: Reservation;
  stations: Station[];
  onClick: (reservation: Reservation) => void;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: DragEvent<HTMLButtonElement>, reservation: Reservation) => void;
  onDragEnd?: () => void;
  showStationName?: boolean;
  employees?: EmployeeInfo[];
}

export const ReservationTile = ({
  reservation,
  stations,
  onClick,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  showStationName = false,
  employees = [],
}: ReservationTileProps) => {
  const isMobile = useIsMobile();
  const station = stations.find((s) => s.id === reservation.station_id);
  const stationColor = station?.color;
  const serviceName =
    reservation.service?.shortcut ||
    reservation.service?.name ||
    reservation.services_data?.[0]?.shortcut ||
    reservation.services_data?.[0]?.name ||
    '';

  const tileStyle = stationColor
    ? {
        borderLeftColor: stationColor,
      }
    : undefined;

  return (
    <button
      draggable={draggable}
      onDragStart={onDragStart ? (e) => onDragStart(e, reservation) : undefined}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onClick(reservation);
      }}
      className={cn(
        'text-left rounded-sm px-1.5 py-0.5 w-full border-l-[3px] transition-opacity shrink-0',
        'hover:opacity-80 cursor-pointer',
        getStatusColor(reservation.status, station?.type),
        isDragging && 'opacity-40',
        !stationColor && 'border-l-muted-foreground/30',
      )}
      style={tileStyle}
    >
      {isMobile ? (
        <div className="text-[10px] font-semibold line-clamp-1">
          {serviceName || reservation.customer_name}
        </div>
      ) : (
        <>
          {/* Line 1: Time + Service */}
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[11px] font-bold tabular-nums shrink-0">
              {reservation.start_time?.slice(0, 5)}
            </span>
            {serviceName && <span className="text-[11px] font-bold truncate">{serviceName}</span>}
          </div>
          {/* Line 2: Customer name */}
          <div className="text-[10px] truncate opacity-80">{reservation.customer_name}</div>
          {/* Line 3: Vehicle plate */}
          {reservation.vehicle_plate && (
            <div className="text-[9px] truncate opacity-60">{reservation.vehicle_plate}</div>
          )}
          {/* Line 4: Station name */}
          {showStationName && station?.name && (
            <div className="text-[9px] truncate opacity-50 font-medium">{station.name}</div>
          )}
          {/* Line 5: Assigned employees */}
          {employees.length > 0 &&
            reservation.assigned_employee_ids &&
            reservation.assigned_employee_ids.length > 0 &&
            (() => {
              const assigned = reservation.assigned_employee_ids
                .map((id) => employees.find((e) => e.id === id))
                .filter((e): e is EmployeeInfo => !!e);
              if (assigned.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {assigned.slice(0, 2).map((emp) => (
                    <span
                      key={emp.id}
                      className="text-[8px] px-1 py-0.5 bg-primary/20 text-primary rounded font-medium leading-none"
                    >
                      {emp.name.split(' ')[0]}
                    </span>
                  ))}
                  {assigned.length > 2 && (
                    <span className="text-[8px] px-1 py-0.5 bg-primary/10 text-primary rounded font-medium leading-none">
                      +{assigned.length - 2}
                    </span>
                  )}
                </div>
              );
            })()}
        </>
      )}
    </button>
  );
};
