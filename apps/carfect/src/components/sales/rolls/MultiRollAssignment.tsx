import { useState, useEffect, useCallback } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { Input, Button, Label } from '@shared/ui';
import type { SalesRoll } from '../types/rolls';
import { mbToM2 } from '../types/rolls';
import type { RollAssignment } from '../hooks/useOrderPackages';
import { fetchRollById } from '../services/rollService';
import RollSelectDrawer from './RollSelectDrawer';

interface MultiRollAssignmentProps {
  instanceId: string | null;
  assignments: RollAssignment[];
  onChange: (assignments: RollAssignment[]) => void;
  requiredM2?: number;
  customerName?: string;
  productName?: string;
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
  customerName,
  productName,
}: MultiRollAssignmentProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rollInfoMap, setRollInfoMap] = useState<Record<string, RollInfo>>({});

  // Fetch roll info for all assigned rolls
  useEffect(() => {
    const rollIds = assignments.map((a) => a.rollId);
    const missingIds = rollIds.filter((id) => !rollInfoMap[id]);

    if (missingIds.length === 0) return;

    let cancelled = false;
    Promise.all(missingIds.map((id) => fetchRollById(id))).then((results) => {
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
          newAssignments.push({
            rollId: roll.id,
            usageM2: 0,
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
    [assignments, onChange],
  );

  const handleUsageChange = useCallback(
    (rollId: string, usageM2: number) => {
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
        const remaining = info?.remainingM2 ?? 0;
        const shortage = a.usageM2 > remaining ? a.usageM2 - remaining : 0;

        return (
          <div
            key={a.rollId}
            className="flex items-center gap-2 p-2 rounded-md bg-white border border-border text-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-foreground truncate">{rollName}</span>
                {info && (
                  <span className="text-xs text-foreground">({remaining.toFixed(1)} m² dost.)</span>
                )}
              </div>
              {shortage > 0 && (
                <div className="flex items-center gap-1 text-xs text-destructive mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  Brakuje {shortage.toFixed(2)} m²
                </div>
              )}
            </div>
            <Input
              type="number"
              min={0}
              max={remaining > 0 ? remaining : undefined}
              step={0.1}
              value={a.usageM2 || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : 0;
                handleUsageChange(a.rollId, val);
              }}
              className={`h-7 text-xs w-20 ${shortage > 0 ? 'border-destructive' : ''}`}
              placeholder="m²"
            />
            <span className="text-xs text-foreground">m²</span>
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
