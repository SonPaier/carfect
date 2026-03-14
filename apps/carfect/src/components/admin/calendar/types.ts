import type { DragEvent } from 'react';

export interface Station {
  id: string;
  name: string;
  type: string;
  color?: string | null;
}

export interface Reservation {
  id: string;
  customer_name: string;
  customer_phone?: string;
  vehicle_plate: string;
  reservation_date: string;
  end_date?: string | null;
  start_time: string;
  end_time: string;
  station_id: string | null;
  status: string;
  customer_notes?: string | null;
  admin_notes?: string | null;
  offer_number?: string | null;
  assigned_employee_ids?: string[] | null;
  service?: {
    name: string;
    shortcut?: string | null;
  };
  services_data?: Array<{
    name: string;
    shortcut?: string | null;
  }>;
  station?: {
    type?: string;
  };
}

export interface ClosedDay {
  id: string;
  closed_date: string;
  reason: string | null;
}

export interface DragHandlers {
  onDragStart: (e: DragEvent<HTMLButtonElement>, reservation: Reservation) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, dateStr: string) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, dateStr: string) => void;
  draggedId: string | null;
  dragOverDate: string | null;
}

export const getStatusColor = (status: string, stationType?: string) => {
  if (stationType === 'ppf') {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-200 border-emerald-400 text-emerald-900';
      case 'pending':
        return 'bg-amber-100 border-amber-300 text-amber-900';
      case 'in_progress':
        return 'bg-orange-200 border-orange-400 text-orange-900';
      case 'completed':
        return 'bg-slate-200 border-slate-400 text-slate-700';
      case 'cancelled':
        return 'bg-slate-100/40 border-slate-200 text-slate-500 line-through opacity-60';
      case 'change_requested':
        return 'bg-red-200 border-red-400 text-red-900';
      default:
        return 'bg-amber-100 border-amber-300 text-amber-900';
    }
  }

  switch (status) {
    case 'pending':
      return 'bg-amber-100 border-amber-300 text-amber-900';
    case 'confirmed':
      return 'bg-emerald-200 border-emerald-400 text-emerald-900';
    case 'in_progress':
      return 'bg-orange-200 border-orange-400 text-orange-900';
    case 'completed':
      return 'bg-slate-200 border-slate-400 text-slate-700';
    case 'cancelled':
      return 'bg-red-100/60 border-red-300 text-red-700 line-through opacity-60';
    case 'change_requested':
      return 'bg-red-200 border-red-400 text-red-900';
    default:
      return 'bg-amber-100 border-amber-300 text-amber-900';
  }
};
