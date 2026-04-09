import { DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@shared/ui';
import type { Reservation, Station } from './types';
import { getStatusColor } from './types';

interface ReservationTileProps {
  reservation: Reservation;
  stations: Station[];
  onClick: (reservation: Reservation) => void;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: DragEvent<HTMLButtonElement>, reservation: Reservation) => void;
  onDragEnd?: () => void;
  showStationName?: boolean;
  employees?: { id: string; name: string }[];
}

export const ReservationTile = ({
  reservation,
  stations,
  onClick,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showStationName: _showStationName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  employees: _employees,
}: ReservationTileProps) => {
  const isMobile = useIsMobile();
  const station = stations.find(s => s.id === reservation.station_id);
  const stationColor = station?.color;
  const serviceName = reservation.service?.shortcut || reservation.service?.name ||
    reservation.services_data?.[0]?.shortcut || reservation.services_data?.[0]?.name || '';

  const tileStyle = stationColor ? {
    borderLeftColor: stationColor,
  } : undefined;

  return (
    <button
      draggable={draggable}
      onDragStart={onDragStart ? (e) => onDragStart(e, reservation) : undefined}
      onDragEnd={onDragEnd}
      onClick={(e) => { e.stopPropagation(); onClick(reservation); }}
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
            <span className="text-[12px] font-bold tabular-nums shrink-0 text-foreground">
              {reservation.start_time?.slice(0, 5)}
            </span>
            {serviceName && (
              <span className="text-[12px] font-bold truncate text-foreground">
                {serviceName}
              </span>
            )}
          </div>
          {/* Line 2: Customer name */}
          <div className="text-[11px] truncate font-medium text-foreground">
            {reservation.customer_name}
          </div>
          {/* Line 3: Vehicle plate */}
          {reservation.vehicle_plate && (
            <div className="text-[11px] truncate font-semibold text-foreground">
              {reservation.vehicle_plate}
            </div>
          )}
        </>
      )}
    </button>
  );
};
