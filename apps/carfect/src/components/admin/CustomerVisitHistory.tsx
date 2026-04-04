import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@shared/ui';
import { usePricingMode } from '@/hooks/usePricingMode';

interface VisitHistoryItem {
  id: string;
  reservation_date: string;
  start_time: string;
  vehicle_plate: string;
  service_name: string | null;
  price: number | null;
  price_netto: number | null;
  status: string | null;
  admin_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface CustomerVisitHistoryProps {
  customerPhone: string;
  instanceId: string;
  showNotes?: boolean;
  showDuration?: boolean;
  onOpenReservation?: (reservationId: string) => void;
}

function formatDuration(startedAt: string, completedAt: string): string | null {
  const start = new Date(startedAt);
  const end = new Date(completedAt);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}min`;
}

export const CustomerVisitHistory = ({
  customerPhone,
  instanceId,
  showNotes = false,
  showDuration = false,
  onOpenReservation,
}: CustomerVisitHistoryProps) => {
  const [visits, setVisits] = useState<VisitHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pricingMode = usePricingMode(instanceId);

  useEffect(() => {
    let cancelled = false;

    const fetchVisitHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select(
          `id, reservation_date, start_time, vehicle_plate, price, price_netto, status, service_ids, service_items, admin_notes, started_at, completed_at`,
        )
        .eq('instance_id', instanceId)
        .eq('customer_phone', customerPhone)
        .neq('status', 'cancelled')
        .order('reservation_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (cancelled) return;

      if (error || !data) {
        setLoading(false);
        return;
      }

      // Collect unique service IDs to resolve names
      const allServiceIds = new Set<string>();
      data.forEach((v) => {
        const items = v.service_items as { service_id?: string }[] | null;
        if (items?.length) {
          items.forEach((item) => {
            if (item.service_id) allServiceIds.add(item.service_id);
          });
        }
        const ids = v.service_ids as string[];
        if (ids?.length) {
          ids.forEach((id) => allServiceIds.add(id));
        }
      });

      // Fetch service names
      const serviceNamesMap = new Map<string, string>();
      if (allServiceIds.size > 0) {
        const { data: services } = await supabase
          .from('unified_services')
          .select('id, name, short_name')
          .in('id', Array.from(allServiceIds));
        if (cancelled) return;
        if (services) {
          services.forEach((s) => serviceNamesMap.set(s.id, s.short_name || s.name));
        }
      }

      if (cancelled) return;

      setVisits(
        data.map((v) => {
          let serviceName: string | null = null;
          const items = v.service_items as
            | { service_id?: string; short_name?: string; name?: string }[]
            | null;
          if (items?.length) {
            serviceName =
              items
                .map(
                  (item) =>
                    item.short_name ||
                    item.name ||
                    (item.service_id ? serviceNamesMap.get(item.service_id) : null) ||
                    null,
                )
                .filter(Boolean)
                .join(', ') || null;
          }
          if (!serviceName) {
            const ids = v.service_ids as string[];
            if (ids?.length) {
              serviceName =
                ids
                  .map((id) => serviceNamesMap.get(id) || null)
                  .filter(Boolean)
                  .join(', ') || null;
            }
          }

          return {
            id: v.id,
            reservation_date: v.reservation_date,
            start_time: v.start_time,
            vehicle_plate: v.vehicle_plate,
            service_name: serviceName,
            price: v.price,
            price_netto: v.price_netto ?? null,
            status: v.status,
            admin_notes: (v.admin_notes as string) ?? null,
            started_at: v.started_at ?? null,
            completed_at: v.completed_at ?? null,
          };
        }),
      );
      setLoading(false);
    };

    fetchVisitHistory();
    return () => {
      cancelled = true;
    };
  }, [customerPhone, instanceId]);

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Ładowanie...</div>;
  }

  if (visits.length === 0) {
    return <EmptyState icon={Clock} title="Brak historii wizyt" />;
  }

  return (
    <div className="space-y-2">
      {visits.map((visit) => {
        const duration =
          showDuration && visit.started_at && visit.completed_at
            ? formatDuration(visit.started_at, visit.completed_at)
            : null;

        return (
          <button
            type="button"
            key={visit.id}
            onClick={() => onOpenReservation?.(visit.id)}
            className="w-full text-left p-3 bg-white dark:bg-card rounded-lg border border-border shadow-sm hover:bg-hover transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">
                  {format(new Date(visit.reservation_date), 'd MMMM yyyy', { locale: pl })},{' '}
                  {visit.start_time?.slice(0, 5)}
                </span>
                {visit.status === 'no_show' && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600">
                    Nieobecny
                  </span>
                )}
              </div>
              {visit.price != null && (
                <div className="text-sm text-foreground">
                  {pricingMode === 'netto' && visit.price_netto != null
                    ? `${visit.price_netto} zł`
                    : `${visit.price} zł`}
                </div>
              )}
            </div>
            {visit.vehicle_plate && (
              <div className="text-sm text-foreground">{visit.vehicle_plate}</div>
            )}
            {visit.service_name && (
              <div className="text-sm text-foreground">{visit.service_name}</div>
            )}
            {duration && <div className="text-sm text-foreground">Czas wykonania: {duration}</div>}
            {showNotes && visit.admin_notes && (
              <div className="mt-2 text-sm text-foreground">
                <span className="whitespace-pre-wrap">{visit.admin_notes}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export { type VisitHistoryItem };
