import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { Button } from '@shared/ui';
import { fetchWorkerRollUsagesForMonth, type WorkerRollUsageWithRoll } from '../services/rollService';

interface EmployeeRollsDrawerProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
}

const EmployeeRollsDrawer = ({ open, onClose, instanceId }: EmployeeRollsDrawerProps) => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [usages, setUsages] = useState<WorkerRollUsageWithRoll[]>([]);
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

  const grouped = usages.reduce<Record<string, WorkerRollUsageWithRoll[]>>((acc, usage) => {
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
        className="!w-[80vw] !max-w-[80vw] flex flex-col bg-white p-0 gap-0"
        hideCloseButton
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 px-6 py-4 border-b shrink-0">
          <SheetTitle className="text-foreground">Pracownicy i rolki</SheetTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-hover transition-colors absolute top-3 right-3 z-50"
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
          <span className="text-sm font-semibold capitalize min-w-[140px] text-center text-foreground">
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
                    <h3 className="font-bold text-sm mb-2 text-foreground">{workerName}</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/30 border-b">
                            <th className="text-left px-3 py-2 font-semibold text-foreground w-[100px]">Data</th>
                            <th className="text-left px-3 py-2 font-semibold text-foreground">Rolka / Produkt</th>
                            <th className="text-left px-3 py-2 font-semibold text-foreground w-[180px]">Samochód</th>
                            <th className="text-right px-3 py-2 font-semibold text-foreground w-[80px]">mb</th>
                            <th className="text-right px-3 py-2 font-semibold text-foreground w-[80px]">m²</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workerUsages.map((usage) => (
                            <tr key={usage.id} className="border-b last:border-b-0">
                              <td className="px-3 py-2 text-foreground whitespace-nowrap">
                                {format(parseISO(usage.createdAt), 'dd.MM.yyyy')}
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-foreground font-medium">
                                  {usage.rollProductName ?? '—'}
                                  {usage.rollProductCode && (
                                    <span className="text-muted-foreground ml-1 text-xs">({usage.rollProductCode})</span>
                                  )}
                                  {usage.rollWidthMm && (
                                    <span className="text-muted-foreground ml-1 text-xs">{usage.rollWidthMm}mm</span>
                                  )}
                                </div>
                                {usage.note && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{usage.note}</p>
                                )}
                              </td>
                              <td className="px-3 py-2 text-foreground">
                                {usage.vehicleName ?? '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-foreground">
                                {usage.usedMb.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right text-foreground font-medium">
                                {usage.usedM2.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-primary/10">
                            <td colSpan={4} className="px-3 py-2 text-right text-foreground font-semibold">
                              Łącznie:
                            </td>
                            <td className="px-3 py-2 text-right text-foreground font-bold">
                              {workerTotal.toFixed(2)} m²
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t font-bold text-right text-foreground">
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
