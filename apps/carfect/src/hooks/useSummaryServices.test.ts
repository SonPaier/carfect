import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  useSummaryServices,
  ServiceState,
  ScopeProduct,
  DrawerProduct,
} from './useSummaryServices';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';
import type { OfferState } from './useOffer';
import { defaultCustomerData, defaultVehicleData } from './useOfferTypes';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

// Mock crypto.randomUUID
let uuidCounter = 0;
vi.stubGlobal(
  'crypto',
  Object.assign({}, globalThis.crypto, {
    randomUUID: () => `summary-uuid-${++uuidCounter}`,
  }),
);

const INSTANCE_ID = 'test-instance-id';

const createOffer = (overrides: Partial<OfferState> = {}): OfferState => ({
  instanceId: INSTANCE_ID,
  customerData: defaultCustomerData,
  vehicleData: defaultVehicleData,
  selectedScopeIds: ['scope-1'],
  options: [],
  additions: [],
  vatRate: 23,
  hideUnitPrices: false,
  status: 'draft',
  ...overrides,
});

// Mock scope data that works for all offer_scopes queries
const mockScopeData = [
  {
    id: 'scope-1',
    name: 'PPF',
    short_name: 'PPF',
    is_extras_scope: false,
    default_warranty: '2 lata',
    default_payment_terms: '14 dni',
    default_notes: '',
    default_service_info: '',
    sort_order: 0,
    active: true,
    instance_id: INSTANCE_ID,
    has_unified_services: true,
  },
];

const mockScopeProducts = [
  {
    id: 'sp-1',
    scope_id: 'scope-1',
    product_id: 'prod-1',
    variant_name: null,
    is_default: true,
    sort_order: 0,
    product: {
      id: 'prod-1',
      name: 'PPF Standard',
      short_name: 'PPF Std',
      default_price: 500,
      price_from: null,
      price_small: null,
      price_medium: null,
      price_large: null,
      category_id: null,
      metadata: null,
    },
  },
  {
    id: 'sp-2',
    scope_id: 'scope-1',
    product_id: 'prod-2',
    variant_name: 'Premium',
    is_default: false,
    sort_order: 1,
    product: {
      id: 'prod-2',
      name: 'PPF Premium',
      short_name: 'PPF Prem',
      default_price: 1200,
      price_from: 900,
      price_small: null,
      price_medium: null,
      price_large: null,
      category_id: null,
      metadata: null,
    },
  },
];

function setupMocks() {
  // offer_scopes is called multiple times — once for extras, once for all
  mockSupabaseQuery('offer_scopes', { data: mockScopeData, error: null });
  mockSupabaseQuery('offer_scope_products', { data: mockScopeProducts, error: null });
  mockSupabaseQuery('unified_services', { data: [], error: null });
  mockSupabaseQuery('unified_categories', { data: [], error: null });
}

