import { useEffect } from 'react';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import { Input } from '@shared/ui';
import { NumericInput } from '@shared/ui';
import { Button } from '@shared/ui';
import { Badge } from '@shared/ui';
import { Label } from '@shared/ui';
import { ToggleGroup, ToggleGroupItem } from '@shared/ui';
import { RadioGroup, RadioGroupItem } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Checkbox } from '@shared/ui';
import {
  type OrderPackage,
  type OrderProduct,
  type DeliveryType,
  type PackagingType,
  type CourierType,
  type KartonDimensions,
  type TubaDimensions,
  type RollAssignment,
  getItemKey,
} from '../hooks/useOrderPackages';
import { formatCurrency } from '../constants';
import { mbToM2 } from '../types/rolls';

/** Compute effective quantity for a product (handles meter-based with roll assignments) */
function getEffectiveQty(p: OrderProduct): number {
  if (p.priceUnit === 'meter') {
    if (p.rollAssignments?.length) {
      return p.rollAssignments.reduce((sum, a) => sum + a.usageM2, 0);
    }
    if (p.requiredMb) {
      const widthMatch = p.name.match(/(\d{3,4})\s*mm/);
      const widthMm = widthMatch ? parseInt(widthMatch[1]) : 1524;
      return mbToM2(p.requiredMb, widthMm);
    }
  }
  return p.quantity;
}

function getProductTotal(p: OrderProduct): number {
  return p.priceNet * getEffectiveQty(p);
}
import MultiRollAssignment from '../rolls/MultiRollAssignment';
import { useApaczkaValuation } from '../hooks/useApaczkaValuation';

/** Helper to extract product name and width from order product name */
function RollAssignmentWrapper({
  p,
  itemKey,
  instanceId,
  onSetRollAssignments,
  customerName,
}: {
  p: OrderProduct;
  itemKey: string;
  instanceId: string | null;
  onSetRollAssignments: (productKey: string, assignments: RollAssignment[]) => void;
  customerName?: string;
}) {
  // Extract widthMm from name like "Ultrafit XP Crystal - 1220mm x 30m"
  const widthMatch = p.name.match(/(\d{3,4})\s*mm/);
  const widthMm = widthMatch ? parseInt(widthMatch[1]) : undefined;
  // Extract base product name (before " - " variant suffix, strip "Ultrafit " prefix)
  const baseName = p.name
    .split(' - ')[0]
    .replace(/^Ultrafit\s+/i, '')
    .trim();

  return (
    <MultiRollAssignment
      instanceId={instanceId}
      assignments={p.rollAssignments || []}
      onChange={(assignments) => onSetRollAssignments(itemKey, assignments)}
      requiredM2={p.requiredMb && widthMm ? mbToM2(p.requiredMb, widthMm) : undefined}
      requiredMb={p.requiredMb}
      customerName={customerName}
      productName={baseName}
      filterWidthMm={widthMm}
    />
  );
}

export interface ApaczkaService {
  name: string;
  serviceId: number;
}

interface PackageCardProps {
  pkg: OrderPackage;
  index: number;
  packageProducts: OrderProduct[];
  instanceId: string | null;
  availableCouriers?: ApaczkaService[];
  onRemove: () => void;
  onShippingMethodChange: (method: DeliveryType) => void;
  onPackagingTypeChange: (type: PackagingType) => void;
  onDimensionChange: (field: string, value: number) => void;
  onCourierChange: (courierServiceId: number, courierName: string) => void;
  onWeightChange: (weight: number) => void;
  onContentsChange: (contents: string) => void;
  onDeclaredValueChange: (value: number | undefined, isManual: boolean) => void;
  onOversizedChange: (oversized: boolean) => void;
  onShippingCostChange: (cost: number | undefined) => void;
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
  onUpdateRequiredMb?: (productKey: string, requiredMb: number) => void;
  onUpdateProductDiscount?: (productKey: string, discountPercent: number) => void;
  onToggleDiscount?: (productKey: string) => void;
  customerDiscount?: number;
  customerName?: string;
  customerPostalCode?: string;
  customerCity?: string;
  paymentMethod?: string;
  totalGross?: number;
  bankAccountNumber?: string;
  codAmountOverride?: number;
  onCodAmountChange?: (value: number | undefined) => void;
  isNetPayer?: boolean;
}

