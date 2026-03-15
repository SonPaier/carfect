import { Plus } from 'lucide-react';
import { Button } from '@shared/ui';
import { Label } from '@shared/ui';
import { type OrderPackage, type OrderProduct, type DeliveryType, type PackagingType, type RollAssignment, getItemKey } from '../hooks/useOrderPackages';
import PackageCard from './PackageCard';

interface PackagesSectionProps {
  packages: OrderPackage[];
  products: OrderProduct[];
  instanceId: string | null;
  onRemovePackage: (packageId: string) => void;
  onShippingMethodChange: (packageId: string, method: DeliveryType) => void;
  onPackagingTypeChange: (packageId: string, type: PackagingType) => void;
  onDimensionChange: (packageId: string, field: string, value: number) => void;
  onAddProduct: (packageId: string) => void;
  onRemoveProduct: (packageId: string, productKey: string) => void;
  onUpdateQuantity: (productKey: string, qty: number) => void;
  onUpdateVehicle: (productKey: string, vehicle: string) => void;
  onUpdateRollAssignment?: (productKey: string, rollId: string | null, usageM2: number, widthMm?: number) => void;
  onSetRollAssignments?: (productKey: string, assignments: RollAssignment[]) => void;
  onToggleDiscount?: (productKey: string) => void;
  customerDiscount?: number;
  onAddPackage: () => void;
}

export const PackagesSection = ({
  packages,
  products,
  instanceId,
  onRemovePackage,
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
  onAddPackage,
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
              packageProducts={products.filter(p => pkg.productKeys.includes(getItemKey(p)))}
              onRemove={() => onRemovePackage(pkg.id)}
              onShippingMethodChange={(method) => onShippingMethodChange(pkg.id, method)}
              onPackagingTypeChange={(type) => onPackagingTypeChange(pkg.id, type)}
              onDimensionChange={(field, value) => onDimensionChange(pkg.id, field, value)}
              onAddProduct={() => onAddProduct(pkg.id)}
              onRemoveProduct={(productKey) => onRemoveProduct(pkg.id, productKey)}
              onUpdateQuantity={(productKey, qty) => onUpdateQuantity(productKey, qty)}
              onUpdateVehicle={(productKey, vehicle) => onUpdateVehicle(productKey, vehicle)}
              instanceId={instanceId}
              onUpdateRollAssignment={onUpdateRollAssignment ? (productKey, rollId, usageM2, widthMm) => onUpdateRollAssignment(productKey, rollId, usageM2, widthMm) : undefined}
              onSetRollAssignments={onSetRollAssignments}
              onToggleDiscount={onToggleDiscount}
              customerDiscount={customerDiscount}
            />
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full gap-2" onClick={onAddPackage}>
        <Plus className="w-4 h-4" />
        {packages.length > 0 ? 'Dodaj kolejną paczkę' : 'Dodaj paczkę'}
      </Button>
    </div>
  );
};
