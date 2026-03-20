import { useState, useEffect, useCallback } from 'react';

export type DeliveryType = 'shipping' | 'pickup' | 'uber';
export type PackagingType = 'karton' | 'tuba' | 'koperta';
/** @deprecated Use courierServiceId (number) instead */
export type CourierType = string;

export interface KartonDimensions {
  length: number;
  width: number;
  height: number;
}

export interface TubaDimensions {
  length: number;
  diameter: number;
}

export interface OrderPackage {
  id: string;
  shippingMethod: DeliveryType;
  packagingType?: PackagingType;
  dimensions?: KartonDimensions | TubaDimensions;
  courier?: CourierType;
  courierServiceId?: number;
  weight?: number;
  contents?: string;
  declaredValue?: number;
  oversized?: boolean;
  shippingCost?: number;
  productKeys: string[];
}

export interface RollAssignment {
  rollId: string;
  usageM2: number;
  widthMm: number;
}

export interface OrderProduct {
  /** Unique instance key — allows the same product to appear multiple times */
  instanceKey: string;
  productId: string;
  variantId?: string;
  name: string;
  priceNet: number;
  priceUnit: string;
  quantity: number;
  vehicle: string;
  excludeFromDiscount?: boolean;
  categoryName?: string;
  /** @deprecated Use rollAssignments instead */
  rollId?: string;
  /** @deprecated Use rollAssignments instead */
  rollUsageM2?: number;
  /** @deprecated Use rollAssignments instead */
  rollWidthMm?: number;
  rollAssignments?: RollAssignment[];
  requiredM2?: number;
  /** Per-product discount percentage (overrides customer discount) */
  discountPercent?: number;
}

export const getItemKey = (p: OrderProduct) => p.instanceKey;

export const createDefaultPackage = (): OrderPackage => ({
  id: crypto.randomUUID(),
  shippingMethod: 'shipping',
  packagingType: 'tuba',
  dimensions: { length: 0, diameter: 0 },
  courier: undefined,
  courierServiceId: undefined,
  weight: 1,
  contents: '',
  declaredValue: 0,
  oversized: false,
  productKeys: [],
});

interface UseOrderPackagesArgs {
  products: OrderProduct[];
  setProducts: React.Dispatch<React.SetStateAction<OrderProduct[]>>;
}

