import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { Button, Label, NumericInput } from '@shared/ui';
import type { SalesRoll } from '../types/rolls';
import { mbToM2, m2ToMb } from '../types/rolls';
import type { RollAssignment } from '../hooks/useOrderPackages';
import { fetchRollById } from '../services/rollService';
import RollSelectDrawer from './RollSelectDrawer';

interface MultiRollAssignmentProps {
  instanceId: string | null;
  assignments: RollAssignment[];
  onChange: (assignments: RollAssignment[]) => void;
  /** Required m² — used for smart sorting in roll select drawer */
  requiredM2?: number;
  /** Required running meters — auto-copied to single assignment input */
  requiredMb?: number;
  customerName?: string;
  productName?: string;
  filterWidthMm?: number;
  /** When editing an order, exclude its own usages from remaining calculation */
  excludeOrderId?: string;
}

interface RollInfo {
  roll: SalesRoll;
  remainingM2: number;
}

const MultiRollAssignment = ({
  instanceId,
  assignments,
  onChange,
  requiredM2,
  requiredMb,
  customerName,
  productName,
  filterWidthMm,
  excludeOrderId,
}: MultiRollAssignmentProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rollInfoMap, setRollInfoMap] = useState<Record<string, RollInfo>>({});
  const prevRequiredMbRef = useRef(requiredMb);

  // Fetch roll info for all assigned rolls
  useEffect(() => {
    const rollIds = assignments.map((a) => a.rollId);
    const missingIds = rollIds.filter((id) => !rollInfoMap[id]);

    if (missingIds.length === 0) return;

    let cancelled = false;
    Promise.all(missingIds.map((id) => fetchRollById(id, excludeOrderId))).then((results) => {
      if (cancelled) return;
      setRollInfoMap((prev) => {
        const next = { ...prev };
        for (const roll of results) {
          if (roll) {
            next[roll.id] = {
              roll,
              remainingM2: mbToM2(roll.remainingMb || 0, roll.widthMm),
            };
          }
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [assignments]);

  const handleRollsSelected = useCallback(
    (selectedRolls: SalesRoll[]) => {
      const existingIds = new Set(assignments.map((a) => a.rollId));
      const newAssignments = [...assignments];

      for (const roll of selectedRolls) {
        if (!existingIds.has(roll.id)) {
          // Pre-fill with requiredMb converted to m² if available
          const prefillM2 = requiredMb ? mbToM2(requiredMb, roll.widthMm) : 0;
          newAssignments.push({
            rollId: roll.id,
            usageM2: prefillM2,
            widthMm: roll.widthMm,
          });
          // Cache roll info
          setRollInfoMap((prev) => ({
            ...prev,
            [roll.id]: {
              roll,
              remainingM2: mbToM2(roll.remainingMb || 0, roll.widthMm),
            },
          }));
        }
      }

      onChange(newAssignments);
    },
    [assignments, onChange, requiredMb],
  );

  // Auto-copy requiredMb to single assignment when it changes
  useEffect(() => {
    if (
      requiredMb != null &&
      requiredMb !== prevRequiredMbRef.current &&
      assignments.length === 1
    ) {
      const a = assignments[0];
      const newUsageM2 = mbToM2(requiredMb, a.widthMm);
      if (Math.abs(a.usageM2 - newUsageM2) > 0.001) {
        onChange([{ ...a, usageM2: newUsageM2 }]);
      }
    }
    prevRequiredMbRef.current = requiredMb;
  }, [requiredMb, assignments, onChange]);

  const handleUsageMbChange = useCallback(
    (rollId: string, mb: number, widthMm: number) => {
      const usageM2 = mbToM2(mb, widthMm);
      onChange(assignments.map((a) => (a.rollId === rollId ? { ...a, usageM2 } : a)));
    },
    [assignments, onChange],
  );

  const handleRemove = useCallback(
    (rollId: string) => {
      onChange(assignments.filter((a) => a.rollId !== rollId));
    },
    [assignments, onChange],
  );

  if (assignments.length === 0) {
    return (
      <>
        <Button
          type="button"
          size="sm"
          className="mt-1 h-7 text-xs gap-1"
          onClick={() => setDrawerOpen(true)}
        >
          <Plus className="w-3 h-3" />
          Przypisz rolki
        </Button>
        <RollSelectDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          instanceId={instanceId}
          selectedRollIds={[]}
          onConfirm={handleRollsSelected}
          requiredM2={requiredM2}
          customerName={customerName}
          filterProductName={productName}
          filterWidthMm={filterWidthMm}
        />
      </>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <Label className="text-xs text-foreground">Przypisane rolki</Label>

      {assignments.map((a) => {
        const info = rollInfoMap[a.rollId];
        const rollName = info ? `${info.roll.productCode || info.roll.barcode || '—'}` : '...';
        const remainingMb = info ? m2ToMb(info.remainingM2, info.roll.widthMm) : 0;
        const usageMb = m2ToMb(a.usageM2, a.widthMm);
        const shortageMb = usageMb > remainingMb ? usageMb - remainingMb : 0;

        return (
          <div
            key={a.rollId}
            className="flex items-center gap-2 p-2 rounded-md bg-white border border-border text-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-foreground truncate">{rollName}</span>
                {info && (
                  <span className="text-xs text-foreground">
                    ({remainingMb.toFixed(1)} mb dost.)
                  </span>
                )}
              </div>
              {shortageMb > 0 && (
                <div className="flex items-center gap-1 text-xs text-destructive mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  Brakuje {shortageMb.toFixed(2)} mb
                </div>
              )}
            </div>
            <NumericInput
              min={0}
              max={remainingMb > 0 ? Math.round(remainingMb * 100) / 100 : undefined}
              step={0.1}
              value={usageMb > 0 ? Math.round(usageMb * 100) / 100 : undefined}
              onChange={(v) => handleUsageMbChange(a.rollId, v ?? 0, a.widthMm)}
              className={`h-7 text-xs w-20 ${shortageMb > 0 ? 'border-destructive' : ''}`}
              placeholder="mb"
            />
            <span className="text-xs text-foreground">mb</span>
            <button
              type="button"
              onClick={() => handleRemove(a.rollId)}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      <Button
        type="button"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => setDrawerOpen(true)}
      >
        <Plus className="w-3 h-3" />
        Dodaj rolkę
      </Button>

      <RollSelectDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        instanceId={instanceId}
        selectedRollIds={assignments.map((a) => a.rollId)}
        onConfirm={handleRollsSelected}
        filterProductName={productName}
      />
    </div>
  );
};

export default MultiRollAssignment;
