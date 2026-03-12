import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@shared/ui';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import type { SalesRoll } from '../types/rolls';
import { formatMbM2 } from '../types/rolls';

interface RollUsage {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  usedM2: number;
  usedMb: number;
  createdAt: string;
}

interface RollUsageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roll: SalesRoll | null;
}

const RollUsageDrawer = ({ open, onOpenChange, roll }: RollUsageDrawerProps) => {
  const [usages, setUsages] = useState<RollUsage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !roll) {
      setUsages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Fetch usages for this roll
        const { data: usageRows, error } = await (supabase
          .from('sales_roll_usages')
          .select('id, order_id, used_m2, used_mb, created_at')
          .eq('roll_id', roll.id)
          .order('created_at', { ascending: false }) as any);

        if (error || cancelled) return;

        // Fetch order details for all unique order IDs
        const orderIds = [...new Set((usageRows || []).map((u: any) => u.order_id))];
        let orderMap: Record<string, { orderNumber: string; customerName: string }> = {};

        if (orderIds.length > 0) {
          const { data: orders } = await (supabase
            .from('sales_orders')
            .select('id, order_number, customer_name')
            .in('id', orderIds) as any);

          if (orders) {
            for (const o of orders as { id: string; order_number: string; customer_name: string }[]) {
              orderMap[o.id] = { orderNumber: o.order_number, customerName: o.customer_name };
            }
          }
        }

        if (!cancelled) {
          setUsages(
            (usageRows || []).map((u: any) => ({
              id: u.id,
              orderId: u.order_id,
              orderNumber: orderMap[u.order_id]?.orderNumber || '—',
              customerName: orderMap[u.order_id]?.customerName || '—',
              usedM2: Number(u.used_m2),
              usedMb: Number(u.used_mb),
              createdAt: u.created_at,
            }))
          );
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, roll]);

  const totalUsedMb = usages.reduce((sum, u) => sum + u.usedMb, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            Zużycie rolki: {roll?.productName || ''}
          </SheetTitle>
          {roll && (
            <p className="text-sm text-muted-foreground">
              {roll.barcode || roll.productCode || 'Brak kodu'} &middot;{' '}
              Na stanie: {formatMbM2(roll.initialLengthM, roll.widthMm)} &middot;{' '}
              Zużyto: {formatMbM2(totalUsedMb, roll.widthMm)} &middot;{' '}
              Pozostało: {formatMbM2(roll.remainingMb || 0, roll.widthMm)}
            </p>
          )}
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Ładowanie...</p>
          ) : usages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Brak zarejestrowanego zużycia
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zamówienie</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead className="text-right">Zużycie</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usages.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-sm">
                      {u.orderNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.customerName}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {u.usedM2.toFixed(2)} m²
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(u.createdAt), 'dd.MM.yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RollUsageDrawer;
