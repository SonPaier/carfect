import { useState, useEffect, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { Input, Button } from '@shared/ui';
import type { SalesRoll } from '../types/rolls';
import { formatRollSize, mbToM2 } from '../types/rolls';
import { fetchRolls } from '../services/rollService';

export interface SelectedRollEntry {
  rollId: string;
  roll: SalesRoll;
  usageM2: number;
}

interface RollSelectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string | null;
  /** Already selected roll IDs (to show checkmarks) */
  selectedRollIds?: string[];
  /** Callback when user confirms selection */
  onConfirm: (rolls: SalesRoll[]) => void;
  /** Multi-select mode (default true) */
  multiSelect?: boolean;
  /** Required m² — used for smart sorting (closest match first) */
  requiredM2?: number;
  /** Customer name — rolls used by this customer sort first */
  customerName?: string;
  /** Filter rolls by product name (only show rolls matching this product) */
  filterProductName?: string;
  /** Filter rolls by width in mm (only show rolls with this exact width) */
  filterWidthMm?: number;
}

const RollSelectDrawer = ({
  open,
  onOpenChange,
  instanceId,
  selectedRollIds = [],
  onConfirm,
  multiSelect = true,
  requiredM2,
  customerName,
  filterProductName,
  filterWidthMm,
}: RollSelectDrawerProps) => {
  const [rolls, setRolls] = useState<SalesRoll[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  // Reset selection when opening
  useEffect(() => {
    if (open) {
      setSelected([...selectedRollIds]);
      setSearch('');
    }
  }, [open, selectedRollIds]);

  // Fetch rolls
  useEffect(() => {
    if (!open || !instanceId) return;

    let cancelled = false;
    setLoading(true);

    fetchRolls(instanceId, 'active')
      .then((data) => {
        if (!cancelled) setRolls(data);
      })
      .catch(() => {
        if (!cancelled) setRolls([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, instanceId]);

  // Filter and sort: by search, then by remaining m² desc
  const filteredRolls = useMemo(() => {
    let result = rolls;

    // Filter by product name if specified
    if (filterProductName) {
      const filterLower = filterProductName.toLowerCase();
      result = result.filter((r) => {
        const rollName = r.productName.toLowerCase();
        const rollBase = rollName.replace(/\s*-\s*\d+mm.*$/, '').replace(/\s*\d+mm.*$/, '');
        const filterBase = filterLower.replace(/\s*-\s*\d+mm.*$/, '').replace(/\s*\d+mm.*$/, '');
        return (
          rollBase === filterBase || rollBase.includes(filterBase) || filterBase.includes(rollBase)
        );
      });
    }

    // Filter by width if specified (exact match)
    if (filterWidthMm && filterWidthMm > 0) {
      result = result.filter((r) => r.widthMm === filterWidthMm);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.brand.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          (r.productCode || '').toLowerCase().includes(q) ||
          (r.barcode || '').includes(q) ||
          (r.customerNames || []).some((name) => name.toLowerCase().includes(q)),
      );
    }

    // Smart sort:
    // 1. Rolls used by this customer first
    // 2. Closest remaining m² to requiredM2 (if set), otherwise by remaining desc
    const customerLower = customerName?.toLowerCase();
    const target = requiredM2 && requiredM2 > 0 ? requiredM2 : null;

    return [...result].sort((a, b) => {
      // Customer match priority
      const aCustomer = customerLower
        ? (a.customerNames || []).some((n) => n.toLowerCase().includes(customerLower))
          ? 1
          : 0
        : 0;
      const bCustomer = customerLower
        ? (b.customerNames || []).some((n) => n.toLowerCase().includes(customerLower))
          ? 1
          : 0
        : 0;
      if (aCustomer !== bCustomer) return bCustomer - aCustomer;

      // Closest to required m² (only rolls with enough remaining)
      if (target) {
        const aM2 = mbToM2(a.remainingMb || 0, a.widthMm);
        const bM2 = mbToM2(b.remainingMb || 0, b.widthMm);
        const aHasEnough = aM2 >= target ? 1 : 0;
        const bHasEnough = bM2 >= target ? 1 : 0;
        if (aHasEnough !== bHasEnough) return bHasEnough - aHasEnough;
        // Among those with enough: closest to target first (least waste)
        if (aHasEnough && bHasEnough) {
          return aM2 - target - (bM2 - target);
        }
        // Among those without enough: most remaining first
        return bM2 - aM2;
      }

      // Default: remaining m² descending
      return (b.remainingMb || 0) - (a.remainingMb || 0);
    });
  }, [rolls, search, requiredM2, customerName, filterProductName, filterWidthMm]);

  const toggleRoll = (roll: SalesRoll) => {
    if (multiSelect) {
      setSelected((prev) => {
        if (prev.includes(roll.id)) {
          return prev.filter((id) => id !== roll.id);
        }
        return [...prev, roll.id];
      });
    } else {
      // Single select: confirm immediately
      onConfirm([roll]);
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    const rollMap = new Map(rolls.map((r) => [r.id, r]));
    const selectedRolls = selected.map((id) => rollMap.get(id)!).filter(Boolean);
    onConfirm(selectedRolls);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg flex flex-col bg-white text-foreground">
        <SheetHeader>
          <SheetTitle>Wybierz rolki</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwie, kodzie, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Roll list */}
        <div className="flex-1 overflow-y-auto mt-4 -mx-6 px-6 space-y-1">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Ładowanie...</p>
          ) : filteredRolls.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? 'Brak wyników' : 'Brak dostępnych rolek'}
            </p>
          ) : (
            filteredRolls.map((roll) => {
              const isSelected = selected.includes(roll.id);
              const remainingM2 = mbToM2(roll.remainingMb || 0, roll.widthMm);
              const isLow = (roll.remainingMb || 0) < (roll.initialLengthM || roll.lengthM) * 0.2;
              const isEmpty = (roll.remainingMb || 0) <= 0;

              return (
                <button
                  key={roll.id}
                  type="button"
                  onClick={() => toggleRoll(roll)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors bg-white ${
                    isSelected ? 'border-primary' : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate text-foreground">
                        {roll.productName}
                      </span>
                      <div className="flex items-center gap-3 mt-1 text-xs text-foreground/70">
                        <span className="font-mono">{roll.productCode || roll.barcode || '—'}</span>
                        <span>{formatRollSize(roll.widthMm, roll.initialLengthM)}</span>
                      </div>
                      {roll.customerNames && roll.customerNames.length > 0 && (
                        <div className="mt-1 text-xs text-foreground/50">
                          {roll.customerNames.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          isEmpty
                            ? 'text-destructive'
                            : isLow
                              ? 'text-orange-500'
                              : 'text-foreground'
                        }`}
                      >
                        {remainingM2.toFixed(1)} m²
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        {multiSelect && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="text-sm text-foreground/60">
              {selected.length > 0 ? `Wybrano: ${selected.length}` : '\u00A0'}
            </span>
            <Button onClick={handleConfirm} disabled={selected.length === 0}>
              Potwierdź wybór
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default RollSelectDrawer;
