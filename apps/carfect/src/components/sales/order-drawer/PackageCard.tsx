import { X, Plus, Minus } from 'lucide-react';
import { Input } from '@shared/ui';
import { Button } from '@shared/ui';
import { Badge } from '@shared/ui';
import { Label } from '@shared/ui';
import { ToggleGroup, ToggleGroupItem } from '@shared/ui';
import { RadioGroup, RadioGroupItem } from '@shared/ui';
import {
  type OrderPackage,
  type OrderProduct,
  type DeliveryType,
  type PackagingType,
  type KartonDimensions,
  type TubaDimensions,
  type RollAssignment,
  getItemKey,
} from '../hooks/useOrderPackages';
import { formatCurrency } from '../constants';
import MultiRollAssignment from '../rolls/MultiRollAssignment';

interface PackageCardProps {
  pkg: OrderPackage;
  index: number;
  packageProducts: OrderProduct[];
  instanceId: string | null;
  onRemove: () => void;
  onShippingMethodChange: (method: DeliveryType) => void;
  onPackagingTypeChange: (type: PackagingType) => void;
  onDimensionChange: (field: string, value: number) => void;
  onAddProduct: () => void;
  onRemoveProduct: (productKey: string) => void;
  onUpdateQuantity: (productKey: string, qty: number) => void;
  onUpdateVehicle: (productKey: string, vehicle: string) => void;
  onUpdateRollAssignment?: (
    productKey: string,
    rollId: string | null,
    usageM2: number,
    widthMm?: number,
  ) => void;
  onSetRollAssignments?: (productKey: string, assignments: RollAssignment[]) => void;
  onToggleDiscount?: (productKey: string) => void;
  customerDiscount?: number;
}

const PackageCard = ({
  pkg,
  index,
  packageProducts,
  instanceId,
  onRemove,
  onShippingMethodChange,
  onPackagingTypeChange,
  onDimensionChange,
  onAddProduct,
  onRemoveProduct,
  onUpdateQuantity,
  onUpdateVehicle,
  onUpdateRollAssignment,
  onSetRollAssignments,
  onToggleDiscount,
  customerDiscount,
}: PackageCardProps) => {
  return (
    <div className="bg-card border border-border rounded-md p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Paczka #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Two-column layout: products (left) | separator | shipping (right) */}
      <div className="grid grid-cols-1 sm:grid-cols-[600px_1px_1fr] gap-0">
        {/* Left: Products */}
        <div className="space-y-1.5 sm:pr-4">
          <Label className="text-sm">Produkty</Label>
          {packageProducts.length > 0 && (
            <div className="space-y-1.5">
              {packageProducts.map((p) => {
                const itemKey = getItemKey(p);
                return (
                  <div key={itemKey} className="bg-amber-50 rounded px-2.5 py-2 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium leading-tight truncate">{p.name}</p>
                          {p.excludeFromDiscount &&
                            customerDiscount != null &&
                            customerDiscount > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 shrink-0 text-muted-foreground"
                              >
                                BRAK RABATU
                              </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground/70">
                            {formatCurrency(p.priceNet)} netto/
                            {p.priceUnit === 'piece'
                              ? 'szt.'
                              : p.priceUnit === 'meter'
                                ? 'm²'
                                : p.priceUnit || 'szt.'}
                          </span>
                          {customerDiscount != null && customerDiscount > 0 && (
                            <button
                              type="button"
                              className="text-xs text-primary hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleDiscount?.(itemKey);
                              }}
                            >
                              {p.excludeFromDiscount ? 'Włącz rabat' : 'Wyłącz rabat'}
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveProduct(itemKey)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {(!p.priceUnit || p.priceUnit === 'szt.' || p.priceUnit === 'piece') && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onUpdateQuantity(itemKey, p.quantity - 1)}
                            disabled={p.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            value={p.quantity}
                            onChange={(e) =>
                              onUpdateQuantity(itemKey, parseInt(e.target.value) || 1)
                            }
                            className="w-12 h-6 text-center text-sm px-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onUpdateQuantity(itemKey, p.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      <Input
                        placeholder="Pojazd"
                        value={p.vehicle}
                        onChange={(e) => onUpdateVehicle(itemKey, e.target.value)}
                        className="h-6 text-sm flex-1"
                      />
                    </div>
                    {/* Roll assignment for meter-based products */}
                    {p.priceUnit === 'meter' && onSetRollAssignments && (
                      <MultiRollAssignment
                        instanceId={instanceId}
                        assignments={p.rollAssignments || []}
                        onChange={(assignments) => onSetRollAssignments(itemKey, assignments)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-sm font-medium"
            onClick={onAddProduct}
          >
            <Plus className="w-4 h-4" />
            {packageProducts.length > 0 ? 'Dodaj kolejny produkt' : 'Dodaj produkt'}
          </Button>
        </div>

        {/* Vertical separator */}
        <div className="hidden sm:block bg-border" />

        {/* Right: Shipping */}
        <div className="space-y-3 sm:pl-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Sposób wysyłki</Label>
            <ToggleGroup
              type="single"
              value={pkg.shippingMethod}
              onValueChange={(v) => {
                if (v) onShippingMethodChange(v as DeliveryType);
              }}
              variant="outline"
              size="sm"
              className="justify-start flex-wrap"
            >
              <ToggleGroupItem value="shipping" className="text-xs px-3">
                Wysyłka
              </ToggleGroupItem>
              <ToggleGroupItem value="pickup" className="text-xs px-3">
                Odbiór osobisty
              </ToggleGroupItem>
              <ToggleGroupItem value="uber" className="text-xs px-3">
                Uber
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Conditional: packaging fields (only for "shipping") */}
          {pkg.shippingMethod === 'shipping' && (
            <div className="space-y-2">
              <RadioGroup
                value={pkg.packagingType || 'karton'}
                onValueChange={(v) => onPackagingTypeChange(v as PackagingType)}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="karton" id={`pkg-${pkg.id}-karton`} />
                  <Label
                    htmlFor={`pkg-${pkg.id}-karton`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Karton
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="tuba" id={`pkg-${pkg.id}-tuba`} />
                  <Label
                    htmlFor={`pkg-${pkg.id}-tuba`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Tuba
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="koperta" id={`pkg-${pkg.id}-koperta`} />
                  <Label
                    htmlFor={`pkg-${pkg.id}-koperta`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Koperta
                  </Label>
                </div>
              </RadioGroup>

              {pkg.packagingType === 'koperta' ? null : pkg.packagingType === 'tuba' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Długość (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(pkg.dimensions as TubaDimensions)?.length || ''}
                      onChange={(e) => onDimensionChange('length', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Średnica (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(pkg.dimensions as TubaDimensions)?.diameter || ''}
                      onChange={(e) =>
                        onDimensionChange('diameter', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Dł. (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(pkg.dimensions as KartonDimensions)?.length || ''}
                      onChange={(e) => onDimensionChange('length', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Szer. (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(pkg.dimensions as KartonDimensions)?.width || ''}
                      onChange={(e) => onDimensionChange('width', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Wys. (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(pkg.dimensions as KartonDimensions)?.height || ''}
                      onChange={(e) => onDimensionChange('height', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
