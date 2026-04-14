import { useState, useEffect, useCallback } from 'react';

export type DeliveryType = 'shipping' | 'pickup' | 'uber';
export type ProductType = 'roll' | 'other';
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
  declaredValueManual?: boolean;
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
  /** Required running meters (mb) — converted to m² via roll width for pricing */
  requiredMb?: number;
  /** Per-product discount percentage (overrides customer discount) */
  discountPercent?: number;
  /** Product type: 'roll' (default, with vehicle + mb) or 'other' (generic, no vehicle) */
  productType?: 'roll' | 'other';
  /** Links this product to a parent roll product (e.g. formatki → roll) */
  linkedToKey?: string;
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
  contents: 'Folia samochodowa',
  declaredValueManual: false,
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
        productType?: 'roll' | 'other';
        excludeFromDiscount?: boolean;
        categoryName?: string;
      }>,
      options?: {
        /** Auto-add "Wycinanie formatek" paired with each roll product */
        addFormatki?: boolean;
        /** Product data for formatki (fetched from DB) */
        formatkiProduct?: { productId: string; fullName: string; priceNet: number };
        /** Auto-assign this roll to the first roll product */
        rollAssignment?: { rollId: string; widthMm: number; remainingMb: number };
      },
    ) => {
      if (!activePackageId) return;

      const allNewProducts: OrderProduct[] = [];

      // Each selected product becomes a new instance with a unique key
      for (const s of selected) {
        const displayName = s.variantName ? `${s.fullName} - ${s.variantName}` : s.fullName;
        const ra = options?.rollAssignment;
        // Auto-assign roll if this is the variant that was matched by roll quick search
        const autoAssign =
          ra && s.variantId && (s.productType === 'roll' || !s.productType)
            ? [{ rollId: ra.rollId, usageM2: 0, widthMm: ra.widthMm }]
            : undefined;

        const rollProduct: OrderProduct = {
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
          productType: s.productType || 'roll',
          rollAssignments: autoAssign,
        };
        allNewProducts.push(rollProduct);

        // Auto-add paired "Wycinanie formatek" for roll products
        if (
          options?.addFormatki &&
          options.formatkiProduct &&
          (s.productType === 'roll' || !s.productType)
        ) {
          allNewProducts.push({
            instanceKey: crypto.randomUUID(),
            productId: options.formatkiProduct.productId,
            name: options.formatkiProduct.fullName,
            priceNet: options.formatkiProduct.priceNet,
            priceUnit: 'meter',
            quantity: 0,
            vehicle: '',
            excludeFromDiscount: true,
            productType: 'other',
            linkedToKey: rollProduct.instanceKey,
          });
        }
      }

      const newKeys = allNewProducts.map((p) => p.instanceKey);
      const hasFolia = allNewProducts.some((p) => p.categoryName?.toLowerCase().includes('folie'));

      setProducts((prev) => [...prev, ...allNewProducts]);

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
    // Find all linked formatki that should also be removed
    const linkedKeys = products
      .filter((p) => p.linkedToKey === productKey)
      .map(getItemKey);
    const keysToRemove = [productKey, ...linkedKeys];

    // Check if any Folia products remain in this package after removal
    const pkg = packages.find((p) => p.id === packageId);
    const remainingKeys = pkg
      ? pkg.productKeys.filter((k) => !keysToRemove.includes(k))
      : [];
    const remainingProducts = products.filter((p) => remainingKeys.includes(getItemKey(p)));
    const stillHasFolia = remainingProducts.some((p) =>
      p.categoryName?.toLowerCase().includes('folie'),
    );

    setPackages((prev) =>
      prev.map((p) => {
        if (p.id !== packageId) return p;
        const updated = {
          ...p,
          productKeys: p.productKeys.filter((k) => !keysToRemove.includes(k)),
        };
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

    const keysInOtherPackages = new Set<string>();
    packages.forEach((p) => {
      if (p.id !== packageId) {
        p.productKeys.forEach((k) => keysInOtherPackages.add(k));
      }
    });

    const orphanedKeys = keysToRemove.filter((k) => !keysInOtherPackages.has(k));
    if (orphanedKeys.length > 0) {
      setProducts((prev) => prev.filter((p) => !orphanedKeys.includes(getItemKey(p))));
    }
  };

  const updateQuantity = (key: string, quantity: number) => {
    const product = products.find((p) => getItemKey(p) === key);
    const isOtherMeter = product?.productType === 'other' && product?.priceUnit === 'meter';
    const minQty = isOtherMeter ? 0.01 : 1;
    if (quantity < minQty) return;
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

  const updateRequiredMb = (key: string, requiredMb: number) => {
    setProducts((prev) => {
      // Find the roll product to get its width for m² calculation
      const rollProduct = prev.find((p) => getItemKey(p) === key);
      const widthMatch = rollProduct?.name.match(/(\d{3,4})\s*mm/);
      const widthM = widthMatch ? parseInt(widthMatch[1]) / 1000 : 0;
      const formatkiM2 = widthM > 0 ? widthM * requiredMb : 0;

      return prev.map((p) => {
        if (getItemKey(p) === key) return { ...p, requiredMb };
        // Sync linked formatki quantity (one-directional: roll → formatki)
        if (p.linkedToKey === key) return { ...p, quantity: parseFloat(formatkiM2.toFixed(2)) };
        return p;
      });
    });
  };

  const updateProductDiscount = (key: string, discountPercent: number) => {
    setProducts((prev) => prev.map((p) => (getItemKey(p) === key ? { ...p, discountPercent } : p)));
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
            declaredValue: pkg.declaredValue,
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

  const updatePackageCourier = (
    packageId: string,
    courierServiceId: number,
    courierName: string,
  ) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === packageId ? { ...pkg, courierServiceId, courier: courierName } : pkg,
      ),
    );
  };

  const updatePackageWeight = (packageId: string, weight: number) => {
    if (weight < 0) return;
    setPackages((prev) => prev.map((pkg) => (pkg.id === packageId ? { ...pkg, weight } : pkg)));
  };

  const updatePackageContents = (packageId: string, contents: string) => {
    setPackages((prev) => prev.map((pkg) => (pkg.id === packageId ? { ...pkg, contents } : pkg)));
  };

  const updatePackageDeclaredValue = useCallback(
    (packageId: string, value: number | undefined, isManual: boolean) => {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === packageId ? { ...p, declaredValue: value, declaredValueManual: isManual } : p,
        ),
      );
    },
    [],
  );

  const updatePackageOversized = (packageId: string, oversized: boolean) => {
    setPackages((prev) => prev.map((pkg) => (pkg.id === packageId ? { ...pkg, oversized } : pkg)));
  };

  const updatePackageShippingCost = (packageId: string, shippingCost: number | undefined) => {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === packageId ? { ...pkg, shippingCost } : pkg)),
    );
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
    updateRequiredMb,
    updateProductDiscount,
  };
}
