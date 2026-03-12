import { useState, useEffect, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@shared/ui';
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
}

const RollSelectDrawer = ({
  open,
  onOpenChange,
  instanceId,
  selectedRollIds = [],
  onConfirm,
  multiSelect = true,
}: RollSelectDrawerProps) => {
  const [rolls, setRolls] = useState<SalesRoll[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reset selection when opening
  useEffect(() => {
    if (open) {
      setSelected(new Set(selectedRollIds));
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

    return () => { cancelled = true; };
  }, [open, instanceId]);

  // Filter and sort: by search, then by remaining m² desc
  const filteredRolls = useMemo(() => {
    let result = rolls;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.brand.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          (r.productCode || '').toLowerCase().includes(q) ||
          (r.barcode || '').includes(q) ||
          (r.customerNames || []).some(name => name.toLowerCase().includes(q))
      );
    }

    // Sort: selected first, then by remaining m² descending
    return [...result].sort((a, b) => {
      const aSelected = selected.has(a.id) ? 1 : 0;
      const bSelected = selected.has(b.id) ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;
      return (b.remainingMb || 0) - (a.remainingMb || 0);
    });
  }, [rolls, search, selected]);

  const toggleRoll = (roll: SalesRoll) => {
    if (multiSelect) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(roll.id)) {
          next.delete(roll.id);
        } else {
          next.add(roll.id);
        }
        return next;
      });
    } else {
      // Single select: confirm immediately
      onConfirm([roll]);
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    const selectedRolls = rolls.filter((r) => selected.has(r.id));
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
              const isSelected = selected.has(roll.id);
              const remainingM2 = mbToM2(roll.remainingMb || 0, roll.widthMm);
              const isLow = (roll.remainingMb || 0) < (roll.initialLengthM || roll.lengthM) * 0.2;
              const isEmpty = (roll.remainingMb || 0) <= 0;

              return (
                <button
                  key={roll.id}
                  type="button"
                  onClick={() => toggleRoll(roll)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors bg-white ${
                    isSelected
                      ? 'border-primary'
                      : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate text-foreground">{roll.productName}</span>
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
                          isEmpty ? 'text-destructive' : isLow ? 'text-orange-500' : 'text-foreground'
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
              {selected.size > 0
                ? `Wybrano: ${selected.size}`
                : '\u00A0'}
            </span>
            <Button
              onClick={handleConfirm}
              disabled={selected.size === 0}
            >
              Potwierdź wybór
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default RollSelectDrawer;
