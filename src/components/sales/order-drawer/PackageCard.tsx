import { X, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  type OrderPackage,
  type OrderProduct,
  type DeliveryType,
  type PackagingType,
  type KartonDimensions,
  type TubaDimensions,
} from '../hooks/useOrderPackages';
import { formatCurrency } from '../constants';

interface PackageCardProps {
  pkg: OrderPackage;
  index: number;
  packageProducts: OrderProduct[];
  onRemove: () => void;
  onShippingMethodChange: (method: DeliveryType) => void;
  onPackagingTypeChange: (type: PackagingType) => void;
  onDimensionChange: (field: string, value: number) => void;
  onAddProduct: () => void;
  onRemoveProduct: (productKey: string) => void;
  onUpdateQuantity: (productKey: string, qty: number) => void;
  onUpdateVehicle: (productKey: string, vehicle: string) => void;
}

const PackageCard = ({
  pkg,
  index,
  packageProducts,
  onRemove,
  onShippingMethodChange,
  onPackagingTypeChange,
  onDimensionChange,
  onAddProduct,
  onRemoveProduct,
  onUpdateQuantity,
  onUpdateVehicle,
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

      {/* Products in package */}
      <div className="space-y-1.5">
        <Label className="text-sm">Produkty</Label>
        {packageProducts.length > 0 && (
          <div className="space-y-1.5">
            {packageProducts.map((p) => {
              const itemKey = p.variantId || p.productId;
              return (
                <div key={itemKey} className="bg-amber-50 rounded px-2.5 py-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{p.name}</p>
                      <p className="text-sm text-foreground/70">{formatCurrency(p.priceNet)} netto/{p.priceUnit || 'szt.'}</p>
                    </div>
                    <button type="button" onClick={() => onRemoveProduct(itemKey)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(itemKey, p.quantity - 1)} disabled={p.quantity <= 1}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input type="number" min={1} value={p.quantity} onChange={(e) => onUpdateQuantity(itemKey, parseInt(e.target.value) || 1)} className="w-12 h-6 text-center text-sm px-1" />
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(itemKey, p.quantity + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input placeholder="Pojazd" value={p.vehicle} onChange={(e) => onUpdateVehicle(itemKey, e.target.value)} className="h-6 text-sm flex-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full gap-1.5 text-sm font-medium" onClick={onAddProduct}>
          <Plus className="w-4 h-4" />
          Dodaj produkt
        </Button>
      </div>

      {/* Shipping method toggle */}
      <div className="space-y-1.5">
        <Label className="text-sm">Sposób wysyłki</Label>
        <ToggleGroup
          type="single"
          value={pkg.shippingMethod}
          onValueChange={(v) => { if (v) onShippingMethodChange(v as DeliveryType); }}
          variant="outline"
          size="sm"
          className="justify-start"
        >
          <ToggleGroupItem value="shipping" className="text-xs px-3">Wysyłka</ToggleGroupItem>
          <ToggleGroupItem value="pickup" className="text-xs px-3">Odbiór osobisty</ToggleGroupItem>
          <ToggleGroupItem value="uber" className="text-xs px-3">Uber</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Conditional: packaging fields (only for "shipping") */}
      {pkg.shippingMethod === 'shipping' && (
        <div className="space-y-2 pl-1">
          <RadioGroup
            value={pkg.packagingType || 'karton'}
            onValueChange={(v) => onPackagingTypeChange(v as PackagingType)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="karton" id={`pkg-${pkg.id}-karton`} />
              <Label htmlFor={`pkg-${pkg.id}-karton`} className="text-sm font-normal cursor-pointer">
                Karton
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="tuba" id={`pkg-${pkg.id}-tuba`} />
              <Label htmlFor={`pkg-${pkg.id}-tuba`} className="text-sm font-normal cursor-pointer">
                Tuba
              </Label>
            </div>
          </RadioGroup>

          {pkg.packagingType === 'tuba' ? (
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
                  onChange={(e) => onDimensionChange('diameter', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Długość (cm)</Label>
                <Input
                  type="number"
                  min={0}
                  value={(pkg.dimensions as KartonDimensions)?.length || ''}
                  onChange={(e) => onDimensionChange('length', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Szerokość (cm)</Label>
                <Input
                  type="number"
                  min={0}
                  value={(pkg.dimensions as KartonDimensions)?.width || ''}
                  onChange={(e) => onDimensionChange('width', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Wysokość (cm)</Label>
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
  );
};

export default PackageCard;
