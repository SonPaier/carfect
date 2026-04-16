import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { Button } from '@shared/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@shared/ui';
import type { SalesRollUsage } from '../types/rolls';
import { fetchWorkerRollUsagesForMonth } from '../services/rollService';

interface EmployeeRollsDrawerProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
}

const EmployeeRollsDrawer = ({ open, onClose, instanceId }: EmployeeRollsDrawerProps) => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [usages, setUsages] = useState<SalesRollUsage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !instanceId) return;

    let cancelled = false;
    setLoading(true);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    fetchWorkerRollUsagesForMonth(instanceId, year, month)
      .then((data) => {
        if (!cancelled) setUsages(data);
      })
      .catch(() => {
        if (!cancelled) setUsages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, instanceId, currentMonth]);

  const monthLabel = format(currentMonth, 'LLLL yyyy', { locale: pl });

  // Group usages by workerName
  const grouped = usages.reduce<Record<string, SalesRollUsage[]>>((acc, usage) => {
    const name = usage.workerName ?? 'Nieznany pracownik';
    if (!acc[name]) acc[name] = [];
    acc[name].push(usage);
    return acc;
  }, {});

  const workerNames = Object.keys(grouped).sort();

  const grandTotal = usages.reduce((sum, u) => sum + u.usedM2, 0);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent
        side="right"
        className="[&>div]:!w-[80vw] [&>div]:!max-w-[80vw] flex flex-col bg-white p-0 gap-0"
        hideCloseButton
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 px-6 py-4 border-b shrink-0">
          <SheetTitle>Pracownicy i rolki</SheetTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </SheetHeader>

        {/* Month selector */}
        <div className="flex items-center gap-3 px-6 py-3 border-b shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label="Poprzedni miesiąc"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium capitalize min-w-[140px] text-center">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            aria-label="Następny miesiąc"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : usages.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-12">
              Brak zużyć w tym miesiącu
            </div>
          ) : (
            <>
              {workerNames.map((workerName) => {
                const workerUsages = grouped[workerName];
                const workerTotal = workerUsages.reduce((sum, u) => sum + u.usedM2, 0);

                return (
                  <div key={workerName}>
                    <h3 className="font-semibold text-sm mb-2">{workerName}</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Samochód</TableHead>
                            <TableHead className="text-right">Zużycie (mb)</TableHead>
                            <TableHead className="text-right">Zużycie (m²)</TableHead>
                            <TableHead>Notatka</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workerUsages.map((usage) => (
                            <TableRow key={usage.id}>
                              <TableCell className="text-sm whitespace-nowrap">
                                {format(parseISO(usage.createdAt), 'dd.MM.yyyy')}
                              </TableCell>
                              <TableCell className="text-sm">
                                {usage.vehicleName ?? '—'}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {usage.usedMb.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {usage.usedM2.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {usage.note ?? '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-gray-50 font-medium">
                            <TableCell colSpan={3} />
                            <TableCell className="text-right text-sm">
                              Łącznie: {workerTotal.toFixed(2)} m²
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t text-sm font-semibold text-right">
                Łącznie wszyscy: {grandTotal.toFixed(2)} m²
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EmployeeRollsDrawer;