export function useOrderPackages({ products, setProducts }: UseOrderPackagesArgs) {
  const [packages, setPackages] = useState<OrderPackage[]>([]);
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);

  // Clean orphaned product keys from packages when products change
  useEffect(() => {
    const currentKeys = new Set(products.map(getItemKey));
    setPackages((prev) => {
      const cleaned = prev.map((pkg) => ({
        ...pkg,
        productKeys: pkg.productKeys.filter((k) => currentKeys.has(k)),
      }));
      if (JSON.stringify(cleaned) !== JSON.stringify(prev)) return cleaned;
      return prev;
    });
  }, [products]);

  const handleProductsConfirm = useCallback(
    (
      selected: Array<{
        productId: string;
        variantId?: string;
        variantName?: string;
        shortName?: string;
        fullName: string;
        priceNet: number;
        priceUnit?: string;
        excludeFromDiscount?: boolean;
        categoryName?: string;
      }>,
    ) => {
      if (!activePackageId) return;

      // Each selected product becomes a new instance with a unique key
      const newProducts: OrderProduct[] = selected.map((s) => {
        const displayName = s.variantName ? `${s.fullName} - ${s.variantName}` : s.fullName;
        return {
          instanceKey: crypto.randomUUID(),
          productId: s.productId,
          variantId: s.variantId,
          name: displayName,
          priceNet: s.priceNet,
          priceUnit: s.priceUnit || 'szt.',
          quantity: 1,
          vehicle: '',
          excludeFromDiscount: s.excludeFromDiscount,
          categoryName: s.categoryName,
        };
      });

      const newKeys = newProducts.map((p) => p.instanceKey);
      const hasFolia = newProducts.some((p) => p.categoryName?.toLowerCase().includes('folie'));

      setProducts((prev) => [...prev, ...newProducts]);

      setPackages((prev) =>
        prev.map((pkg) => {
          if (pkg.id !== activePackageId) return pkg;
          const updatedPkg = { ...pkg, productKeys: [...pkg.productKeys, ...newKeys] };
          // Auto-fill defaults based on product category
          if (hasFolia && updatedPkg.shippingMethod === 'shipping') {
            if (updatedPkg.packagingType === 'karton') {
              updatedPkg.dimensions = { length: 160, width: 15, height: 15 };
            }
            updatedPkg.weight = 9;
            updatedPkg.contents = updatedPkg.contents || 'Folia ochronna PPF';
          }
          return updatedPkg;
        }),
      );

      setActivePackageId(null);
    },
    [activePackageId, setProducts],
  );

  const removeProductFromPackage = (packageId: string, productKey: string) => {
    const inOtherPackage = packages.some(
      (pkg) => pkg.id !== packageId && pkg.productKeys.includes(productKey),
    );

    // Check if any Folia products remain in this package after removal
    const pkg = packages.find((p) => p.id === packageId);
    const remainingKeys = pkg ? pkg.productKeys.filter((k) => k !== productKey) : [];
    const remainingProducts = products.filter((p) => remainingKeys.includes(getItemKey(p)));
    const stillHasFolia = remainingProducts.some((p) =>
      p.categoryName?.toLowerCase().includes('folie'),
    );

    setPackages((prev) =>
      prev.map((p) => {
        if (p.id !== packageId) return p;
        const updated = { ...p, productKeys: p.productKeys.filter((k) => k !== productKey) };
        // Reset Folia defaults if no Folia products remain
        if (!stillHasFolia && updated.shippingMethod === 'shipping') {
          if (updated.packagingType === 'karton') {
            updated.dimensions = { length: 0, width: 0, height: 0 };
          }
          updated.weight = 1;
          updated.contents = '';
        }
        return updated;
      }),
    );

    if (!inOtherPackage) {
      setProducts((prev) => prev.filter((p) => getItemKey(p) !== productKey));
    }
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity < 1) return;
    setProducts((prev) => prev.map((p) => (getItemKey(p) === key ? { ...p, quantity } : p)));
  };

  const updateVehicle = (key: string, vehicle: string) => {
    setProducts((prev) => prev.map((p) => (getItemKey(p) === key ? { ...p, vehicle } : p)));
  };

  const updateRollAssignment = (
    key: string,
    rollId: string | null,
    rollUsageM2: number,
    rollWidthMm?: number,
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        getItemKey(p) === key
          ? {
              ...p,
              rollId: rollId || undefined,
              rollUsageM2: rollId ? rollUsageM2 : undefined,
              rollWidthMm: rollId ? rollWidthMm : undefined,
            }
          : p,
      ),
    );
  };

  const setRollAssignments = (key: string, assignments: RollAssignment[]) => {
    setProducts((prev) =>
      prev.map((p) => (getItemKey(p) === key ? { ...p, rollAssignments: assignments } : p)),
    );
  };

  const toggleExcludeFromDiscount = (key: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        getItemKey(p) === key ? { ...p, excludeFromDiscount: !p.excludeFromDiscount } : p,
      ),
    );
  };

  const updateRequiredM2 = (key: string, requiredM2: number) => {
    setProducts((prev) =>
      prev.map((p) => (getItemKey(p) === key ? { ...p, requiredM2 } : p)),
    );
  };

  const updateProductDiscount = (key: string, discountPercent: number) => {
    setProducts((prev) =>
      prev.map((p) => (getItemKey(p) === key ? { ...p, discountPercent } : p)),
    );
  };

  const addPackage = () => {
    setPackages((prev) => [...prev, createDefaultPackage()]);
  };

  const removePackage = (packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;

    const keysInOtherPackages = new Set<string>();
    packages.forEach((p) => {
      if (p.id !== packageId) {
        p.productKeys.forEach((k) => keysInOtherPackages.add(k));
      }
    });
    const orphanedKeys = new Set(pkg.productKeys.filter((k) => !keysInOtherPackages.has(k)));

    setPackages((prev) => prev.filter((p) => p.id !== packageId));
    if (orphanedKeys.size > 0) {
      setProducts((prev) => prev.filter((p) => !orphanedKeys.has(getItemKey(p))));
    }
  };

  const updatePackageShippingMethod = (packageId: string, method: DeliveryType) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== packageId) return pkg;
        if (method === 'shipping') {
          return {
            ...pkg,
            shippingMethod: method,
            packagingType: pkg.packagingType || 'karton',
            dimensions: pkg.dimensions || { length: 0, width: 0, height: 0 },
            courier: pkg.courier,
            courierServiceId: pkg.courierServiceId,
            weight: pkg.weight ?? 1,
            contents: pkg.contents ?? '',
            declaredValue: pkg.declaredValue ?? 0,
            oversized: pkg.oversized ?? false,
          };
        }
        return {
          ...pkg,
          shippingMethod: method,
          packagingType: undefined,
          dimensions: undefined,
          courier: undefined,
          courierServiceId: undefined,
          weight: undefined,
          contents: undefined,
          declaredValue: undefined,
          oversized: undefined,
        };
      }),
    );
  };

  const updatePackagePackagingType = (packageId: string, type: PackagingType) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== packageId) return pkg;
        const dimensions =
          type === 'karton'
            ? { length: 0, width: 0, height: 0 }
            : type === 'tuba'
              ? { length: 0, diameter: 0 }
              : undefined;
        return { ...pkg, packagingType: type, dimensions };
      }),
    );
  };

  const updatePackageDimension = (packageId: string, field: string, value: number) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== packageId || !pkg.dimensions) return pkg;
        return { ...pkg, dimensions: { ...pkg.dimensions, [field]: value } };
      }),
    );
  };

  const updatePackageCourier = (packageId: string, courierServiceId: number, courierName: string) => {
    setPackages((prev) => prev.map((pkg) => (pkg.id === packageId ? { ...pkg, courierServiceId, courier: courierName } : pkg)));
  };

  const updatePackageWeight = (packageId: string, weight: number) => {
    if (weight < 0) return;
    setPackages((prev) => prev.map((pkg) => (pkg.id === packageId ? { ...pkg, weight } : pkg)));
  };

  const updatePackageContents = (packageId: string, contents: string) => {
    setPackages((prev) => prev.map((pkg) => (pkg.id === packageId ? { ...pkg, contents } : pkg)));
  };

  const updatePackageDeclaredValue = (packageId: string, declaredValue: number) => {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === packageId ? { ...pkg, declaredValue } : pkg)),
    );
  };

  const updatePackageOversized = (packageId: string, oversized: boolean) => {
    setPackages((prev) => prev.map((pkg) => (pkg.id === packageId ? { ...pkg, oversized } : pkg)));
  };

  const updatePackageShippingCost = (packageId: string, shippingCost: number | undefined) => {
    setPackages((prev) => prev.map((pkg) => (pkg.id === packageId ? { ...pkg, shippingCost } : pkg)));
  };

  return {
    packages,
    setPackages,
    activePackageId,
    setActivePackageId,
    productDrawerOpen,
    setProductDrawerOpen,
    handleProductsConfirm,
    removeProductFromPackage,
    updateQuantity,
    updateVehicle,
    updateRollAssignment,
    setRollAssignments,
    toggleExcludeFromDiscount,
    addPackage,
    removePackage,
    updatePackageShippingMethod,
    updatePackagePackagingType,
    updatePackageDimension,
    updatePackageCourier,
    updatePackageWeight,
    updatePackageContents,
    updatePackageDeclaredValue,
    updatePackageOversized,
    updatePackageShippingCost,
    updateRequiredM2,
    updateProductDiscount,
  };
}
