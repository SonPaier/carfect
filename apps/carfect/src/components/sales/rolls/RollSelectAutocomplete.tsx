import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, AlertCircle, Package } from 'lucide-react';
import { Input, Button, Label } from '@shared/ui';
import type { SalesRoll } from '../types/rolls';
import { mbToM2 } from '../types/rolls';
import { fetchActiveRollsByProductName, fetchRollById } from '../services/rollService';

interface RollSelectAutocompleteProps {
  instanceId: string | null;
  productName: string;
  usageM2: number;
  selectedRollId: string | null;
  onSelect: (rollId: string | null, usageM2: number, widthMm?: number) => void;
}

const RollSelectAutocomplete = ({
  instanceId,
  productName,
  usageM2,
  selectedRollId,
  onSelect,
}: RollSelectAutocompleteProps) => {
  const [rolls, setRolls] = useState<SalesRoll[]>([]);
  const [loading, setLoading] = useState(!!(instanceId && productName));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch rolls matching product name + ensure selected roll is included
  useEffect(() => {
    if (!instanceId || !productName) {
      setRolls([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchActiveRollsByProductName(instanceId, productName)
      .then(async (data) => {
        if (cancelled) return;
        // If selected roll is not in the active list (e.g. archived), fetch it separately
        if (selectedRollId && !data.find((r) => r.id === selectedRollId)) {
          const roll = await fetchRollById(selectedRollId);
          if (roll && !cancelled) {
            data = [roll, ...data];
          }
        }
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
  }, [instanceId, productName, selectedRollId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedRoll = rolls.find((r) => r.id === selectedRollId);

  // Validation
  const remainingM2 = selectedRoll
    ? mbToM2(selectedRoll.remainingMb || 0, selectedRoll.widthMm)
    : 0;
  const shortage = selectedRoll && usageM2 > remainingM2 ? usageM2 - remainingM2 : 0;

  const filteredRolls = search
    ? rolls.filter(
        (r) =>
          (r.barcode || '').includes(search) ||
          (r.productCode || '').toLowerCase().includes(search.toLowerCase())
      )
    : rolls;

  const handleSelectRoll = useCallback(
    (roll: SalesRoll) => {
      onSelect(roll.id, usageM2, roll.widthMm);
      setDropdownOpen(false);
      setSearch('');
    },
    [onSelect, usageM2]
  );

  const handleClear = useCallback(() => {
    onSelect(null, 0, undefined);
    setSearch('');
  }, [onSelect]);

  if (rolls.length === 0 && !loading && !selectedRollId) return null;

  return (
    <div ref={containerRef} className="mt-2 space-y-2">
      <Label className="text-xs text-muted-foreground">Rolka</Label>

      {/* Selected roll display */}
      {selectedRollId && !selectedRoll && loading ? (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border text-sm">
          <Package className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Ładowanie rolki...</span>
        </div>
      ) : selectedRoll ? (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border text-sm">
          <Package className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs">
              {selectedRoll.barcode || selectedRoll.productCode || 'Brak kodu'}
            </span>
            <span className="text-muted-foreground ml-2 text-xs">
              Pozostało: {remainingM2.toFixed(2)} m²
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleClear}
          >
            Zmień
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Input
            placeholder={loading ? 'Ładowanie rolek...' : 'Wybierz rolkę (barcode/kod)...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            className="h-8 text-xs pr-8"
            disabled={loading}
          />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />

          {/* Dropdown */}
          {dropdownOpen && filteredRolls.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredRolls.map((roll) => {
                const rm2 = mbToM2(roll.remainingMb || 0, roll.widthMm);
                return (
                  <button
                    key={roll.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-xs hover:bg-accent transition-colors flex items-center justify-between"
                    onClick={() => handleSelectRoll(roll)}
                  >
                    <div>
                      <span className="font-mono">{roll.barcode || roll.productCode || '—'}</span>
                      {roll.productCode && roll.barcode && (
                        <span className="text-muted-foreground ml-1">({roll.productCode})</span>
                      )}
                    </div>
                    <span
                      className={`shrink-0 ml-2 ${
                        rm2 <= 0 ? 'text-destructive' : rm2 < 5 ? 'text-orange-500' : 'text-green-600'
                      }`}
                    >
                      {rm2.toFixed(1)} m²
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {dropdownOpen && filteredRolls.length === 0 && !loading && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3 text-xs text-muted-foreground text-center">
              Brak dostępnych rolek dla „{productName}"
            </div>
          )}
        </div>
      )}

      {/* Usage input */}
      {selectedRoll && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              step={0.1}
              value={usageM2 || ''}
              onChange={(e) =>
                onSelect(selectedRollId, e.target.value ? Number(e.target.value) : 0, selectedRoll?.widthMm)
              }
              className="h-8 text-xs w-24"
              placeholder="m²"
            />
            <span className="text-xs text-muted-foreground">m² z tej rolki</span>
          </div>

          {/* Shortage error */}
          {shortage > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Zostało {remainingM2.toFixed(2)} m², brakuje {shortage.toFixed(2)} m²
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RollSelectAutocomplete;