const PackageCard = ({
  pkg,
  index,
  packageProducts,
  instanceId,
  availableCouriers = [],
  onRemove,
  onShippingMethodChange,
  onPackagingTypeChange,
  onDimensionChange,
  onCourierChange,
  onWeightChange,
  onContentsChange,
  onDeclaredValueChange,
  onOversizedChange,
  onShippingCostChange,
  onAddProduct,
  onRemoveProduct,
  onUpdateQuantity,
  onUpdateVehicle,
  onUpdateRollAssignment,
  onSetRollAssignments,
  onUpdateRequiredMb,
  onUpdateProductDiscount,
  onToggleDiscount,
  customerDiscount,
  customerName,
  customerPostalCode,
  customerCity,
  paymentMethod,
  totalGross,
  bankAccountNumber,
  codAmountOverride,
  onCodAmountChange,
  isNetPayer,
}: PackageCardProps) => {
  const valuation = useApaczkaValuation(
    instanceId,
    pkg,
    customerPostalCode,
    customerCity,
    paymentMethod,
    totalGross,
    bankAccountNumber,
  );

  // Auto-select first available courier if none selected
  useEffect(() => {
    if (
      pkg.shippingMethod === 'shipping' &&
      !pkg.courierServiceId &&
      availableCouriers.length > 0
    ) {
      onCourierChange(availableCouriers[0].serviceId, availableCouriers[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onCourierChange is stable, guard prevents loops
  }, [pkg.shippingMethod, pkg.courierServiceId, availableCouriers]);

  const handleCheckValuation = async () => {
    const price = await valuation.fetchValuation();
    onShippingCostChange(price ?? undefined);
  };

  return (
    <div className="bg-background border border-border rounded-md p-3 space-y-3">
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
        <div className="space-y-2 sm:pr-4">
          <Label className="text-sm">Produkty</Label>
          {packageProducts.length > 0 && (
            <div className="space-y-3">
              {packageProducts.map((p) => {
                const itemKey = getItemKey(p);
                return (
                  <div
                    key={itemKey}
                    className="bg-white rounded-md border border-border p-3 space-y-2.5"
                  >
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
                      {p.productType === 'other' && p.priceUnit === 'meter' ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <NumericInput
                            min={0.01}
                            step={0.01}
                            value={p.quantity ?? undefined}
                            onChange={(v) => onUpdateQuantity(itemKey, v ?? 1)}
                            className="w-20 h-7 text-center text-sm px-1"
                            placeholder="m²"
                          />
                          <span className="text-xs text-muted-foreground">m²</span>
                        </div>
                      ) : !p.priceUnit || p.priceUnit === 'szt.' || p.priceUnit === 'piece' ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(itemKey, p.quantity - 1)}
                            disabled={p.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <NumericInput
                            min={1}
                            value={p.quantity ?? undefined}
                            onChange={(v) => onUpdateQuantity(itemKey, v ?? 1)}
                            className="w-14 h-7 text-center text-sm px-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(itemKey, p.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    {/* Vehicle + Required m2 (meter only) + Discount */}
                    <div
                      className={`grid gap-2 ${
                        p.productType === 'other'
                          ? 'grid-cols-[auto]'
                          : p.priceUnit === 'meter'
                            ? 'grid-cols-[1fr_auto_auto_auto]'
                            : 'grid-cols-[1fr_auto_auto]'
                      }`}
                    >
                      {p.productType !== 'other' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Pojazd</Label>
                          <Input
                            value={p.vehicle}
                            onChange={(e) => onUpdateVehicle(itemKey, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                      {p.priceUnit === 'meter' && p.productType !== 'other' && (
                        <div className="space-y-1 w-20">
                          <Label className="text-xs">mb. wymag.</Label>
                          <NumericInput
                            min={0}
                            step={0.1}
                            value={p.requiredMb ?? undefined}
                            onChange={(v) => onUpdateRequiredMb?.(itemKey, v ?? 0)}
                            placeholder="0"
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                      {!p.excludeFromDiscount &&
                        (() => {
                          const effectiveDiscount = p.discountPercent ?? customerDiscount ?? 0;
                          const total = getProductTotal(p);
                          const discountAmountValue =
                            total > 0
                              ? Math.round(((total * effectiveDiscount) / 100) * 100) / 100
                              : 0;
                          return (
                            <>
                              <div className="space-y-1 w-16">
                                <Label className="text-xs">Rabat %</Label>
                                <NumericInput
                                  min={0}
                                  max={100}
                                  value={p.discountPercent != null ? p.discountPercent : undefined}
                                  onChange={(v) => onUpdateProductDiscount?.(itemKey, v ?? 0)}
                                  placeholder={String(customerDiscount ?? 0)}
                                  className="h-8 text-sm placeholder:text-foreground"
                                />
                              </div>
                              <div className="space-y-1 w-20">
                                <Label className="text-xs">Rabat zł</Label>
                                <NumericInput
                                  min={0}
                                  value={discountAmountValue > 0 ? discountAmountValue : undefined}
                                  onChange={(v) => {
                                    if (total > 0 && v != null) {
                                      const newPercent = (v / total) * 100;
                                      onUpdateProductDiscount?.(itemKey, Math.min(newPercent, 100));
                                    } else {
                                      onUpdateProductDiscount?.(itemKey, 0);
                                    }
                                  }}
                                  placeholder="0"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </>
                          );
                        })()}
                    </div>
                    {/* Roll assignment for meter-based products */}
                    {p.priceUnit === 'meter' &&
                      p.productType !== 'other' &&
                      onSetRollAssignments && (
                        <RollAssignmentWrapper
                          p={p}
                          itemKey={itemKey}
                          instanceId={instanceId}
                          onSetRollAssignments={onSetRollAssignments}
                          customerName={customerName}
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
              <ToggleGroupItem value="shipping" className="text-xs px-3 border-border">
                Wysyłka
              </ToggleGroupItem>
              <ToggleGroupItem value="pickup" className="text-xs px-3 border-border">
                Odbiór osobisty
              </ToggleGroupItem>
              <ToggleGroupItem value="uber" className="text-xs px-3 border-border">
                Uber
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Conditional: packaging fields (only for "shipping") */}
          {pkg.shippingMethod === 'shipping' && (
            <div className="space-y-2">
              {/* Courier + Packaging type */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                {/* Courier select */}
                <div className="space-y-1 flex-1 min-w-0">
                  <Label className="text-xs">Kurier</Label>
                  <Select
                    value={pkg.courierServiceId ? String(pkg.courierServiceId) : ''}
                    onValueChange={(v) => {
                      const id = Number(v);
                      const service = availableCouriers.find((c) => c.serviceId === id);
                      onCourierChange(id, service?.name || '');
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm w-full">
                      <SelectValue placeholder="Wybierz kuriera" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCouriers.map((c) => (
                        <SelectItem key={c.serviceId} value={String(c.serviceId)}>
                          {c.name}
                        </SelectItem>
                      ))}
                      {availableCouriers.length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          Skonfiguruj serwisy w Ustawieniach → Apaczka
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Packaging type */}
                <RadioGroup
                  value={pkg.packagingType || 'karton'}
                  onValueChange={(v) => onPackagingTypeChange(v as PackagingType)}
                  className="flex gap-3 pb-0.5"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="karton" id={`pkg-${pkg.id}-karton`} />
                    <Label
                      htmlFor={`pkg-${pkg.id}-karton`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      Karton
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="tuba" id={`pkg-${pkg.id}-tuba`} />
                    <Label
                      htmlFor={`pkg-${pkg.id}-tuba`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      Tuba
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="koperta" id={`pkg-${pkg.id}-koperta`} />
                    <Label
                      htmlFor={`pkg-${pkg.id}-koperta`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      Koperta
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Dimensions + Weight */}
              {pkg.packagingType === 'koperta' ? (
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Waga (kg)</Label>
                    <NumericInput
                      min={0.1}
                      step={0.1}
                      value={pkg.weight ?? undefined}
                      onChange={(v) => onWeightChange(v ?? 1)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              ) : pkg.packagingType === 'tuba' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Długość (cm)</Label>
                    <NumericInput
                      min={0}
                      value={(pkg.dimensions as TubaDimensions)?.length || undefined}
                      onChange={(v) => onDimensionChange('length', v ?? 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Średnica (cm)</Label>
                    <NumericInput
                      min={0}
                      value={(pkg.dimensions as TubaDimensions)?.diameter || undefined}
                      onChange={(v) => onDimensionChange('diameter', v ?? 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Waga (kg)</Label>
                    <NumericInput
                      min={0.1}
                      step={0.1}
                      value={pkg.weight ?? undefined}
                      onChange={(v) => onWeightChange(v ?? 1)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Dł. (cm)</Label>
                    <NumericInput
                      min={0}
                      value={(pkg.dimensions as KartonDimensions)?.length || undefined}
                      onChange={(v) => onDimensionChange('length', v ?? 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Szer. (cm)</Label>
                    <NumericInput
                      min={0}
                      value={(pkg.dimensions as KartonDimensions)?.width || undefined}
                      onChange={(v) => onDimensionChange('width', v ?? 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Wys. (cm)</Label>
                    <NumericInput
                      min={0}
                      value={(pkg.dimensions as KartonDimensions)?.height || undefined}
                      onChange={(v) => onDimensionChange('height', v ?? 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Waga (kg)</Label>
                    <NumericInput
                      min={0.1}
                      step={0.1}
                      value={pkg.weight ?? undefined}
                      onChange={(v) => onWeightChange(v ?? 1)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Oversized checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`pkg-${pkg.id}-oversized`}
                  checked={pkg.oversized || false}
                  onCheckedChange={(checked) => onOversizedChange(checked === true)}
                />
                <Label
                  htmlFor={`pkg-${pkg.id}-oversized`}
                  className="text-sm font-normal cursor-pointer"
                >
                  Paczka ponadwymiarowa
                </Label>
              </div>

              {/* Contents + Declared value — same line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Zawartość przesyłki</Label>
                  <Input
                    type="text"
                    value={pkg.contents || ''}
                    onChange={(e) => onContentsChange(e.target.value)}
                    placeholder=""
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Deklarowana wartość (zł)</Label>
                  <NumericInput
                    min={0}
                    value={pkg.declaredValue}
                    onChange={(v) => {
                      if (v === undefined) {
                        onDeclaredValueChange(undefined, false);
                      } else {
                        onDeclaredValueChange(v, true);
                      }
                    }}
                    placeholder="0.00"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Shipping cost valuation */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={handleCheckValuation}
                  disabled={valuation.loading}
                >
                  {valuation.loading && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Sprawdź wycenę
                </Button>
                {pkg.shippingCost != null && (
                  <span className="text-sm font-medium text-foreground">
                    Cena wysyłki: {formatCurrency(pkg.shippingCost)}
                  </span>
                )}
                {valuation.error && (
                  <span className="text-xs text-destructive">{valuation.error}</span>
                )}
              </div>

              {/* Kwota pobrania — tylko dla COD, domyślnie declaredValue + shippingCost */}
              {paymentMethod === 'cod' && (
                <div className="space-y-1">
                  <Label className="text-xs">Kwota pobrania (zł)</Label>
                  <NumericInput
                    min={0}
                    step={0.01}
                    className="h-9"
                    value={
                      codAmountOverride != null
                        ? codAmountOverride
                        : pkg.shippingCost != null
                          ? Math.round(((pkg.declaredValue ?? 0) + pkg.shippingCost) * 100) / 100
                          : undefined
                    }
                    placeholder="—"
                    onChange={(v) => onCodAmountChange?.(v)}
                  />
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
