import type { Reservation, ServiceItem } from '@/types/reservation';
import type { Database } from '@/integrations/supabase/types';

type ReservationRow = Database['public']['Tables']['reservations']['Row'];

export interface ServicesMapEntry {
  id: string;
  name: string;
  shortcut?: string | null;
  price_small?: number | null;
  price_medium?: number | null;
  price_large?: number | null;
  price_from?: number | null;
}

export type ServicesMap = Map<string, ServicesMapEntry>;

export interface MapRawReservationOptions {
  /** Include price fields in services_data. Default: true */
  includePrices?: boolean;
}

/**
 * Raw reservation data as it comes from a Supabase query with joined `stations`.
 * Extends the DB Row type with the optional `stations` relation join.
 */
export type RawReservation = ReservationRow & {
  stations?: { name: string; type: string } | null;
};

type ServiceDataEntry = NonNullable<Reservation['services_data']>[number];

/**
 * Maps a raw reservation record (from Supabase query or realtime payload)
 * to the canonical Reservation type.
 *
 * Canonical logic:
 * - service_ids is the primary source of selected services
 * - service_items is used to enrich with metadata (names, shortcuts, prices)
 * - If service_ids is missing, falls back to service_items with deduplication
 */
export function mapRawReservation(
  raw: RawReservation,
  servicesMap: ServicesMap,
  options?: MapRawReservationOptions,
): Reservation {
  const includePrices = options?.includePrices !== false;

  // Json fields need runtime validation — DB types are Json, not typed arrays
  const serviceItems = Array.isArray(raw.service_items)
    ? (raw.service_items as ServiceItem[])
    : null;
  const serviceIds = Array.isArray(raw.service_ids) ? (raw.service_ids as string[]) : null;
  const assignedEmployeeIds = Array.isArray(raw.assigned_employee_ids)
    ? (raw.assigned_employee_ids as string[])
    : undefined;
  const checkedServiceIds = Array.isArray(raw.checked_service_ids)
    ? (raw.checked_service_ids as string[])
    : undefined;

  const servicesDataMapped = mapServicesData(serviceIds, serviceItems, servicesMap, includePrices);

  return {
    ...raw,
    status: raw.status || 'pending',
    service_ids: serviceIds ?? undefined,
    service_items: serviceItems ?? undefined,
    assigned_employee_ids: assignedEmployeeIds,
    services_data: servicesDataMapped.length > 0 ? servicesDataMapped : undefined,
    station: raw.stations ? { name: raw.stations.name, type: raw.stations.type } : undefined,
    has_unified_services: raw.has_unified_services ?? null,
    checked_service_ids: checkedServiceIds,
    created_by_username: raw.created_by_username || null,
  } as Reservation;
}

function mapServicesData(
  serviceIds: string[] | null,
  serviceItems: ServiceItem[] | null,
  servicesMap: ServicesMap,
  includePrices: boolean,
): ServiceDataEntry[] {
  // Primary: service_ids is canonical list, enrich from service_items + servicesMap
  if (serviceIds && serviceIds.length > 0) {
    const itemsById = new Map<string, ServiceItem>();
    if (serviceItems) {
      for (const item of serviceItems) {
        const key = item.id || item.service_id;
        if (key) itemsById.set(key, item);
      }
    }

    return serviceIds.map((id) => {
      const item = itemsById.get(id);
      const svc = servicesMap.get(id);

      const entry: ServiceDataEntry = {
        id,
        name: item?.name ?? svc?.name ?? 'Usługa',
        shortcut: item?.short_name ?? svc?.shortcut ?? null,
      };

      if (includePrices) {
        entry.price_small = item?.price_small ?? svc?.price_small ?? null;
        entry.price_medium = item?.price_medium ?? svc?.price_medium ?? null;
        entry.price_large = item?.price_large ?? svc?.price_large ?? null;
        entry.price_from = item?.price_from ?? svc?.price_from ?? null;
      }

      return entry;
    });
  }

  // Fallback: no service_ids, use service_items with deduplication
  if (serviceItems && serviceItems.length > 0) {
    const seen = new Set<string>();
    return serviceItems
      .map((item) => {
        const resolvedId = item.id || item.service_id;
        const svc = resolvedId ? servicesMap.get(resolvedId) : undefined;

        const entry: ServiceDataEntry = {
          id: resolvedId,
          name: item.name ?? svc?.name ?? 'Usługa',
          shortcut: item.short_name ?? svc?.shortcut ?? null,
        };

        if (includePrices) {
          entry.price_small = item.price_small ?? svc?.price_small ?? null;
          entry.price_medium = item.price_medium ?? svc?.price_medium ?? null;
          entry.price_large = item.price_large ?? svc?.price_large ?? null;
          entry.price_from = item.price_from ?? svc?.price_from ?? null;
        }

        return entry;
      })
      .filter((svc) => {
        if (!svc.id) return false;
        if (seen.has(svc.id)) return false;
        seen.add(svc.id);
        return true;
      });
  }

  return [];
}
