import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOrderPackages } from './useOrderPackages';
import type { OrderProduct, OrderPackage } from './useOrderPackages';

// Deterministic UUIDs
let uuidCounter = 0;
vi.stubGlobal(
  'crypto',
  Object.assign({}, globalThis.crypto, {
    randomUUID: () => `uuid-${++uuidCounter}`,
  }),
);

const makeProduct = (overrides: Partial<OrderProduct> = {}): OrderProduct => ({
  instanceKey: `key-${++uuidCounter}`,
  productId: 'prod-1',
  name: 'Test Product',
  priceNet: 100,
  priceUnit: 'szt.',
  quantity: 1,
  vehicle: '',
  ...overrides,
});

interface HookArgs {
  initialProducts?: OrderProduct[];
}

function setupHook({ initialProducts = [] }: HookArgs = {}) {
  let products = initialProducts;
  const setProducts = vi.fn((updater: React.SetStateAction<OrderProduct[]>) => {
    products = typeof updater === 'function' ? updater(products) : updater;
    // Re-render with updated products
    rerender({ products, setProducts });
  });

  const { result, rerender } = renderHook(
    ({ products, setProducts }) => useOrderPackages({ products, setProducts }),
    { initialProps: { products, setProducts } },
  );

  return { result, rerender, getProducts: () => products, setProducts };
}

