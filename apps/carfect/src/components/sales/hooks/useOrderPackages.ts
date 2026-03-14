import { useState, useEffect, useCallback } from 'react';

export type DeliveryType = 'shipping' | 'pickup' | 'uber';
export type PackagingType = 'karton' | 'tuba' | 'koperta';

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
  /** @deprecated Use rollAssignments instead */
  rollId?: string;
  /** @deprecated Use rollAssignments instead */
  rollUsageM2?: number;
  /** @deprecated Use rollAssignments instead */
  rollWidthMm?: number;
  rollAssignments?: RollAssignment[];
}

export const getItemKey = (p: OrderProduct) => p.instanceKey;

export const createDefaultPackage = (): OrderPackage => ({
  id: crypto.randomUUID(),
  shippingMethod: 'shipping',
  packagingType: 'karton',
  dimensions: { length: 0, width: 0, height: 0 },
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
    setPackages(prev => {
      const cleaned = prev.map(pkg => ({
        ...pkg,
        productKeys: pkg.productKeys.filter(k => currentKeys.has(k)),
      }));
      if (JSON.stringify(cleaned) !== JSON.stringify(prev)) return cleaned;
      return prev;
    });
  }, [products]);

  const handleProductsConfirm = useCallback((selected: Array<{
    productId: string;
    variantId?: string;
    variantName?: string;
    shortName?: string;
    fullName: string;
    priceNet: number;
    priceUnit?: string;
  }>) => {
    if (!activePackageId) return;

    // Each selected product becomes a new instance with a unique key
    const newProducts: OrderProduct[] = selected.map(s => {
      const displayName = s.variantName
        ? `${s.shortName || s.fullName} - ${s.variantName}`
        : s.shortName || s.fullName;
      return {
        instanceKey: crypto.randomUUID(),
        productId: s.productId,
        variantId: s.variantId,
        name: displayName,
        priceNet: s.priceNet,
        priceUnit: s.priceUnit || 'szt.',
        quantity: 1,
        vehicle: '',
      };
    });

    const newKeys = newProducts.map(p => p.instanceKey);

    setProducts(prev => [...prev, ...newProducts]);

    setPackages(prev => prev.map(pkg => {
      if (pkg.id === activePackageId) {
        return { ...pkg, productKeys: [...pkg.productKeys, ...newKeys] };
      }
      return pkg;
    }));

    setActivePackageId(null);
  }, [activePackageId, setProducts]);

  const removeProductFromPackage = (packageId: string, productKey: string) => {
    const inOtherPackage = packages.some(
      pkg => pkg.id !== packageId && pkg.productKeys.includes(productKey)
    );

    setPackages(prev => prev.map(pkg => {
      if (pkg.id !== packageId) return pkg;
      return { ...pkg, productKeys: pkg.productKeys.filter(k => k !== productKey) };
    }));

    if (!inOtherPackage) {
      setProducts(prev => prev.filter(p => getItemKey(p) !== productKey));
    }
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity < 1) return;
    setProducts(prev =>
      prev.map(p => (getItemKey(p) === key ? { ...p, quantity } : p))
    );
  };

  const updateVehicle = (key: string, vehicle: string) => {
    setProducts(prev =>
      prev.map(p => (getItemKey(p) === key ? { ...p, vehicle } : p))
    );
  };

  const updateRollAssignment = (key: string, rollId: string | null, rollUsageM2: number, rollWidthMm?: number) => {
    setProducts(prev =>
      prev.map(p =>
        getItemKey(p) === key
          ? {
              ...p,
              rollId: rollId || undefined,
              rollUsageM2: rollId ? rollUsageM2 : undefined,
              rollWidthMm: rollId ? rollWidthMm : undefined,
            }
          : p
      )
    );
  };

  const setRollAssignments = (key: string, assignments: RollAssignment[]) => {
    setProducts(prev =>
      prev.map(p =>
        getItemKey(p) === key
          ? { ...p, rollAssignments: assignments }
          : p
      )
    );
  };

  const addPackage = () => {
    setPackages(prev => [...prev, createDefaultPackage()]);
  };

  const removePackage = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;

    const keysInOtherPackages = new Set<string>();
    packages.forEach(p => {
      if (p.id !== packageId) {
        p.productKeys.forEach(k => keysInOtherPackages.add(k));
      }
    });
    const orphanedKeys = new Set(pkg.productKeys.filter(k => !keysInOtherPackages.has(k)));

    setPackages(prev => prev.filter(p => p.id !== packageId));
    if (orphanedKeys.size > 0) {
      setProducts(prev => prev.filter(p => !orphanedKeys.has(getItemKey(p))));
    }
  };

  const updatePackageShippingMethod = (packageId: string, method: DeliveryType) => {
    setPackages(prev =>
      prev.map(pkg => {
        if (pkg.id !== packageId) return pkg;
        if (method === 'shipping') {
          return {
            ...pkg,
            shippingMethod: method,
            packagingType: pkg.packagingType || 'karton',
            dimensions: pkg.dimensions || { length: 0, width: 0, height: 0 },
          };
        }
        return { ...pkg, shippingMethod: method, packagingType: undefined, dimensions: undefined };
      })
    );
  };

  const updatePackagePackagingType = (packageId: string, type: PackagingType) => {
    setPackages(prev =>
      prev.map(pkg => {
        if (pkg.id !== packageId) return pkg;
        const dimensions = type === 'karton'
          ? { length: 0, width: 0, height: 0 }
          : type === 'tuba'
            ? { length: 0, diameter: 0 }
            : undefined;
        return { ...pkg, packagingType: type, dimensions };
      })
    );
  };

  const updatePackageDimension = (packageId: string, field: string, value: number) => {
    setPackages(prev =>
      prev.map(pkg => {
        if (pkg.id !== packageId || !pkg.dimensions) return pkg;
        return { ...pkg, dimensions: { ...pkg.dimensions, [field]: value } };
      })
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
    addPackage,
    removePackage,
    updatePackageShippingMethod,
    updatePackagePackagingType,
    updatePackageDimension,
  };
}
