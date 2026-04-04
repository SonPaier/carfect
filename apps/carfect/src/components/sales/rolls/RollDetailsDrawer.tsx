import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import type { SalesRoll } from '../types/rolls';
import { formatRollSize, formatMbM2 } from '../types/rolls';
import RollUsageTab from './RollUsageTab';

interface RollUsage {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  usedM2: number;
  usedMb: number;
  createdAt: string;
}

interface RollDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roll: SalesRoll | null;
  onEdit?: (roll: SalesRoll) => void;
  onViewOrder?: (orderId: string) => void;
  onUsageChange?: () => void;
}

const RollDetailsDrawer = ({
  open,
  onOpenChange,
  roll,
  onEdit,
  onViewOrder,
  onUsageChange,
}: RollDetailsDrawerProps) => {
  const [tab, setTab] = useState('dane');
  const [usages, setUsages] = useState<RollUsage[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);

  // Reset tab when opening
  useEffect(() => {
    if (open) setTab('dane');
  }, [open]);

  // Fetch usages when orders tab is selected
  useEffect(() => {
    if (!open || !roll || tab !== 'zamowienia') return;

    let cancelled = false;
    setLoadingUsages(true);

    (async () => {
      try {
        const { data: usageRows, error } = await (supabase
          .from('sales_roll_usages')
          .select('id, order_id, used_m2, used_mb, created_at')
          .eq('roll_id', roll.id)
          .order('created_at', { ascending: false }) as any);

        if (error || cancelled) return;

        const orderIds = [...new Set((usageRows || []).map((u: any) => u.order_id).filter(Boolean))];
        const orderMap: Record<string, { orderNumber: string; customerName: string }> = {};

        if (orderIds.length > 0) {
          const { data: orders } = await (supabase
            .from('sales_orders')
            .select('id, order_number, customer_name')
            .in('id', orderIds) as any);

          if (orders) {
            for (const o of orders as {
              id: string;
              order_number: string;
              customer_name: string;
            }[]) {
              orderMap[o.id] = { orderNumber: o.order_number, customerName: o.customer_name };
            }
          }
        }

        if (!cancelled) {
          setUsages(
            (usageRows || [])
              .filter((u: any) => u.order_id)
              .map((u: any) => ({
                id: u.id,
                orderId: u.order_id,
                orderNumber: orderMap[u.order_id]?.orderNumber || '—',
                customerName: orderMap[u.order_id]?.customerName || '—',
                usedM2: Number(u.used_m2),
                usedMb: Number(u.used_mb),
                createdAt: u.created_at,
              })),
          );
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoadingUsages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, roll?.id, tab]);

  if (!roll) return null;

  const totalUsedMb = usages.reduce((sum, u) => sum + u.usedMb, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg bg-white" hideOverlay>
        <SheetHeader>
          <SheetTitle>{roll.productName}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {roll.brand} &middot; {roll.productCode || roll.barcode || 'Brak kodu'}
          </p>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="dane">Dane</TabsTrigger>
            <TabsTrigger value="zamowienia">Zamówienia</TabsTrigger>
            <TabsTrigger value="zuzycie">Zużycie</TabsTrigger>
          </TabsList>

          <TabsContent value="dane" className="space-y-4">
            {/* Photo */}
            {roll.photoUrl && (
              <img
                src={roll.photoUrl}
                alt={roll.productName}
                className="w-full max-h-48 object-contain rounded-lg border bg-muted"
              />
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Marka</span>
                <p className="font-medium">{roll.brand}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Nazwa produktu</span>
                <p className="font-medium">{roll.productName}</p>
              </div>
              {roll.description && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Opis</span>
                  <p className="font-medium">{roll.description}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Kod produktu</span>
                <p className="font-medium font-mono">{roll.productCode || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Kod kreskowy</span>
                <p className="font-medium font-mono">{roll.barcode || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Rozmiar</span>
                <p className="font-medium">{formatRollSize(roll.widthMm, roll.initialLengthM)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pełna rolka</span>
                <p className="font-medium">{formatMbM2(roll.initialLengthM, roll.widthMm)}</p>
              </div>
              {roll.initialRemainingMb < roll.initialLengthM && (
                <div>
                  <span className="text-muted-foreground">Stan przy dodaniu</span>
                  <p className="font-medium">{formatMbM2(roll.initialRemainingMb, roll.widthMm)}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Pozostało</span>
                <p
                  className={`font-medium ${
                    (roll.remainingMb || 0) <= 0
                      ? 'text-destructive'
                      : (roll.remainingMb || 0) < roll.initialRemainingMb * 0.2
                        ? 'text-orange-500'
                        : 'text-green-600'
                  }`}
                >
                  {formatMbM2(roll.remainingMb || 0, roll.widthMm)}
                </p>
              </div>
              {roll.deliveryDate && (
                <div>
                  <span className="text-muted-foreground">Data dostawy</span>
                  <p className="font-medium">
                    {format(parseISO(roll.deliveryDate), 'dd.MM.yyyy')}
                  </p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Dodano</span>
                <p className="font-medium">{format(parseISO(roll.createdAt), 'dd.MM.yyyy')}</p>
              </div>
            </div>

            {onEdit && (
              <button
                className="text-sm text-primary hover:underline"
                onClick={() => onEdit(roll)}
              >
                Edytuj dane rolki
              </button>
            )}
          </TabsContent>

          <TabsContent value="zamowienia">
            <p className="text-sm text-muted-foreground mb-4">
              Stan początkowy: {formatMbM2(roll.initialLengthM, roll.widthMm)} &middot; Zużyto:{' '}
              {formatMbM2(totalUsedMb, roll.widthMm)} &middot; Pozostało:{' '}
              {formatMbM2(roll.remainingMb || 0, roll.widthMm)}
            </p>

            {loadingUsages ? (
              <p className="text-sm text-muted-foreground text-center py-8">Ładowanie...</p>
            ) : usages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Brak zamówień dla tej rolki
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
                    <TableRow
                      key={u.id}
                      className={onViewOrder ? 'cursor-pointer hover:bg-hover-strong' : ''}
                      onClick={() => onViewOrder?.(u.orderId)}
                    >
                      <TableCell className="font-medium text-sm">{u.orderNumber}</TableCell>
                      <TableCell className="text-sm">{u.customerName}</TableCell>
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
          </TabsContent>

          <TabsContent value="zuzycie">
            <RollUsageTab roll={roll} onUsageChange={onUsageChange} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default RollDetailsDrawer;