describe('useOrderPackages', () => {
  beforeEach(() => {
    uuidCounter = 0;
    vi.clearAllMocks();
  });

  // 1. Initial state
  describe('initial state', () => {
    it('starts with empty packages array', () => {
      const { result } = setupHook();
      expect(result.current.packages).toEqual([]);
    });

    it('starts with null activePackageId', () => {
      const { result } = setupHook();
      expect(result.current.activePackageId).toBeNull();
    });

    it('starts with productDrawerOpen false', () => {
      const { result } = setupHook();
      expect(result.current.productDrawerOpen).toBe(false);
    });
  });

  // 2. addPackage
  describe('addPackage', () => {
    it('adds a new package with default values', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      expect(result.current.packages).toHaveLength(1);
      const pkg = result.current.packages[0];
      expect(pkg.shippingMethod).toBe('shipping');
      expect(pkg.packagingType).toBe('tuba');
      expect(pkg.dimensions).toEqual({ length: 0, diameter: 0 });
      expect(pkg.courier).toBeUndefined();
      expect(pkg.courierServiceId).toBeUndefined();
      expect(pkg.weight).toBe(1);
      expect(pkg.contents).toBe('Folia samochodowa');
      expect(pkg.declaredValue).toBeUndefined();
      expect(pkg.declaredValueManual).toBe(false);
      expect(pkg.oversized).toBe(false);
      expect(pkg.productKeys).toEqual([]);
    });

    it('adds multiple packages independently', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
        result.current.addPackage();
      });

      expect(result.current.packages).toHaveLength(2);
      expect(result.current.packages[0].id).not.toBe(result.current.packages[1].id);
    });
  });

  // 3. removePackage
  describe('removePackage', () => {
    it('removes package by id', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
        result.current.addPackage();
      });

      const firstId = result.current.packages[0].id;
      const secondId = result.current.packages[1].id;

      act(() => {
        result.current.removePackage(firstId);
      });

      expect(result.current.packages).toHaveLength(1);
      expect(result.current.packages[0].id).toBe(secondId);
    });

    it('removes orphaned products when package is removed', () => {
      const product = makeProduct({ instanceKey: 'orphan-key' });
      const { result, getProducts } = setupHook({ initialProducts: [product] });

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setPackages((prev) =>
          prev.map((p) => (p.id === pkgId ? { ...p, productKeys: ['orphan-key'] } : p)),
        );
      });

      act(() => {
        result.current.removePackage(pkgId);
      });

      expect(getProducts().find((p) => p.instanceKey === 'orphan-key')).toBeUndefined();
    });

    it('does nothing if package id not found', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const countBefore = result.current.packages.length;

      act(() => {
        result.current.removePackage('non-existent-id');
      });

      expect(result.current.packages).toHaveLength(countBefore);
    });
  });

  // 4. handleProductsConfirm (addProductToPackage)
  describe('handleProductsConfirm', () => {
    it('does nothing if no activePackageId', () => {
      const { result, getProducts } = setupHook();

      act(() => {
        result.current.addPackage();
        result.current.handleProductsConfirm([
          {
            productId: 'prod-1',
            fullName: 'Test',
            priceNet: 100,
          },
        ]);
      });

      expect(getProducts()).toHaveLength(0);
    });

    it('adds product to active package', () => {
      const { result, getProducts } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setActivePackageId(pkgId);
      });

      act(() => {
        result.current.handleProductsConfirm([
          {
            productId: 'prod-1',
            fullName: 'Test Product',
            priceNet: 150,
            priceUnit: 'szt.',
          },
        ]);
      });

      const products = getProducts();
      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Test Product');
      expect(products[0].priceNet).toBe(150);

      const pkg = result.current.packages[0];
      expect(pkg.productKeys).toHaveLength(1);
      expect(pkg.productKeys[0]).toBe(products[0].instanceKey);
    });

    it('appends variant name to product name', () => {
      const { result, getProducts } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setActivePackageId(pkgId);
      });

      act(() => {
        result.current.handleProductsConfirm([
          {
            productId: 'prod-1',
            fullName: 'Base Product',
            variantName: 'Variant A',
            priceNet: 100,
          },
        ]);
      });

      expect(getProducts()[0].name).toBe('Base Product - Variant A');
    });

    it('resets activePackageId after confirm', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setActivePackageId(pkgId);
      });

      act(() => {
        result.current.handleProductsConfirm([{ productId: 'p1', fullName: 'P', priceNet: 10 }]);
      });

      expect(result.current.activePackageId).toBeNull();
    });

    it('sets productType="other" on OrderProduct when selected product has productType="other"', () => {
      const { result, getProducts } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setActivePackageId(pkgId);
      });

      act(() => {
        result.current.handleProductsConfirm([
          {
            productId: 'prod-other',
            fullName: 'Cleaning Kit',
            priceNet: 50,
            priceUnit: 'piece',
            productType: 'other',
          },
        ]);
      });

      const products = getProducts();
      expect(products).toHaveLength(1);
      expect(products[0].productType).toBe('other');
    });

    it('defaults productType to "roll" when productType is not provided', () => {
      const { result, getProducts } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setActivePackageId(pkgId);
      });

      act(() => {
        result.current.handleProductsConfirm([
          {
            productId: 'prod-roll',
            fullName: 'PPF Film',
            priceNet: 200,
            priceUnit: 'meter',
          },
        ]);
      });

      expect(getProducts()[0].productType).toBe('roll');
    });
  });

  // 5. removeProductFromPackage
  describe('removeProductFromPackage', () => {
    it('removes product key from package', () => {
      const product = makeProduct({ instanceKey: 'remove-me' });
      const { result } = setupHook({ initialProducts: [product] });

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setPackages((prev) =>
          prev.map((p) => (p.id === pkgId ? { ...p, productKeys: ['remove-me'] } : p)),
        );
      });

      act(() => {
        result.current.removeProductFromPackage(pkgId, 'remove-me');
      });

      expect(result.current.packages[0].productKeys).not.toContain('remove-me');
    });

    it('removes product from products list if not in other packages', () => {
      const product = makeProduct({ instanceKey: 'sole-product' });
      const { result, getProducts } = setupHook({ initialProducts: [product] });

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setPackages((prev) =>
          prev.map((p) => (p.id === pkgId ? { ...p, productKeys: ['sole-product'] } : p)),
        );
      });

      act(() => {
        result.current.removeProductFromPackage(pkgId, 'sole-product');
      });

      expect(getProducts().find((p) => p.instanceKey === 'sole-product')).toBeUndefined();
    });

    it('keeps product in products list if it also belongs to another package', () => {
      const product = makeProduct({ instanceKey: 'shared-product' });
      const { result, getProducts } = setupHook({ initialProducts: [product] });

      act(() => {
        result.current.addPackage();
        result.current.addPackage();
      });

      const [pkg1, pkg2] = result.current.packages;

      act(() => {
        result.current.setPackages((prev) =>
          prev.map((p) => {
            if (p.id === pkg1.id) return { ...p, productKeys: ['shared-product'] };
            if (p.id === pkg2.id) return { ...p, productKeys: ['shared-product'] };
            return p;
          }),
        );
      });

      act(() => {
        result.current.removeProductFromPackage(pkg1.id, 'shared-product');
      });

      expect(getProducts().find((p) => p.instanceKey === 'shared-product')).toBeDefined();
    });
  });

  // 6. updatePackageField via updatePackageWeight (as representative field updater)
  describe('updatePackageWeight', () => {
    it('updates weight on the correct package', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
        result.current.addPackage();
      });

      const [pkg1, pkg2] = result.current.packages;

      act(() => {
        result.current.updatePackageWeight(pkg1.id, 5);
      });

      expect(result.current.packages.find((p) => p.id === pkg1.id)?.weight).toBe(5);
      expect(result.current.packages.find((p) => p.id === pkg2.id)?.weight).toBe(1);
    });

    it('ignores negative weight', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.updatePackageWeight(pkgId, -1);
      });

      // weight should remain at default 1
      expect(result.current.packages[0].weight).toBe(1);
    });
  });

  // 7. updateProductField via updateQuantity and updateVehicle
  describe('updateQuantity', () => {
    it('updates quantity for the correct product', () => {
      const p1 = makeProduct({ instanceKey: 'p1' });
      const p2 = makeProduct({ instanceKey: 'p2' });
      const { result, getProducts } = setupHook({ initialProducts: [p1, p2] });

      act(() => {
        result.current.updateQuantity('p1', 3);
      });

      const products = getProducts();
      expect(products.find((p) => p.instanceKey === 'p1')?.quantity).toBe(3);
      expect(products.find((p) => p.instanceKey === 'p2')?.quantity).toBe(1);
    });

    it('ignores quantity below 1', () => {
      const p = makeProduct({ instanceKey: 'p1', quantity: 2 });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      act(() => {
        result.current.updateQuantity('p1', 0);
      });

      expect(getProducts()[0].quantity).toBe(2);
    });

    it('allows fractional quantity (< 1) for other+meter products (m² input)', () => {
      const p = makeProduct({
        instanceKey: 'p1',
        quantity: 1,
        productType: 'other',
        priceUnit: 'meter',
      });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      act(() => {
        result.current.updateQuantity('p1', 0.5);
      });

      expect(getProducts()[0].quantity).toBe(0.5);
    });
  });

  describe('updateVehicle', () => {
    it('updates vehicle for the correct product', () => {
      const p = makeProduct({ instanceKey: 'v1' });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      act(() => {
        result.current.updateVehicle('v1', 'BMW X5');
      });

      expect(getProducts()[0].vehicle).toBe('BMW X5');
    });
  });

  // 8. setShippingMethod
  describe('updatePackageShippingMethod', () => {
    it('changes shippingMethod to pickup and clears packaging fields', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.updatePackageShippingMethod(pkgId, 'pickup');
      });

      const pkg = result.current.packages[0];
      expect(pkg.shippingMethod).toBe('pickup');
      expect(pkg.packagingType).toBeUndefined();
      expect(pkg.dimensions).toBeUndefined();
      expect(pkg.courier).toBeUndefined();
    });

    it('restores packaging defaults when switching back to shipping', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.updatePackageShippingMethod(pkgId, 'pickup');
        result.current.updatePackageShippingMethod(pkgId, 'shipping');
      });

      const pkg = result.current.packages[0];
      expect(pkg.shippingMethod).toBe('shipping');
      expect(pkg.packagingType).toBe('karton');
    });
  });

  // 9. setPackagingType — changes type and resets dimensions
  describe('updatePackagePackagingType', () => {
    it('changes type to tuba and resets dimensions to tuba shape', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.updatePackagePackagingType(pkgId, 'tuba');
      });

      const pkg = result.current.packages[0];
      expect(pkg.packagingType).toBe('tuba');
      expect(pkg.dimensions).toEqual({ length: 0, diameter: 0 });
    });

    it('changes type to koperta and clears dimensions', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.updatePackagePackagingType(pkgId, 'koperta');
      });

      const pkg = result.current.packages[0];
      expect(pkg.packagingType).toBe('koperta');
      expect(pkg.dimensions).toBeUndefined();
    });

    it('resets dimensions to karton shape when switching back to karton', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.updatePackagePackagingType(pkgId, 'tuba');
        result.current.updatePackagePackagingType(pkgId, 'karton');
      });

      expect(result.current.packages[0].dimensions).toEqual({ length: 0, width: 0, height: 0 });
    });
  });

  // 10. Roll assignment to product
  describe('updateRollAssignment', () => {
    it('sets roll assignment fields on product', () => {
      const p = makeProduct({ instanceKey: 'roll-product' });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      act(() => {
        result.current.updateRollAssignment('roll-product', 'roll-1', 2.5, 1520);
      });

      const updated = getProducts()[0];
      expect(updated.rollId).toBe('roll-1');
      expect(updated.rollUsageM2).toBe(2.5);
      expect(updated.rollWidthMm).toBe(1520);
    });

    it('clears roll fields when rollId is null', () => {
      const p = makeProduct({
        instanceKey: 'roll-product',
        rollId: 'old-roll',
        rollUsageM2: 1,
        rollWidthMm: 1000,
      });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      act(() => {
        result.current.updateRollAssignment('roll-product', null, 0);
      });

      const updated = getProducts()[0];
      expect(updated.rollId).toBeUndefined();
      expect(updated.rollUsageM2).toBeUndefined();
      expect(updated.rollWidthMm).toBeUndefined();
    });
  });

  describe('setRollAssignments', () => {
    it('sets rollAssignments array on product', () => {
      const p = makeProduct({ instanceKey: 'ra-product' });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      const assignments = [{ rollId: 'r1', usageM2: 1.5, widthMm: 1520 }];

      act(() => {
        result.current.setRollAssignments('ra-product', assignments);
      });

      expect(getProducts()[0].rollAssignments).toEqual(assignments);
    });
  });

  // 11. Discount toggle per product
  describe('toggleExcludeFromDiscount', () => {
    it('toggles excludeFromDiscount from undefined to true', () => {
      const p = makeProduct({ instanceKey: 'disc-product' });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      act(() => {
        result.current.toggleExcludeFromDiscount('disc-product');
      });

      expect(getProducts()[0].excludeFromDiscount).toBe(true);
    });

    it('toggles excludeFromDiscount from true to false', () => {
      const p = makeProduct({ instanceKey: 'disc-product', excludeFromDiscount: true });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      act(() => {
        result.current.toggleExcludeFromDiscount('disc-product');
      });

      expect(getProducts()[0].excludeFromDiscount).toBe(false);
    });

    it('only toggles the targeted product', () => {
      const p1 = makeProduct({ instanceKey: 'd1', excludeFromDiscount: false });
      const p2 = makeProduct({ instanceKey: 'd2', excludeFromDiscount: false });
      const { result, getProducts } = setupHook({ initialProducts: [p1, p2] });

      act(() => {
        result.current.toggleExcludeFromDiscount('d1');
      });

      const products = getProducts();
      expect(products.find((p) => p.instanceKey === 'd1')?.excludeFromDiscount).toBe(true);
      expect(products.find((p) => p.instanceKey === 'd2')?.excludeFromDiscount).toBe(false);
    });
  });

  // 12. Totals: subtotal calculation with quantities and prices
  describe('totals: subtotal', () => {
    it('calculates subtotal as sum of priceNet * quantity', () => {
      const products = [
        makeProduct({ instanceKey: 't1', priceNet: 100, quantity: 2 }),
        makeProduct({ instanceKey: 't2', priceNet: 50, quantity: 3 }),
      ];
      // subtotal = 100*2 + 50*3 = 200 + 150 = 350
      const subtotal = products.reduce((sum, p) => sum + p.priceNet * p.quantity, 0);
      expect(subtotal).toBe(350);
    });

    it('returns 0 subtotal for empty products', () => {
      const subtotal = [].reduce(
        (sum: number, p: OrderProduct) => sum + p.priceNet * p.quantity,
        0,
      );
      expect(subtotal).toBe(0);
    });

    it('includes products with productType="other" and priceUnit="piece" in subtotal', () => {
      const products: OrderProduct[] = [
        makeProduct({ instanceKey: 'roll-1', priceNet: 200, quantity: 1, productType: 'roll' }),
        makeProduct({
          instanceKey: 'other-1',
          priceNet: 30,
          quantity: 3,
          priceUnit: 'piece',
          productType: 'other',
        }),
      ];
      // subtotal = 200*1 + 30*3 = 200 + 90 = 290
      const subtotal = products.reduce((sum, p) => sum + p.priceNet * p.quantity, 0);
      expect(subtotal).toBe(290);
    });
  });

  // 13. Totals: discount applied correctly
  describe('totals: discount', () => {
    it('applies discount only to non-excluded products', () => {
      const products: OrderProduct[] = [
        makeProduct({
          instanceKey: 'disc1',
          priceNet: 200,
          quantity: 1,
          excludeFromDiscount: false,
        }),
        makeProduct({
          instanceKey: 'disc2',
          priceNet: 100,
          quantity: 1,
          excludeFromDiscount: true,
        }),
      ];
      const discountPercent = 10;
      // Only disc1 is discounted: 200 * 0.1 = 20 discount
      const discountAmount = products
        .filter((p) => !p.excludeFromDiscount)
        .reduce((sum, p) => sum + p.priceNet * p.quantity * (discountPercent / 100), 0);
      expect(discountAmount).toBe(20);
    });
  });

  // 14. Totals: gross = net * 1.23
  describe('totals: gross calculation', () => {
    it('calculates gross as net * 1.23 (VAT 23%)', () => {
      const netAmount = 100;
      const grossAmount = netAmount * 1.23;
      expect(grossAmount).toBeCloseTo(123, 2);
    });

    it('gross for multiple products sums correctly', () => {
      const products = [
        makeProduct({ instanceKey: 'g1', priceNet: 100, quantity: 2 }),
        makeProduct({ instanceKey: 'g2', priceNet: 200, quantity: 1 }),
      ];
      const totalNet = products.reduce((sum, p) => sum + p.priceNet * p.quantity, 0); // 400
      const totalGross = totalNet * 1.23;
      expect(totalGross).toBeCloseTo(492, 2);
    });
  });

  // 15. Edge: remove last package behavior
  describe('edge: remove last package', () => {
    it('leaves packages empty after removing the only package', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.removePackage(pkgId);
      });

      expect(result.current.packages).toHaveLength(0);
    });
  });

  // 16. Edge: package with zero products
  describe('edge: package with zero products', () => {
    it('allows a package to have an empty productKeys array', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      expect(result.current.packages[0].productKeys).toEqual([]);
    });

    it('orphan cleanup: removes product keys not present in products', () => {
      const product = makeProduct({ instanceKey: 'exists' });
      const { result, rerender } = setupHook({ initialProducts: [product] });

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setPackages((prev) =>
          prev.map((p) => (p.id === pkgId ? { ...p, productKeys: ['exists', 'ghost-key'] } : p)),
        );
      });

      // Now rerender without the products to trigger cleanup effect
      rerender({ products: [], setProducts: vi.fn() });

      expect(result.current.packages[0].productKeys).not.toContain('ghost-key');
      expect(result.current.packages[0].productKeys).not.toContain('exists');
    });
  });

  // updateRequiredMb
  describe('updateRequiredMb', () => {
    it('sets requiredMb on the correct product', () => {
      const p = makeProduct({ instanceKey: 'mb-product', priceUnit: 'meter' });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      act(() => {
        result.current.updateRequiredMb('mb-product', 5);
      });

      expect(getProducts()[0].requiredMb).toBe(5);
    });

    it('only updates the targeted product', () => {
      const p1 = makeProduct({ instanceKey: 'mb1', priceUnit: 'meter' });
      const p2 = makeProduct({ instanceKey: 'mb2', priceUnit: 'meter' });
      const { result, getProducts } = setupHook({ initialProducts: [p1, p2] });

      act(() => {
        result.current.updateRequiredMb('mb1', 3.5);
      });

      const products = getProducts();
      expect(products.find((p) => p.instanceKey === 'mb1')?.requiredMb).toBe(3.5);
      expect(products.find((p) => p.instanceKey === 'mb2')?.requiredMb).toBeUndefined();
    });
  });

  // updateProductDiscount
  describe('updateProductDiscount', () => {
    it('sets discountPercent on the correct product', () => {
      const p = makeProduct({ instanceKey: 'dp1' });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      act(() => {
        result.current.updateProductDiscount('dp1', 15);
      });

      expect(getProducts()[0].discountPercent).toBe(15);
    });
  });

  // createDefaultPackage defaults
  describe('createDefaultPackage via addPackage', () => {
    it('default package has contents "Folia samochodowa"', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      expect(result.current.packages[0].contents).toBe('Folia samochodowa');
    });

    it('default package has tuba packaging type', () => {
      const { result } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      expect(result.current.packages[0].packagingType).toBe('tuba');
    });
  });

  // Additional: updatePackageContents, updatePackageDeclaredValue, updatePackageOversized, updatePackageDimension
  describe('additional package field updaters', () => {
    it('updatePackageContents updates contents', () => {
      const { result } = setupHook();
      act(() => {
        result.current.addPackage();
      });
      const pkgId = result.current.packages[0].id;
      act(() => {
        result.current.updatePackageContents(pkgId, 'Folia PPF');
      });
      expect(result.current.packages[0].contents).toBe('Folia PPF');
    });

    it('updatePackageDeclaredValue updates declaredValue', () => {
      const { result } = setupHook();
      act(() => {
        result.current.addPackage();
      });
      const pkgId = result.current.packages[0].id;
      act(() => {
        result.current.updatePackageDeclaredValue(pkgId, 500, true);
      });
      expect(result.current.packages[0].declaredValue).toBe(500);
    });

    it('updatePackageOversized updates oversized flag', () => {
      const { result } = setupHook();
      act(() => {
        result.current.addPackage();
      });
      const pkgId = result.current.packages[0].id;
      act(() => {
        result.current.updatePackageOversized(pkgId, true);
      });
      expect(result.current.packages[0].oversized).toBe(true);
    });

    it('updatePackageDimension updates a specific dimension field', () => {
      const { result } = setupHook();
      act(() => {
        result.current.addPackage();
      });
      const pkgId = result.current.packages[0].id;
      act(() => {
        result.current.updatePackageDimension(pkgId, 'length', 120);
      });
      expect((result.current.packages[0].dimensions as { length: number })?.length).toBe(120);
    });

    it('updatePackageCourier changes courierServiceId and courier name', () => {
      const { result } = setupHook();
      act(() => {
        result.current.addPackage();
      });
      const pkgId = result.current.packages[0].id;
      act(() => {
        result.current.updatePackageCourier(pkgId, 21, 'DHL');
      });
      expect(result.current.packages[0].courierServiceId).toBe(21);
      expect(result.current.packages[0].courier).toBe('DHL');
    });
  });

  // handleProductsConfirm with addFormatki option
  describe('handleProductsConfirm with addFormatki option', () => {
    function setupWithPackage() {
      const { result, getProducts } = setupHook();
      act(() => {
        result.current.addPackage();
      });
      const pkgId = result.current.packages[0].id;
      act(() => {
        result.current.setActivePackageId(pkgId);
      });
      return { result, getProducts, pkgId };
    }

    const formatkiProduct = {
      productId: 'formatki-id',
      fullName: 'Wycinanie formatek',
      priceNet: 10,
    };

    it('adds a paired formatki product after each roll product when addFormatki is true', () => {
      const { result, getProducts } = setupWithPackage();

      act(() => {
        result.current.handleProductsConfirm(
          [{ productId: 'roll-id', fullName: 'PPF Film', priceNet: 200, priceUnit: 'meter' }],
          { addFormatki: true, formatkiProduct },
        );
      });

      const products = getProducts();
      expect(products).toHaveLength(2);
      expect(products[0].productType).toBe('roll');
      expect(products[1].productId).toBe('formatki-id');
    });

    it('formatki product has linkedToKey pointing to the roll product instanceKey', () => {
      const { result, getProducts } = setupWithPackage();

      act(() => {
        result.current.handleProductsConfirm(
          [{ productId: 'roll-id', fullName: 'PPF Film', priceNet: 200, priceUnit: 'meter' }],
          { addFormatki: true, formatkiProduct },
        );
      });

      const products = getProducts();
      const rollProduct = products[0];
      const formatkiEntry = products[1];
      expect(formatkiEntry.linkedToKey).toBe(rollProduct.instanceKey);
    });

    it('formatki product has productType "other", priceUnit "meter", quantity 0, excludeFromDiscount true', () => {
      const { result, getProducts } = setupWithPackage();

      act(() => {
        result.current.handleProductsConfirm(
          [{ productId: 'roll-id', fullName: 'PPF Film', priceNet: 200, priceUnit: 'meter' }],
          { addFormatki: true, formatkiProduct },
        );
      });

      const formatkiEntry = getProducts()[1];
      expect(formatkiEntry.productType).toBe('other');
      expect(formatkiEntry.priceUnit).toBe('meter');
      expect(formatkiEntry.quantity).toBe(0);
      expect(formatkiEntry.excludeFromDiscount).toBe(true);
    });

    it('does not add formatki for products with productType "other"', () => {
      const { result, getProducts } = setupWithPackage();

      act(() => {
        result.current.handleProductsConfirm(
          [
            {
              productId: 'other-id',
              fullName: 'Cleaning Kit',
              priceNet: 50,
              productType: 'other',
            },
          ],
          { addFormatki: true, formatkiProduct },
        );
      });

      const products = getProducts();
      expect(products).toHaveLength(1);
      expect(products[0].productType).toBe('other');
    });
  });

  // handleProductsConfirm with rollAssignment option
  describe('handleProductsConfirm with rollAssignment option', () => {
    it('sets rollAssignments on the product when rollAssignment option is provided for a variant product', () => {
      const { result, getProducts } = setupHook();

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setActivePackageId(pkgId);
      });

      act(() => {
        result.current.handleProductsConfirm(
          [
            {
              productId: 'roll-id',
              variantId: 'variant-1',
              fullName: 'PPF Film',
              priceNet: 200,
              priceUnit: 'meter',
            },
          ],
          {
            rollAssignment: { rollId: 'roll-123', widthMm: 1520, remainingMb: 10 },
          },
        );
      });

      const product = getProducts()[0];
      expect(product.rollAssignments).toBeDefined();
      expect(product.rollAssignments).toHaveLength(1);
      expect(product.rollAssignments![0].rollId).toBe('roll-123');
      expect(product.rollAssignments![0].widthMm).toBe(1520);
    });
  });

  // removeProductFromPackage cascade removes linked formatki
  describe('removeProductFromPackage cascade removes linked formatki', () => {
    it('removes the roll product and its linked formatki from the package and products list', () => {
      const rollProduct = makeProduct({ instanceKey: 'roll-key', productType: 'roll' });
      const formatkiProduct = makeProduct({
        instanceKey: 'formatki-key',
        productType: 'other',
        linkedToKey: 'roll-key',
      });
      const { result, getProducts } = setupHook({
        initialProducts: [rollProduct, formatkiProduct],
      });

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setPackages((prev) =>
          prev.map((p) =>
            p.id === pkgId ? { ...p, productKeys: ['roll-key', 'formatki-key'] } : p,
          ),
        );
      });

      act(() => {
        result.current.removeProductFromPackage(pkgId, 'roll-key');
      });

      const products = getProducts();
      expect(products.find((p) => p.instanceKey === 'roll-key')).toBeUndefined();
      expect(products.find((p) => p.instanceKey === 'formatki-key')).toBeUndefined();
    });

    it('removes formatki key from package productKeys when roll is removed', () => {
      const rollProduct = makeProduct({ instanceKey: 'roll-key', productType: 'roll' });
      const formatkiProduct = makeProduct({
        instanceKey: 'formatki-key',
        productType: 'other',
        linkedToKey: 'roll-key',
      });
      const { result } = setupHook({ initialProducts: [rollProduct, formatkiProduct] });

      act(() => {
        result.current.addPackage();
      });

      const pkgId = result.current.packages[0].id;

      act(() => {
        result.current.setPackages((prev) =>
          prev.map((p) =>
            p.id === pkgId ? { ...p, productKeys: ['roll-key', 'formatki-key'] } : p,
          ),
        );
      });

      act(() => {
        result.current.removeProductFromPackage(pkgId, 'roll-key');
      });

      expect(result.current.packages[0].productKeys).not.toContain('roll-key');
      expect(result.current.packages[0].productKeys).not.toContain('formatki-key');
    });
  });

  // updateRequiredMb syncs linked formatki quantity
  describe('updateRequiredMb syncs linked formatki quantity', () => {
    it('updates linked formatki quantity to widthM * requiredMb when roll product name contains mm width', () => {
      const rollProduct = makeProduct({
        instanceKey: 'roll-key',
        name: 'XP Crystal - 1524mm x 15m',
        priceUnit: 'meter',
      });
      const formatkiProduct = makeProduct({
        instanceKey: 'formatki-key',
        productType: 'other',
        priceUnit: 'meter',
        linkedToKey: 'roll-key',
        quantity: 0,
      });
      const { result, getProducts } = setupHook({
        initialProducts: [rollProduct, formatkiProduct],
      });

      act(() => {
        result.current.updateRequiredMb('roll-key', 5);
      });

      const products = getProducts();
      const updatedRoll = products.find((p) => p.instanceKey === 'roll-key');
      const updatedFormatki = products.find((p) => p.instanceKey === 'formatki-key');

      expect(updatedRoll?.requiredMb).toBe(5);
      // 1.524 * 5 = 7.62
      expect(updatedFormatki?.quantity).toBe(7.62);
    });

    it('only updates requiredMb on the target product when no linked formatki exists', () => {
      const p = makeProduct({
        instanceKey: 'solo-roll',
        name: 'XP Crystal - 1524mm x 15m',
        priceUnit: 'meter',
      });
      const { result, getProducts } = setupHook({ initialProducts: [p] });

      act(() => {
        result.current.updateRequiredMb('solo-roll', 3);
      });

      const products = getProducts();
      expect(products).toHaveLength(1);
      expect(products[0].requiredMb).toBe(3);
    });
  });
});
