import { DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { Phone, FileText, RefreshCw } from 'lucide-react';
import { parseTime } from './useCalendarWorkingHours';
import { getStatusColor } from './types';
import type { Reservation } from '@/types/reservation';
import type { HallConfig } from '../AdminCalendar';

interface Employee {
  id: string;
  name: string;
  photo_url: string | null;
}

interface ReservationBlockProps {
  reservation: Reservation;
  displayStart: string;
  displayEnd: string;
  style: { top: string; height: string };
  overlapInfo: { hasOverlap: boolean; index: number; total: number };
  isDragging: boolean;
  isAnyDragging: boolean;
  isSelected: boolean;
  hallMode: boolean;
  hallConfig?: HallConfig;
  hallDataVisible?: boolean;
  isMobile: boolean;
  stationType: string;
  employees: Employee[];
  showEmployeesOnReservations: boolean;
  zIndex: number;
  onDragStart: (e: DragEvent<HTMLDivElement>, reservation: Reservation) => void;
  onDragEnd: () => void;
  onClick: (reservation: Reservation) => void;
}

const OVERLAP_OFFSET_PX = 10;

export function ReservationBlock({
  reservation,
  displayStart,
  displayEnd,
  style,
  overlapInfo,
  isDragging,
  isAnyDragging,
  isSelected,
  hallMode,
  hallConfig,
  hallDataVisible,
  isMobile,
  stationType,
  employees,
  showEmployeesOnReservations,
  zIndex,
  onDragStart,
  onDragEnd,
  onClick,
}: ReservationBlockProps) {
  const isMultiDay = reservation.end_date && reservation.end_date !== reservation.reservation_date;
  const leftOffset = overlapInfo.hasOverlap ? overlapInfo.index * OVERLAP_OFFSET_PX : 0;
  const durationMinutes = (parseTime(displayEnd) - parseTime(displayStart)) * 60;

  return (
    <div
      draggable={!hallMode && !isMobile}
      onDragStart={(e) => onDragStart(e, reservation)}
      onDragEnd={onDragEnd}
      className={cn(
        'absolute rounded-lg border px-1 md:px-2 py-0 md:py-1 md:pb-1.5',
        !hallMode && !isMobile && 'cursor-grab active:cursor-grabbing',
        (hallMode || isMobile) && 'cursor-pointer',
        'transition-all duration-150 hover:shadow-lg hover:z-20',
        'overflow-hidden select-none',
        getStatusColor(reservation.status, stationType),
        isDragging && 'opacity-30 scale-95',
        !isDragging && isAnyDragging && 'pointer-events-none',
        isSelected && 'border-4 shadow-lg z-30',
      )}
      style={{
        ...style,
        left: `calc(${leftOffset}px + 2px)`,
        right: '2px',
        zIndex: isSelected ? 30 : zIndex,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(reservation);
      }}
    >
      <div className="px-0.5 text-black">
        {/* Time range + action buttons */}
        <div className="flex items-center justify-between gap-0.5">
          {hallMode ? (
            <div className="text-[13px] md:text-[16px] font-bold truncate pb-0.5 flex items-center gap-1">
              {isMultiDay
                ? `${displayStart.slice(0, 5)} - ${displayEnd.slice(0, 5)}`
                : `${reservation.start_time.slice(0, 5)} - ${reservation.end_time.slice(0, 5)}`}
            </div>
          ) : (
            <span className="text-[13px] md:text-[15px] font-bold tabular-nums shrink-0 flex items-center gap-1 pb-0.5">
              {isMultiDay
                ? `${displayStart.slice(0, 5)} - ${displayEnd.slice(0, 5)}`
                : `${reservation.start_time.slice(0, 5)} - ${reservation.end_time.slice(0, 5)}`}
              {reservation.status === 'change_requested' && (
                <RefreshCw className="w-3 h-3 text-red-600" />
              )}
            </span>
          )}
          {!hallMode && (
            <div className="flex items-center gap-0.5 shrink-0">
              {(reservation.admin_notes || reservation.customer_notes) && (
                <div
                  className="p-0.5 rounded"
                  title={reservation.admin_notes || reservation.customer_notes || ''}
                >
                  <FileText className="w-3 h-3 opacity-70" />
                </div>
              )}
              {reservation.customer_phone && isMobile && (
                <a
                  href={`tel:${reservation.customer_phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-0.5 rounded hover:bg-white/20 transition-colors"
                  title={reservation.customer_phone}
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Vehicle plate + customer name */}
        {hallMode ? (
          <div className="flex items-center gap-1 text-[13px] md:text-[15px] min-w-0">
            {hallConfig?.visible_fields?.vehicle_plate !== false && (
              <span className="font-semibold truncate max-w-[50%]">
                {reservation.vehicle_plate}
              </span>
            )}
            {hallConfig?.visible_fields?.customer_name && hallDataVisible && (
              <span className="truncate min-w-0">{reservation.customer_name}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs md:text-sm min-w-0">
            <span className="font-semibold truncate max-w-[50%]">
              {reservation.vehicle_plate}
            </span>
            <span className="truncate min-w-0">{reservation.customer_name}</span>
          </div>
        )}

        {/* Service chips */}
        <ServiceChips
          reservation={reservation}
          hallMode={hallMode}
          hallConfig={hallConfig}
          hallDataVisible={hallDataVisible}
        />

        {/* Assigned employees */}
        {showEmployeesOnReservations &&
          reservation.assigned_employee_ids &&
          reservation.assigned_employee_ids.length > 0 && (
            <EmployeeChips
              employeeIds={reservation.assigned_employee_ids}
              employees={employees}
            />
          )}

        {/* Offer number */}
        {!hallMode && reservation.offer_number && (
          <div className="text-[10px] font-mono mt-0.5">#{reservation.offer_number}</div>
        )}

        {/* Notes */}
        {(() => {
          const notesToShow = reservation.admin_notes || reservation.customer_notes;
          const showNotes = hallMode
            ? hallConfig?.visible_fields?.admin_notes &&
              hallDataVisible &&
              durationMinutes > 30 &&
              notesToShow
            : durationMinutes > 30 && notesToShow;
          if (showNotes) {
            return (
              <div
                className="text-[14px] mt-0.5 break-words overflow-hidden"
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 'unset',
                }}
              >
                {notesToShow}
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}

// Sub-components to keep ReservationBlock readable

function ServiceChips({
  reservation,
  hallMode,
  hallConfig,
  hallDataVisible,
}: {
  reservation: Reservation;
  hallMode: boolean;
  hallConfig?: HallConfig;
  hallDataVisible?: boolean;
}) {
  const hasServicesData = reservation.services_data && reservation.services_data.length > 0;
  const chipSize = hallMode ? 'text-[10px] md:text-[11px]' : 'text-[9px] md:text-[10px]';

  if (hallMode && hallConfig?.visible_fields?.services === false) return null;

  if (hasServicesData) {
    return (
      <div className="flex flex-wrap gap-0.5 mt-0.5">
        {reservation.services_data!.map((svc, idx) => (
          <span
            key={idx}
            className={`inline-block px-1 py-0.5 ${chipSize} font-medium bg-slate-700/90 text-white rounded leading-none`}
          >
            {svc.shortcut || svc.name}
          </span>
        ))}
      </div>
    );
  }

  if (reservation.service) {
    return (
      <div className="flex flex-wrap gap-0.5 mt-0.5">
        <span
          className={`inline-block px-1 py-0.5 ${chipSize} font-medium bg-slate-700/90 text-white rounded leading-none`}
        >
          {reservation.service.shortcut || reservation.service.name}
        </span>
      </div>
    );
  }

  return null;
}

function EmployeeChips({
  employeeIds,
  employees,
}: {
  employeeIds: string[];
  employees: Employee[];
}) {
  const assignedEmps = employeeIds
    .map((id) => employees.find((e) => e.id === id))
    .filter((e): e is Employee => !!e);

  if (assignedEmps.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {assignedEmps.slice(0, 2).map((emp) => (
        <span
          key={emp.id}
          className="inline-flex items-center px-2.5 py-1 text-[12px] md:text-[13px] font-semibold bg-primary text-primary-foreground rounded-md leading-none"
        >
          {emp.name.split(' ')[0]}
        </span>
      ))}
      {assignedEmps.length > 2 && (
        <span className="inline-flex items-center px-2.5 py-1 text-[12px] md:text-[13px] font-semibold bg-primary/90 text-primary-foreground rounded-md leading-none">
          +{assignedEmps.length - 2}
        </span>
      )}
    </div>
  );
}