describe('useSummaryServices', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    uuidCounter = 0;
    vi.clearAllMocks();
    setupMocks();
  });

  describe('service loading', () => {
    it('loads services from scopes with default products selected', async () => {
      const offer = createOffer();
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.services).toHaveLength(1);
      const service = result.current.services[0];
      expect(service.name).toBe('PPF');
      expect(service.scopeId).toBe('scope-1');
      expect(service.isExtrasScope).toBe(false);
    });

    it('returns empty services when no scopes selected', async () => {
      const offer = createOffer({ selectedScopeIds: [] });
      // Override to return no extras scopes either
      mockSupabaseQuery('offer_scopes', { data: [], error: null });

      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.services).toHaveLength(0);
    });
  });

  describe('condition merging', () => {
    it('calls onUpdateOffer with merged conditions for new offers', async () => {
      const offer = createOffer();
      const onUpdate = vi.fn();

      renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });

      const updates = onUpdate.mock.calls[0][0];
      expect(updates).toHaveProperty('warranty', '2 lata');
      expect(updates).toHaveProperty('paymentTerms', '14 dni');
    });

    it('skips condition update on first load of existing offer', async () => {
      const offer = createOffer({ id: 'existing-offer' });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, true, onUpdate));

      // Wait for loading to complete first
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Then assert onUpdate was never called
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe('mutations', () => {
    it('adds a product to a service', async () => {
      const offer = createOffer();
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const scopeProduct: ScopeProduct = {
        id: 'sp-2',
        product_id: 'prod-2',
        variant_name: 'Premium',
        is_default: false,
        product: {
          id: 'prod-2',
          name: 'PPF Premium',
          short_name: 'PPF Prem',
          default_price: 1200,
          price_from: 900,
          price_small: null,
          price_medium: null,
          price_large: null,
          category: null,
        },
      };

      act(() => {
        result.current.addProduct('scope-1', scopeProduct);
      });

      const service = result.current.services.find((s) => s.scopeId === 'scope-1')!;
      const addedProduct = service.selectedProducts.find((p) => p.productId === 'prod-2');
      expect(addedProduct).toBeDefined();
      expect(addedProduct!.price).toBe(900); // uses price_from
      expect(addedProduct!.isPreselected).toBe(false);
    });

    it('removes a product from a service', async () => {
      const offer = createOffer();
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const productId = result.current.services[0].selectedProducts[0]?.id;
      expect(productId).toBeDefined();

      act(() => {
        result.current.removeProduct('scope-1', productId!);
      });

      expect(result.current.services[0].selectedProducts).toHaveLength(0);
      expect(result.current.services[0].totalPrice).toBe(0);
    });

    it('updates product price and recalculates total', async () => {
      const offer = createOffer();
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const productId = result.current.services[0].selectedProducts[0]?.id;
      expect(productId).toBeDefined();

      act(() => {
        result.current.updateProductPrice('scope-1', productId!, 750);
      });

      const updated = result.current.services[0].selectedProducts[0];
      expect(updated.price).toBe(750);
      expect(result.current.services[0].totalPrice).toBe(750);
    });
  });

  describe('drawer helpers', () => {
    it('getAvailableProducts excludes already selected products', async () => {
      const offer = createOffer();
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const service = result.current.services[0];
      const available = result.current.getAvailableProducts(service);

      // sp-1 is selected (default), sp-2 should be available
      const availableIds = available.map((p) => p.id);
      expect(availableIds).not.toContain('sp-1');
      expect(availableIds).toContain('sp-2');
    });

    it('mapAvailableProducts returns DrawerProduct format', async () => {
      const offer = createOffer();
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const service = result.current.services[0];
      const mapped = result.current.mapAvailableProducts(service);

      expect(mapped.length).toBeGreaterThan(0);
      const first = mapped[0];
      expect(first.productId).toBeDefined();
      expect(first.productName).toBeDefined();
      expect(typeof first.price).toBe('number');
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('category');
    });
  });

  describe('buildDrawerConfirmHandler', () => {
    it('first-if-empty strategy preselects first product when list is empty', async () => {
      const offer = createOffer();
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First clear selected products
      const productId = result.current.services[0].selectedProducts[0]?.id;
      expect(productId).toBeDefined();
      act(() => {
        result.current.removeProduct('scope-1', productId!);
      });

      const handler = result.current.buildDrawerConfirmHandler(
        'scope-1',
        'selected',
        'first-if-empty',
      );

      const newProducts: DrawerProduct[] = [
        {
          id: 'sp-2',
          productId: 'prod-2',
          productName: 'PPF Premium',
          productShortName: null,
          variantName: 'Premium',
          price: 900,
          category: null,
        },
      ];

      act(() => {
        handler(newProducts);
      });

      const service = result.current.services.find((s) => s.scopeId === 'scope-1')!;
      expect(service.selectedProducts).toHaveLength(1);
      expect(service.selectedProducts[0].isPreselected).toBe(true);
    });

    it('always strategy preselects all products', async () => {
      const offer = createOffer();
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const handler = result.current.buildDrawerConfirmHandler('scope-1', 'selected', 'always');

      const newProducts: DrawerProduct[] = [
        {
          id: 'sp-2',
          productId: 'prod-2',
          productName: 'PPF Premium',
          productShortName: null,
          variantName: 'Premium',
          price: 900,
          category: null,
        },
      ];

      act(() => {
        handler(newProducts);
      });

      const service = result.current.services.find((s) => s.scopeId === 'scope-1')!;
      const addedProduct = service.selectedProducts.find((p) => p.productId === 'prod-2');
      expect(addedProduct?.isPreselected).toBe(true);
    });

    it('never strategy does not preselect any products', async () => {
      const offer = createOffer();
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear existing and add fresh
      const productId = result.current.services[0].selectedProducts[0]?.id;
      expect(productId).toBeDefined();
      act(() => {
        result.current.removeProduct('scope-1', productId!);
      });

      const handler = result.current.buildDrawerConfirmHandler('scope-1', 'selected', 'never');

      const newProducts: DrawerProduct[] = [
        {
          id: 'sp-2',
          productId: 'prod-2',
          productName: 'PPF Premium',
          productShortName: null,
          variantName: 'Premium',
          price: 900,
          category: null,
        },
      ];

      act(() => {
        handler(newProducts);
      });

      const service = result.current.services.find((s) => s.scopeId === 'scope-1')!;
      expect(service.selectedProducts[0].isPreselected).toBe(false);
    });
  });

  describe('offer restoration (persisted offers)', () => {
    it('restores saved customer selections from existing option items', async () => {
      const offer = createOffer({
        id: 'existing-offer',
        options: [
          {
            id: 'opt-1',
            name: 'PPF',
            scopeId: 'scope-1',
            isSelected: true,
            sortOrder: 0,
            items: [
              {
                id: 'item-1',
                productId: 'prod-1',
                customName: 'PPF Standard',
                quantity: 1,
                unitPrice: 750,
                unit: 'szt',
                discountPercent: 0,
                isOptional: false,
                isCustom: false,
              },
            ],
          },
        ],
      });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, true, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const service = result.current.services.find((s) => s.scopeId === 'scope-1')!;
      expect(service.selectedProducts).toHaveLength(1);
      expect(service.selectedProducts[0].price).toBe(750); // Restored price, not default
      expect(service.selectedProducts[0].isPreselected).toBe(true); // Non-optional = preselected
    });

    it('parses multi-line customName as variant\\nproduct', async () => {
      const offer = createOffer({
        id: 'existing-offer',
        options: [
          {
            id: 'opt-1',
            name: 'PPF',
            scopeId: 'scope-1',
            isSelected: true,
            sortOrder: 0,
            items: [
              {
                id: 'item-1',
                productId: 'prod-2',
                customName: 'Premium\nPPF Premium',
                quantity: 1,
                unitPrice: 1200,
                unit: 'szt',
                discountPercent: 0,
                isOptional: false,
                isCustom: false,
              },
            ],
          },
        ],
      });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, true, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const service = result.current.services.find((s) => s.scopeId === 'scope-1')!;
      expect(service.selectedProducts).toHaveLength(1);
      expect(service.selectedProducts[0].variantName).toBe('Premium');
      expect(service.selectedProducts[0].productName).toBe('PPF Premium');
    });

    it('marks optional items as preselected when customer selected them', async () => {
      const offer = createOffer({
        id: 'existing-offer',
        defaultSelectedState: {
          selectedScopeId: null,
          selectedVariants: {},
          selectedOptionalItems: { 'item-opt': true },
          selectedItemInOption: {},
        },
        options: [
          {
            id: 'opt-1',
            name: 'PPF',
            scopeId: 'scope-1',
            isSelected: true,
            sortOrder: 0,
            items: [
              {
                id: 'item-opt',
                productId: 'prod-1',
                customName: 'PPF Standard',
                quantity: 1,
                unitPrice: 500,
                unit: 'szt',
                discountPercent: 0,
                isOptional: true,
                isCustom: false,
              },
            ],
          },
        ],
      });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, true, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const service = result.current.services.find((s) => s.scopeId === 'scope-1')!;
      expect(service.selectedProducts[0].isPreselected).toBe(true);
    });

    it('marks optional items as not preselected when customer did not select them', async () => {
      const offer = createOffer({
        id: 'existing-offer',
        defaultSelectedState: {
          selectedScopeId: null,
          selectedVariants: {},
          selectedOptionalItems: {},
          selectedItemInOption: {},
        },
        options: [
          {
            id: 'opt-1',
            name: 'PPF',
            scopeId: 'scope-1',
            isSelected: true,
            sortOrder: 0,
            items: [
              {
                id: 'item-opt',
                productId: 'prod-1',
                customName: 'PPF Standard',
                quantity: 1,
                unitPrice: 500,
                unit: 'szt',
                discountPercent: 0,
                isOptional: true,
                isCustom: false,
              },
            ],
          },
        ],
      });
      const onUpdate = vi.fn();

      // Use extras scope to test split into selected/suggested
      mockSupabaseQuery('offer_scopes', {
        data: [
          {
            ...mockScopeData[0],
            is_extras_scope: true,
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, true, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const service = result.current.services.find((s) => s.scopeId === 'scope-1')!;
      // Non-preselected optional items go to suggestedProducts for extras scopes
      expect(service.suggestedProducts).toHaveLength(1);
      expect(service.suggestedProducts[0].isPreselected).toBe(false);
    });

    it('uses default products for new offers (no existing options)', async () => {
      const offer = createOffer({ selectedScopeIds: ['scope-1'] });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const service = result.current.services.find((s) => s.scopeId === 'scope-1')!;
      // Only is_default=true product (sp-1/prod-1) should be selected
      expect(service.selectedProducts).toHaveLength(1);
      expect(service.selectedProducts[0].productId).toBe('prod-1');
      expect(service.selectedProducts[0].isDefault).toBe(true);
    });

    it('filters items without productId during restoration', async () => {
      const offer = createOffer({
        id: 'existing-offer',
        options: [
          {
            id: 'opt-1',
            name: 'PPF',
            scopeId: 'scope-1',
            isSelected: true,
            sortOrder: 0,
            items: [
              {
                id: 'item-1',
                productId: 'prod-1',
                customName: 'PPF Standard',
                quantity: 1,
                unitPrice: 500,
                unit: 'szt',
                discountPercent: 0,
                isOptional: false,
                isCustom: false,
              },
              {
                id: 'item-no-product',
                productId: '',
                customName: 'Orphan',
                quantity: 1,
                unitPrice: 100,
                unit: 'szt',
                discountPercent: 0,
                isOptional: false,
                isCustom: true,
              },
            ],
          },
        ],
      });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, true, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const service = result.current.services.find((s) => s.scopeId === 'scope-1')!;
      // Item without productId should be filtered out
      expect(service.selectedProducts).toHaveLength(1);
      expect(service.selectedProducts[0].productId).toBe('prod-1');
    });
  });

  describe('extras scope dynamic fetch', () => {
    const extrasScope = {
      id: 'extras-scope-1',
      name: 'Dodatki',
      short_name: 'Dodatki',
      is_extras_scope: true,
      has_unified_services: true,
      default_warranty: '',
      default_payment_terms: '',
      default_notes: '',
      default_service_info: '',
      sort_order: 999,
      active: true,
      instance_id: INSTANCE_ID,
    };

    const mockUnifiedServices = [
      {
        id: 'us-1',
        name: 'Powłoka ceramiczna',
        short_name: 'Ceramic',
        default_price: 300,
        price_from: null,
        price_small: null,
        price_medium: null,
        price_large: null,
        category_id: 'cat-1',
        service_type: 'both',
        visibility: 'everywhere',
        metadata: null,
      },
      {
        id: 'us-2',
        name: 'Korekta lakieru',
        short_name: 'Korekta',
        default_price: 500,
        price_from: 400,
        price_small: null,
        price_medium: null,
        price_large: null,
        category_id: 'cat-1',
        service_type: 'both',
        visibility: 'everywhere',
        metadata: null,
      },
    ];

    const mockCategories = [{ id: 'cat-1', name: 'Detailing', sort_order: 0 }];

    it('loads all unified_services with service_type=both for extras scope', async () => {
      mockSupabaseQuery('offer_scopes', {
        data: [...mockScopeData, extrasScope],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: mockUnifiedServices, error: null });
      mockSupabaseQuery('unified_categories', { data: mockCategories, error: null });

      const offer = createOffer({ selectedScopeIds: ['scope-1'] });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const extrasService = result.current.services.find((s) => s.isExtrasScope);
      expect(extrasService).toBeDefined();
      expect(extrasService!.availableProducts).toHaveLength(2);
      expect(extrasService!.availableProducts[0].product_id).toBe('us-1');
      expect(extrasService!.availableProducts[1].product_id).toBe('us-2');
    });

    it('extras scope appears even when no scopes are manually selected', async () => {
      mockSupabaseQuery('offer_scopes', {
        data: [extrasScope],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: mockUnifiedServices, error: null });
      mockSupabaseQuery('unified_categories', { data: mockCategories, error: null });

      const offer = createOffer({ selectedScopeIds: [] });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.services).toHaveLength(1);
      expect(result.current.services[0].isExtrasScope).toBe(true);
      expect(result.current.services[0].name).toBe('Dodatki');
    });

    it('extras scope is sorted last', async () => {
      mockSupabaseQuery('offer_scopes', {
        data: [extrasScope, ...mockScopeData],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: mockUnifiedServices, error: null });
      mockSupabaseQuery('unified_categories', { data: mockCategories, error: null });

      const offer = createOffer({ selectedScopeIds: ['scope-1'] });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.services).toHaveLength(2);
      expect(result.current.services[0].isExtrasScope).toBe(false);
      expect(result.current.services[1].isExtrasScope).toBe(true);
    });

    it('filters out only_reservations visibility from extras', async () => {
      const servicesWithReservation = [
        ...mockUnifiedServices,
        {
          id: 'us-3',
          name: 'Tylko rezerwacje',
          short_name: 'Rez',
          default_price: 100,
          price_from: null,
          price_small: null,
          price_medium: null,
          price_large: null,
          category_id: null,
          service_type: 'both',
          visibility: 'only_reservations',
          metadata: null,
        },
      ];

      mockSupabaseQuery('offer_scopes', {
        data: [extrasScope],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: servicesWithReservation, error: null });
      mockSupabaseQuery('unified_categories', { data: [], error: null });

      const offer = createOffer({ selectedScopeIds: [] });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const extrasService = result.current.services[0];
      // only_reservations should be filtered out
      expect(extrasService.availableProducts).toHaveLength(2);
      const productIds = extrasService.availableProducts.map((p) => p.product_id);
      expect(productIds).not.toContain('us-3');
    });

    it('resolves category names for extras products', async () => {
      mockSupabaseQuery('offer_scopes', {
        data: [extrasScope],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: mockUnifiedServices, error: null });
      mockSupabaseQuery('unified_categories', { data: mockCategories, error: null });

      const offer = createOffer({ selectedScopeIds: [] });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const extrasService = result.current.services[0];
      expect(extrasService.availableProducts[0].product?.category).toBe('Detailing');
    });

    it('auto-adds widget-selected extras for new offers', async () => {
      mockSupabaseQuery('offer_scopes', {
        data: [extrasScope],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: mockUnifiedServices, error: null });
      mockSupabaseQuery('unified_categories', { data: [], error: null });

      const offer = createOffer({
        selectedScopeIds: [],
        widgetSelectedExtras: ['us-1'],
      });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const extrasService = result.current.services[0];
      // us-1 should be auto-selected from widget
      expect(extrasService.selectedProducts).toHaveLength(1);
      expect(extrasService.selectedProducts[0].productId).toBe('us-1');
      expect(extrasService.selectedProducts[0].isPreselected).toBe(true);
    });

    it('does not require offer_scope_products for extras — uses unified_services directly', async () => {
      // Extras scope has NO products in offer_scope_products — this is the key behavior
      mockSupabaseQuery('offer_scopes', {
        data: [extrasScope],
        error: null,
      });
      mockSupabaseQuery('offer_scope_products', { data: [], error: null });
      mockSupabaseQuery('unified_services', { data: mockUnifiedServices, error: null });
      mockSupabaseQuery('unified_categories', { data: [], error: null });

      const offer = createOffer({ selectedScopeIds: [] });
      const onUpdate = vi.fn();

      const { result } = renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const extrasService = result.current.services[0];
      // Should have products from unified_services, not offer_scope_products
      expect(extrasService.availableProducts).toHaveLength(2);
      expect(extrasService.availableProducts[0].product?.name).toBe('Powłoka ceramiczna');
    });
  });

  describe('condition merging edge cases', () => {
    it('combines different warranties with scope headers', async () => {
      const multiScopeData = [
        { ...mockScopeData[0], default_warranty: '2 lata' },
        {
          id: 'scope-2',
          name: 'Ceramic',
          short_name: 'CER',
          is_extras_scope: false,
          default_warranty: '1 rok',
          default_payment_terms: '14 dni',
          default_notes: '',
          default_service_info: '',
          sort_order: 1,
          active: true,
          instance_id: INSTANCE_ID,
          has_unified_services: true,
        },
      ];

      mockSupabaseQuery('offer_scopes', { data: multiScopeData, error: null });
      mockSupabaseQuery('offer_scope_products', {
        data: [
          ...mockScopeProducts,
          {
            id: 'sp-3',
            scope_id: 'scope-2',
            product_id: 'prod-3',
            variant_name: null,
            is_default: true,
            sort_order: 0,
            product: {
              id: 'prod-3',
              name: 'Ceramic Coat',
              short_name: 'CC',
              default_price: 300,
              price_from: null,
              price_small: null,
              price_medium: null,
              price_large: null,
              category_id: null,
              metadata: null,
            },
          },
        ],
        error: null,
      });

      const offer = createOffer({ selectedScopeIds: ['scope-1', 'scope-2'] });
      const onUpdate = vi.fn();

      renderHook(() => useSummaryServices(INSTANCE_ID, offer, false, onUpdate));

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalled();
      });

      const updates = onUpdate.mock.calls[0][0];
      // Different warranties → should include scope headers
      expect(updates.warranty).toContain('PPF');
      expect(updates.warranty).toContain('2 lata');
      expect(updates.warranty).toContain('Ceramic');
      expect(updates.warranty).toContain('1 rok');
    });
  });
});
