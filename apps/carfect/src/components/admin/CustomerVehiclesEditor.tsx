import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Input, Label } from '@shared/ui';
import { CarSearchAutocomplete, CarSearchValue } from '@/components/ui/car-search-autocomplete';
import { useTranslation } from 'react-i18next';

export function isValidVin(vin: string): boolean {
  if (!vin) return true; // optional
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

export interface VehicleChip {
  id?: string;
  model: string;
  carSize: 'S' | 'M' | 'L';
  isNew?: boolean;
  vin?: string;
}

interface CustomerVehiclesEditorProps {
  vehicles: VehicleChip[];
  onChange: (vehicles: VehicleChip[]) => void;
  disabled?: boolean;
  showVin?: boolean;
  onVinChange?: (index: number, vin: string) => void;
}

export const CustomerVehiclesEditor = ({
  vehicles,
  onChange,
  disabled = false,
  showVin = false,
  onVinChange,
}: CustomerVehiclesEditorProps) => {
  const { t } = useTranslation();
  const [vehicleSearchValue, setVehicleSearchValue] = useState('');
  const [pendingVehicle, setPendingVehicle] = useState<CarSearchValue>(null);

  const handleSearchChange = (val: CarSearchValue) => {
    setPendingVehicle(val);
    setVehicleSearchValue(val?.label || '');
  };

  const handleAddVehicle = () => {
    if (!pendingVehicle) return;

    const newVehicle: VehicleChip = {
      model: pendingVehicle.label,
      carSize: 'size' in pendingVehicle ? pendingVehicle.size : 'M',
      isNew: true,
    };

    // Check duplicates
    if (!vehicles.some((v) => v.model === newVehicle.model)) {
      onChange([...vehicles, newVehicle]);
    }

    // Reset input
    setVehicleSearchValue('');
    setPendingVehicle(null);
  };

  const handleRemoveVehicle = (index: number) => {
    onChange(vehicles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{t('customers.vehicles')}</label>

      {/* Search + Add button row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <CarSearchAutocomplete
            value={vehicleSearchValue}
            onChange={handleSearchChange}
            disabled={disabled}
            suppressAutoOpen={false}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddVehicle}
          disabled={disabled || !pendingVehicle}
        >
          {t('common.add')}
        </Button>
      </div>

      {/* Vehicle chips or cards */}
      {vehicles.length > 0 && (
        showVin ? (
          <div className="space-y-2">
            {vehicles.map((vehicle, index) => (
              <div
                key={vehicle.id || `new-${index}`}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{vehicle.model}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVehicle(index)}
                      className="p-0.5 hover:bg-hover rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">VIN</Label>
                  <Input
                    value={vehicle.vin || ''}
                    onChange={(e) => onVinChange?.(index, e.target.value.toUpperCase())}
                    placeholder="np. WBAPH5C55BA123456"
                    maxLength={17}
                    className="h-8 font-mono text-xs"
                    disabled={disabled}
                  />
                  {vehicle.vin && !isValidVin(vehicle.vin) && (
                    <p className="text-xs text-destructive mt-1">VIN musi mieć 17 znaków (bez I, O, Q)</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {vehicles.map((vehicle, index) => (
              <div
                key={vehicle.id || `new-${index}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium"
              >
                <span>{vehicle.model}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveVehicle(index)}
                    className="p-0.5 hover:bg-hover rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default CustomerVehiclesEditor;
