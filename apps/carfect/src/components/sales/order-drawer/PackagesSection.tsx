import { Plus } from 'lucide-react';
import { Button } from '@shared/ui';
import { Label } from '@shared/ui';
import {
  type OrderPackage,
  type OrderProduct,
  type DeliveryType,
  type PackagingType,
  type CourierType,
  type RollAssignment,
  getItemKey,
} from '../hooks/useOrderPackages';
import PackageCard, { type ApaczkaService } from './PackageCard';

interface PackagesSectionProps {
  packages: OrderPackage[];
  products: OrderProduct[];
  instanceId: string | null;
  availableCouriers?: ApaczkaService[];
  onRemovePackage: (packageId: string) => void;
  onShippingMethodChange: (packageId: string, method: DeliveryType) => void;
  onPackagingTypeChange: (packageId: string, type: PackagingType) => void;
  onDimensionChange: (packageId: string, field: string, value: number) => void;
  onCourierChange: (packageId: string, courierServiceId: number, courierName: string) => void;
  onWeightChange: (packageId: string, weight: number) => void;
  onContentsChange: (packageId: string, contents: string) => void;
  onDeclaredValueChange: (packageId: string, value: number | undefined, isManual: boolean) => void;
  onOversizedChange: (packageId: string, oversized: boolean) => void;
  onShippingCostChange: (packageId: string, cost: number | undefined) => void;
  onAddProduct: (packageId: string) => void;
  onRemoveProduct: (packageId: string, productKey: string) => void;
  onUpdateQuantity: (productKey: string, qty: number) => void;
  onUpdateVehicle: (productKey: string, vehicle: string) => void;
  onUpdateRollAssignment?: (
    productKey: string,
    rollId: string | null,
    usageM2: number,
    widthMm?: number,
  ) => void;
  onSetRollAssignments?: (productKey: string, assignments: RollAssignment[]) => void;
  onUpdateRequiredM2?: (productKey: string, requiredM2: number) => void;
  onUpdateProductDiscount?: (productKey: string, discountPercent: number) => void;
  onToggleDiscount?: (productKey: string) => void;
  customerDiscount?: number;
  customerName?: string;
  onAddPackage: () => void;
  customerPostalCode?: string;
  customerCity?: string;
  paymentMethod?: string;
  totalGross?: number;
  bankAccountNumber?: string;
}

export const PackagesSection = ({
  packages,
  products,
  instanceId,
  onRemovePackage,
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
  onUpdateRequiredM2,
  onUpdateProductDiscount,
  onToggleDiscount,
  customerDiscount,
  customerName,
  onAddPackage,
  customerPostalCode,
  customerCity,
  paymentMethod,
  totalGross,
  bankAccountNumber,
  availableCouriers,
}: PackagesSectionProps) => {
  return (
    <div className="space-y-2">
      <Label>Paczki</Label>

      {packages.length > 0 && (
        <div className="space-y-3">
          {packages.map((pkg, index) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              index={index}
              packageProducts={products.filter((p) => pkg.productKeys.includes(getItemKey(p)))}
              onRemove={() => onRemovePackage(pkg.id)}
              onShippingMethodChange={(method) => onShippingMethodChange(pkg.id, method)}
              onPackagingTypeChange={(type) => onPackagingTypeChange(pkg.id, type)}
              onDimensionChange={(field, value) => onDimensionChange(pkg.id, field, value)}
              onCourierChange={(serviceId, name) => onCourierChange(pkg.id, serviceId, name)}
              onWeightChange={(weight) => onWeightChange(pkg.id, weight)}
              onContentsChange={(contents) => onContentsChange(pkg.id, contents)}
              onDeclaredValueChange={(value, isManual) =>
                onDeclaredValueChange(pkg.id, value, isManual)
              }
              onOversizedChange={(oversized) => onOversizedChange(pkg.id, oversized)}
              onShippingCostChange={(cost) => onShippingCostChange(pkg.id, cost)}
              onAddProduct={() => onAddProduct(pkg.id)}
              onRemoveProduct={(productKey) => onRemoveProduct(pkg.id, productKey)}
              onUpdateQuantity={(productKey, qty) => onUpdateQuantity(productKey, qty)}
              onUpdateVehicle={(productKey, vehicle) => onUpdateVehicle(productKey, vehicle)}
              instanceId={instanceId}
              availableCouriers={availableCouriers}
              onUpdateRollAssignment={
                onUpdateRollAssignment
                  ? (productKey, rollId, usageM2, widthMm) =>
                      onUpdateRollAssignment(productKey, rollId, usageM2, widthMm)
                  : undefined
              }
              onSetRollAssignments={onSetRollAssignments}
              onUpdateRequiredM2={onUpdateRequiredM2}
              onUpdateProductDiscount={onUpdateProductDiscount}
              onToggleDiscount={onToggleDiscount}
              customerDiscount={customerDiscount}
              customerName={customerName}
              customerPostalCode={customerPostalCode}
              customerCity={customerCity}
              paymentMethod={paymentMethod}
              totalGross={totalGross}
              bankAccountNumber={bankAccountNumber}
            />
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="gap-2" onClick={onAddPackage}>
        <Plus className="w-4 h-4" />
        {packages.length > 0 ? 'Dodaj kolejną paczkę' : 'Dodaj paczkę'}
      </Button>
    </div>
  );
};
