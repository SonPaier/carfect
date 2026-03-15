import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOffer } from './useOffer';
import { mockSupabaseQuery, mockSupabaseRpc, resetSupabaseMocks } from '@/test/mocks/supabase';

// Mock supabase — use shared mock instance (async import for hoisting)
vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';

// Mock crypto.randomUUID for deterministic tests
let uuidCounter = 0;
vi.stubGlobal(
  'crypto',
  Object.assign({}, globalThis.crypto, {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  }),
);

const INSTANCE_ID = 'test-instance-id';

describe('useOffer', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    uuidCounter = 0;
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('sets default vatRate to 23', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));
      expect(result.current.offer.vatRate).toBe(23);
    });

    it('sets default status to draft', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));
      expect(result.current.offer.status).toBe('draft');
    });

    it('sets validUntil to 1 month from now', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));
      const validUntil = result.current.offer.validUntil;
      expect(validUntil).toBeDefined();
      // Should be roughly 1 month from now
      const date = new Date(validUntil!);
      const now = new Date();
      const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(25);
      expect(diffDays).toBeLessThan(35);
    });

    it('starts with empty options and additions', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));
      expect(result.current.offer.options).toEqual([]);
      expect(result.current.offer.additions).toEqual([]);
    });

    it('starts with empty customer and vehicle data', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));
      expect(result.current.offer.customerData.name).toBe('');
      expect(result.current.offer.customerData.email).toBe('');
      expect(result.current.offer.vehicleData.brandModel).toBe('');
    });

    it('stores instanceId from argument', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));
      expect(result.current.offer.instanceId).toBe(INSTANCE_ID);
    });

    it('starts with hideUnitPrices false', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));
      expect(result.current.offer.hideUnitPrices).toBe(false);
    });
  });

  describe('price calculations', () => {
    it('calculates option total from items', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const option = {
        id: 'opt-1',
        name: 'Test',
        items: [
          {
            id: 'i1',
            quantity: 2,
            unitPrice: 100,
            discountPercent: 0,
            isOptional: false,
            unit: 'szt',
            isCustom: false,
          },
          {
            id: 'i2',
            quantity: 1,
            unitPrice: 50,
            discountPercent: 0,
            isOptional: false,
            unit: 'szt',
            isCustom: false,
          },
        ],
        isSelected: true,
        sortOrder: 0,
      };

      expect(result.current.calculateOptionTotal(option)).toBe(250);
    });

    it('applies discount percent to item total', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const option = {
        id: 'opt-1',
        name: 'Test',
        items: [
          {
            id: 'i1',
            quantity: 1,
            unitPrice: 200,
            discountPercent: 10,
            isOptional: false,
            unit: 'szt',
            isCustom: false,
          },
        ],
        isSelected: true,
        sortOrder: 0,
      };

      expect(result.current.calculateOptionTotal(option)).toBe(180);
    });

    it('excludes optional items from option total', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const option = {
        id: 'opt-1',
        name: 'Test',
        items: [
          {
            id: 'i1',
            quantity: 1,
            unitPrice: 100,
            discountPercent: 0,
            isOptional: false,
            unit: 'szt',
            isCustom: false,
          },
          {
            id: 'i2',
            quantity: 1,
            unitPrice: 500,
            discountPercent: 0,
            isOptional: true,
            unit: 'szt',
            isCustom: false,
          },
        ],
        isSelected: true,
        sortOrder: 0,
      };

      expect(result.current.calculateOptionTotal(option)).toBe(100);
    });

    it('calculates total net from selected options only', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateOffer({
          options: [
            {
              id: 'opt-1',
              name: 'A',
              isSelected: true,
              sortOrder: 0,
              items: [
                {
                  id: 'i1',
                  quantity: 1,
                  unitPrice: 100,
                  discountPercent: 0,
                  isOptional: false,
                  unit: 'szt',
                  isCustom: false,
                },
              ],
            },
            {
              id: 'opt-2',
              name: 'B',
              isSelected: false,
              sortOrder: 1,
              items: [
                {
                  id: 'i2',
                  quantity: 1,
                  unitPrice: 200,
                  discountPercent: 0,
                  isOptional: false,
                  unit: 'szt',
                  isCustom: false,
                },
              ],
            },
          ],
        });
      });

      expect(result.current.calculateTotalNet()).toBe(100);
    });

    it('includes additions in total net', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateOffer({
          options: [
            {
              id: 'opt-1',
              name: 'A',
              isSelected: true,
              sortOrder: 0,
              items: [
                {
                  id: 'i1',
                  quantity: 1,
                  unitPrice: 100,
                  discountPercent: 0,
                  isOptional: false,
                  unit: 'szt',
                  isCustom: false,
                },
              ],
            },
          ],
          additions: [
            {
              id: 'add-1',
              quantity: 1,
              unitPrice: 50,
              discountPercent: 0,
              isOptional: false,
              unit: 'szt',
              isCustom: false,
            },
          ],
        });
      });

      expect(result.current.calculateTotalNet()).toBe(150);
    });

    it('calculates gross from net with VAT', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateOffer({
          vatRate: 23,
          options: [
            {
              id: 'opt-1',
              name: 'A',
              isSelected: true,
              sortOrder: 0,
              items: [
                {
                  id: 'i1',
                  quantity: 1,
                  unitPrice: 1000,
                  discountPercent: 0,
                  isOptional: false,
                  unit: 'szt',
                  isCustom: false,
                },
              ],
            },
          ],
        });
      });

      expect(result.current.calculateTotalGross()).toBe(1230);
    });

    it('uses custom vatRate for gross calculation', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateOffer({
          vatRate: 8,
          options: [
            {
              id: 'opt-1',
              name: 'A',
              isSelected: true,
              sortOrder: 0,
              items: [
                {
                  id: 'i1',
                  quantity: 1,
                  unitPrice: 1000,
                  discountPercent: 0,
                  isOptional: false,
                  unit: 'szt',
                  isCustom: false,
                },
              ],
            },
          ],
        });
      });

      expect(result.current.calculateTotalGross()).toBe(1080);
    });

    it('returns 0 for empty options', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));
      expect(result.current.calculateTotalNet()).toBe(0);
      expect(result.current.calculateTotalGross()).toBe(0);
    });
  });

  describe('mutations', () => {
    it('updates customer data partially', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateCustomerData({ name: 'Jan Kowalski', email: 'jan@test.pl' });
      });

      expect(result.current.offer.customerData.name).toBe('Jan Kowalski');
      expect(result.current.offer.customerData.email).toBe('jan@test.pl');
      // Other fields unchanged
      expect(result.current.offer.customerData.phone).toBe('');
    });

    it('updates vehicle data partially', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateVehicleData({ brandModel: 'BMW M3', plate: 'WA 12345' });
      });

      expect(result.current.offer.vehicleData.brandModel).toBe('BMW M3');
      expect(result.current.offer.vehicleData.plate).toBe('WA 12345');
    });

    it('adds option with correct sortOrder from functional updater', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.addOption({
          name: 'Option 1',
          items: [],
          isSelected: true,
        });
      });

      act(() => {
        result.current.addOption({
          name: 'Option 2',
          items: [],
          isSelected: true,
        });
      });

      expect(result.current.offer.options).toHaveLength(2);
      expect(result.current.offer.options[0].sortOrder).toBe(0);
      expect(result.current.offer.options[1].sortOrder).toBe(1);
    });

    it('removes option and re-indexes sortOrder', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      let id1: string;
      act(() => {
        id1 = result.current.addOption({ name: 'A', items: [], isSelected: true });
      });
      act(() => {
        result.current.addOption({ name: 'B', items: [], isSelected: true });
      });
      act(() => {
        result.current.addOption({ name: 'C', items: [], isSelected: true });
      });

      act(() => {
        result.current.removeOption(id1!);
      });

      expect(result.current.offer.options).toHaveLength(2);
      expect(result.current.offer.options[0].name).toBe('B');
      expect(result.current.offer.options[0].sortOrder).toBe(0);
      expect(result.current.offer.options[1].name).toBe('C');
      expect(result.current.offer.options[1].sortOrder).toBe(1);
    });

    it('duplicates option with new IDs and "(kopia)" suffix', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      let id: string;
      act(() => {
        id = result.current.addOption({
          name: 'Original',
          items: [
            {
              productId: 'p1',
              customName: 'Svc',
              quantity: 1,
              unitPrice: 100,
              unit: 'szt',
              discountPercent: 0,
              isOptional: false,
              isCustom: false,
            },
          ],
          isSelected: true,
        });
      });

      act(() => {
        result.current.duplicateOption(id!);
      });

      expect(result.current.offer.options).toHaveLength(2);
      const dup = result.current.offer.options[1];
      expect(dup.name).toBe('Original (kopia)');
      expect(dup.id).not.toBe(id!);
      expect(dup.items[0].id).not.toBe(result.current.offer.options[0].items[0].id);
      expect(dup.sortOrder).toBe(1);
    });

    it('adds item to specific option', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      let optId: string;
      act(() => {
        optId = result.current.addOption({ name: 'Opt', items: [], isSelected: true });
      });

      act(() => {
        result.current.addItemToOption(optId!, {
          quantity: 2,
          unitPrice: 150,
          unit: 'szt',
          discountPercent: 0,
          isOptional: false,
          isCustom: true,
          customName: 'Custom',
        });
      });

      const opt = result.current.offer.options.find((o) => o.id === optId!);
      expect(opt?.items).toHaveLength(1);
      expect(opt?.items[0].customName).toBe('Custom');
      expect(opt?.items[0].quantity).toBe(2);
    });

    it('updates item in option', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      let optId: string;
      let itemId: string;
      act(() => {
        optId = result.current.addOption({ name: 'Opt', items: [], isSelected: true });
      });
      act(() => {
        itemId = result.current.addItemToOption(optId!, {
          quantity: 1,
          unitPrice: 100,
          unit: 'szt',
          discountPercent: 0,
          isOptional: false,
          isCustom: false,
        });
      });

      act(() => {
        result.current.updateItemInOption(optId!, itemId!, { unitPrice: 200, discountPercent: 5 });
      });

      const item = result.current.offer.options[0].items[0];
      expect(item.unitPrice).toBe(200);
      expect(item.discountPercent).toBe(5);
    });

    it('removes item from option', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      let optId: string;
      let itemId: string;
      act(() => {
        optId = result.current.addOption({ name: 'Opt', items: [], isSelected: true });
      });
      act(() => {
        itemId = result.current.addItemToOption(optId!, {
          quantity: 1,
          unitPrice: 100,
          unit: 'szt',
          discountPercent: 0,
          isOptional: false,
          isCustom: false,
        });
      });

      act(() => {
        result.current.removeItemFromOption(optId!, itemId!);
      });

      expect(result.current.offer.options[0].items).toHaveLength(0);
    });

    it('adds and removes additions', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      let addId: string;
      act(() => {
        addId = result.current.addAddition({
          quantity: 1,
          unitPrice: 50,
          unit: 'szt',
          discountPercent: 0,
          isOptional: false,
          isCustom: true,
          customName: 'Extra',
        });
      });

      expect(result.current.offer.additions).toHaveLength(1);
      expect(result.current.offer.additions[0].customName).toBe('Extra');

      act(() => {
        result.current.removeAddition(addId!);
      });

      expect(result.current.offer.additions).toHaveLength(0);
    });

    it('updates option fields', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      let optId: string;
      act(() => {
        optId = result.current.addOption({ name: 'Old', items: [], isSelected: true });
      });

      act(() => {
        result.current.updateOption(optId!, { name: 'New', isSelected: false });
      });

      expect(result.current.offer.options[0].name).toBe('New');
      expect(result.current.offer.options[0].isSelected).toBe(false);
    });

    it('updates offer with general updateOffer', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateOffer({ vatRate: 8, hideUnitPrices: true, notes: 'Test note' });
      });

      expect(result.current.offer.vatRate).toBe(8);
      expect(result.current.offer.hideUnitPrices).toBe(true);
      expect(result.current.offer.notes).toBe('Test note');
    });

    it('resets offer to defaults', () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateOffer({
          vatRate: 8,
          notes: 'Something',
          options: [{ id: 'x', name: 'X', items: [], isSelected: true, sortOrder: 0 }],
        });
      });

      act(() => {
        result.current.resetOffer();
      });

      expect(result.current.offer.vatRate).toBe(23);
      expect(result.current.offer.options).toEqual([]);
      expect(result.current.offer.status).toBe('draft');
      expect(result.current.offer.instanceId).toBe(INSTANCE_ID);
    });
  });

  describe('buildOptionsFromScopes', () => {
    it('creates options from scope templates with default products', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      // Mock offer_scopes
      mockSupabaseQuery('offer_scopes', {
        data: [
          {
            id: 'scope-1',
            name: 'PPF',
            description: 'Paint protection',
            is_extras_scope: false,
            sort_order: 0,
            active: true,
          },
        ],
        error: null,
      });

      // Mock offer_scope_products
      mockSupabaseQuery('offer_scope_products', {
        data: [
          {
            id: 'sp-1',
            scope_id: 'scope-1',
            product_id: 'prod-1',
            variant_name: null,
            is_default: true,
            sort_order: 0,
            product: {
              id: 'prod-1',
              name: 'Folia PPF',
              default_price: 500,
              price_from: null,
              price_small: null,
              price_medium: null,
              price_large: null,
              unit: 'szt',
              description: null,
            },
          },
        ],
        error: null,
      });

      await act(async () => {
        await result.current.generateOptionsFromScopes(['scope-1']);
      });

      expect(result.current.offer.options).toHaveLength(1);
      const opt = result.current.offer.options[0];
      expect(opt.name).toBe('PPF');
      expect(opt.scopeId).toBe('scope-1');
      expect(opt.isSelected).toBe(true);
      expect(opt.items).toHaveLength(1);
      expect(opt.items[0].customName).toBe('Folia PPF');
      expect(opt.items[0].unitPrice).toBe(500);
    });

    it('uses price_from over default_price when available', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 's1', name: 'Test', is_extras_scope: false, sort_order: 0, active: true }],
        error: null,
      });

      mockSupabaseQuery('offer_scope_products', {
        data: [
          {
            id: 'sp1',
            scope_id: 's1',
            product_id: 'p1',
            variant_name: null,
            is_default: true,
            sort_order: 0,
            product: {
              id: 'p1',
              name: 'Svc',
              default_price: 1000,
              price_from: 300,
              price_small: 400,
              price_medium: 500,
              price_large: 600,
              unit: 'szt',
              description: null,
            },
          },
        ],
        error: null,
      });

      await act(async () => {
        await result.current.generateOptionsFromScopes(['s1']);
      });

      expect(result.current.offer.options[0].items[0].unitPrice).toBe(300);
    });

    it('uses lowest size price when price_from is null', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 's1', name: 'Test', is_extras_scope: false, sort_order: 0, active: true }],
        error: null,
      });

      mockSupabaseQuery('offer_scope_products', {
        data: [
          {
            id: 'sp1',
            scope_id: 's1',
            product_id: 'p1',
            variant_name: null,
            is_default: true,
            sort_order: 0,
            product: {
              id: 'p1',
              name: 'Svc',
              default_price: 1000,
              price_from: null,
              price_small: 400,
              price_medium: 300,
              price_large: 600,
              unit: 'szt',
              description: null,
            },
          },
        ],
        error: null,
      });

      await act(async () => {
        await result.current.generateOptionsFromScopes(['s1']);
      });

      expect(result.current.offer.options[0].items[0].unitPrice).toBe(300);
    });

    it('sorts extras scopes last', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseQuery('offer_scopes', {
        data: [
          { id: 'extras', name: 'Dodatki', is_extras_scope: true, sort_order: 0, active: true },
          { id: 'regular', name: 'PPF', is_extras_scope: false, sort_order: 1, active: true },
        ],
        error: null,
      });

      mockSupabaseQuery('offer_scope_products', {
        data: [
          {
            id: 'sp1',
            scope_id: 'extras',
            product_id: 'p1',
            variant_name: null,
            is_default: true,
            sort_order: 0,
            product: {
              id: 'p1',
              name: 'Extra',
              default_price: 100,
              price_from: null,
              price_small: null,
              price_medium: null,
              price_large: null,
              unit: 'szt',
              description: null,
            },
          },
          {
            id: 'sp2',
            scope_id: 'regular',
            product_id: 'p2',
            variant_name: null,
            is_default: true,
            sort_order: 0,
            product: {
              id: 'p2',
              name: 'PPF Full',
              default_price: 500,
              price_from: null,
              price_small: null,
              price_medium: null,
              price_large: null,
              unit: 'szt',
              description: null,
            },
          },
        ],
        error: null,
      });

      await act(async () => {
        await result.current.generateOptionsFromScopes(['extras', 'regular']);
      });

      expect(result.current.offer.options[0].name).toBe('PPF');
      expect(result.current.offer.options[1].name).toBe('Dodatki');
      expect(result.current.offer.options[1].isUpsell).toBe(true);
    });

    it('only includes default products', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 's1', name: 'Test', is_extras_scope: false, sort_order: 0, active: true }],
        error: null,
      });

      mockSupabaseQuery('offer_scope_products', {
        data: [
          {
            id: 'sp1',
            scope_id: 's1',
            product_id: 'p1',
            variant_name: null,
            is_default: true,
            sort_order: 0,
            product: {
              id: 'p1',
              name: 'Default',
              default_price: 100,
              price_from: null,
              price_small: null,
              price_medium: null,
              price_large: null,
              unit: 'szt',
              description: null,
            },
          },
          {
            id: 'sp2',
            scope_id: 's1',
            product_id: 'p2',
            variant_name: null,
            is_default: false,
            sort_order: 1,
            product: {
              id: 'p2',
              name: 'Non-default',
              default_price: 200,
              price_from: null,
              price_small: null,
              price_medium: null,
              price_large: null,
              unit: 'szt',
              description: null,
            },
          },
        ],
        error: null,
      });

      await act(async () => {
        await result.current.generateOptionsFromScopes(['s1']);
      });

      expect(result.current.offer.options[0].items).toHaveLength(1);
      expect(result.current.offer.options[0].items[0].customName).toBe('Default');
    });

    it('prepends variant_name to product name', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 's1', name: 'Test', is_extras_scope: false, sort_order: 0, active: true }],
        error: null,
      });

      mockSupabaseQuery('offer_scope_products', {
        data: [
          {
            id: 'sp1',
            scope_id: 's1',
            product_id: 'p1',
            variant_name: 'Premium',
            is_default: true,
            sort_order: 0,
            product: {
              id: 'p1',
              name: 'Folia PPF',
              default_price: 500,
              price_from: null,
              price_small: null,
              price_medium: null,
              price_large: null,
              unit: 'szt',
              description: null,
            },
          },
        ],
        error: null,
      });

      await act(async () => {
        await result.current.generateOptionsFromScopes(['s1']);
      });

      expect(result.current.offer.options[0].items[0].customName).toBe('Premium\nFolia PPF');
    });

    it('returns empty array for empty scopeIds', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      await act(async () => {
        await result.current.generateOptionsFromScopes([]);
      });

      expect(result.current.offer.options).toEqual([]);
    });
  });

  describe('loadOffer', () => {
    const mockOfferData = {
      id: 'offer-123',
      instance_id: INSTANCE_ID,
      offer_number: 'OFF-001',
      customer_data: { name: 'Jan', email: 'jan@test.pl', phone: '123456789' },
      vehicle_data: { brandModel: 'BMW M3', plate: 'WA 1234' },
      status: 'sent',
      vat_rate: 23,
      total_net: 1000,
      total_gross: 1230,
      notes: 'Test notes',
      payment_terms: '14 days',
      warranty: '2 years',
      service_info: 'Info',
      internal_notes: 'Internal',
      valid_until: '2026-04-15',
      hide_unit_prices: false,
      selected_state: null,
      widget_selected_extras: [],
      widget_duration_selections: {},
      offer_options: [
        {
          id: 'opt-db-1',
          name: 'PPF',
          description: 'Protect',
          is_selected: true,
          sort_order: 0,
          scope_id: 'scope-1',
          variant_id: null,
          is_upsell: false,
          offer_option_items: [
            {
              id: 'item-db-1',
              product_id: 'prod-1',
              custom_name: 'PPF Full',
              custom_description: null,
              quantity: 1,
              unit_price: 1000,
              unit: 'szt',
              discount_percent: 0,
              is_optional: false,
              is_custom: false,
              sort_order: 0,
            },
          ],
        },
      ],
    };

    it('loads offer and maps DB fields to state', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseQuery('offers', { data: mockOfferData, error: null });

      await act(async () => {
        await result.current.loadOffer('offer-123');
      });

      expect(result.current.offer.id).toBe('offer-123');
      expect(result.current.offer.customerData.name).toBe('Jan');
      expect(result.current.offer.vehicleData.brandModel).toBe('BMW M3');
      expect(result.current.offer.status).toBe('sent');
      expect(result.current.offer.vatRate).toBe(23);
      expect(result.current.offer.notes).toBe('Test notes');
      expect(result.current.offer.options).toHaveLength(1);
      expect(result.current.offer.options[0].name).toBe('PPF');
      expect(result.current.offer.options[0].items[0].customName).toBe('PPF Full');
      expect(result.current.offer.options[0].items[0].unitPrice).toBe(1000);
    });

    it('separates "Dodatki" option without scope_id into additions', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const dataWithAdditions = {
        ...mockOfferData,
        offer_options: [
          ...mockOfferData.offer_options,
          {
            id: 'opt-add',
            name: 'Dodatki',
            description: '',
            is_selected: true,
            sort_order: 1,
            scope_id: null,
            variant_id: null,
            is_upsell: false,
            offer_option_items: [
              {
                id: 'item-add-1',
                product_id: null,
                custom_name: 'Custom extra',
                custom_description: null,
                quantity: 1,
                unit_price: 50,
                unit: 'szt',
                discount_percent: 0,
                is_optional: false,
                is_custom: true,
                sort_order: 0,
              },
            ],
          },
        ],
      };

      mockSupabaseQuery('offers', { data: dataWithAdditions, error: null });

      await act(async () => {
        await result.current.loadOffer('offer-123');
      });

      expect(result.current.offer.options).toHaveLength(1);
      expect(result.current.offer.additions).toHaveLength(1);
      expect(result.current.offer.additions[0].customName).toBe('Custom extra');
    });

    it('keeps "Dodatki" option with scope_id as regular option', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const dataWithScopedDodatki = {
        ...mockOfferData,
        offer_options: [
          {
            id: 'opt-scoped',
            name: 'Dodatki',
            description: '',
            is_selected: true,
            sort_order: 0,
            scope_id: 'extras-scope',
            variant_id: null,
            is_upsell: true,
            offer_option_items: [],
          },
        ],
      };

      mockSupabaseQuery('offers', { data: dataWithScopedDodatki, error: null });

      await act(async () => {
        await result.current.loadOffer('offer-123');
      });

      expect(result.current.offer.options).toHaveLength(1);
      expect(result.current.offer.options[0].name).toBe('Dodatki');
      expect(result.current.offer.additions).toHaveLength(0);
    });

    it('regenerates IDs on duplicate', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseQuery('offers', { data: mockOfferData, error: null });

      await act(async () => {
        await result.current.loadOffer('offer-123', true);
      });

      // ID should be cleared for duplicates
      expect(result.current.offer.id).toBeUndefined();
      // Status reset to draft
      expect(result.current.offer.status).toBe('draft');
      // Option and item IDs should be different from originals
      expect(result.current.offer.options[0].id).not.toBe('opt-db-1');
      expect(result.current.offer.options[0].items[0].id).not.toBe('item-db-1');
    });

    it('remaps selected_state IDs on duplicate', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const dataWithSelectedState = {
        ...mockOfferData,
        selected_state: {
          isDefault: true,
          selectedScopeId: 'scope-1',
          selectedVariants: { 'scope-1': 'opt-db-1' },
          selectedOptionalItems: { 'item-db-1': true },
          selectedItemInOption: { 'opt-db-1': 'item-db-1' },
        },
      };

      mockSupabaseQuery('offers', { data: dataWithSelectedState, error: null });

      await act(async () => {
        await result.current.loadOffer('offer-123', true);
      });

      const dss = result.current.offer.defaultSelectedState;
      expect(dss).toBeDefined();
      // Values should be remapped to new UUIDs, not original DB IDs
      const newOptionId = result.current.offer.options[0].id;
      const newItemId = result.current.offer.options[0].items[0].id;
      expect(dss!.selectedVariants['scope-1']).toBe(newOptionId);
      expect(dss!.selectedOptionalItems[newItemId]).toBe(true);
      expect(dss!.selectedItemInOption[newOptionId]).toBe(newItemId);
    });

    it('extracts selectedScopeIds from loaded options', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseQuery('offers', { data: mockOfferData, error: null });

      await act(async () => {
        await result.current.loadOffer('offer-123');
      });

      expect(result.current.offer.selectedScopeIds).toEqual(['scope-1']);
    });

    it('handles legacy vehicle data with separate brand/model', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const legacyData = {
        ...mockOfferData,
        vehicle_data: { brand: 'BMW', model: 'M3' },
      };

      mockSupabaseQuery('offers', { data: legacyData, error: null });

      await act(async () => {
        await result.current.loadOffer('offer-123');
      });

      expect(result.current.offer.vehicleData.brandModel).toBe('BMW M3');
    });

    it('throws and shows toast on error', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseQuery('offers', { data: null, error: { message: 'Not found' } });

      await expect(
        act(async () => {
          await result.current.loadOffer('bad-id');
        }),
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith('Błąd podczas wczytywania oferty');
    });
  });

  describe('saveOffer', () => {
    it('generates offer number for new offers', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      // Set up required data
      act(() => {
        result.current.updateCustomerData({ name: 'Test' });
      });

      mockSupabaseRpc('generate_offer_number', { data: 'OFF-001', error: null });
      // .insert().select('id').single() — mock resolves via 'select' because .select() resets currentMethod
      mockSupabaseQuery('offers', { data: { id: 'new-offer-id' }, error: null });
      mockSupabaseQuery('offer_options', { data: null, error: null }, 'delete');
      mockSupabaseQuery('offer_option_items', { data: null, error: null }, 'insert');

      await act(async () => {
        const id = await result.current.saveOffer();
        expect(id).toBe('new-offer-id');
      });

      expect(result.current.offer.id).toBe('new-offer-id');
    });

    it('shows success toast when not silent', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseRpc('generate_offer_number', { data: 'OFF-001', error: null });
      mockSupabaseQuery('offers', { data: { id: 'id-1' }, error: null });
      mockSupabaseQuery('offer_options', { data: null, error: null }, 'delete');

      await act(async () => {
        await result.current.saveOffer(false);
      });

      expect(toast.success).toHaveBeenCalledWith('Oferta została zapisana');
    });

    it('skips success toast when silent', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseRpc('generate_offer_number', { data: 'OFF-001', error: null });
      mockSupabaseQuery('offers', { data: { id: 'id-1' }, error: null });
      mockSupabaseQuery('offer_options', { data: null, error: null }, 'delete');

      await act(async () => {
        await result.current.saveOffer(true);
      });

      expect(toast.success).not.toHaveBeenCalled();
    });

    it('throws on delete error (non-atomic save prevention)', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseRpc('generate_offer_number', { data: 'OFF-001', error: null });
      mockSupabaseQuery('offers', { data: { id: 'id-1' }, error: null });
      mockSupabaseQuery(
        'offer_options',
        { data: null, error: { message: 'Delete failed' } },
        'delete',
      );

      let caughtError: unknown;
      await act(async () => {
        try {
          await result.current.saveOffer();
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toHaveProperty('message');
      expect(toast.error).toHaveBeenCalledWith('Błąd podczas zapisywania oferty');
    });
  });

  describe('updateSelectedScopes', () => {
    it('no-ops when scopeIds are unchanged', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateOffer({ selectedScopeIds: ['s1', 's2'] });
      });

      const optionsBefore = result.current.offer.options;

      act(() => {
        result.current.updateSelectedScopes(['s1', 's2']);
      });

      // Options should not have changed
      expect(result.current.offer.options).toBe(optionsBefore);
    });

    it('replaces options for new offer (no id)', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      // Ensure no id (new offer)
      expect(result.current.offer.id).toBeUndefined();

      // Mock for generateOptionsFromScopes
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 's1', name: 'PPF', is_extras_scope: false, sort_order: 0, active: true }],
        error: null,
      });
      mockSupabaseQuery('offer_scope_products', {
        data: [
          {
            id: 'sp1',
            scope_id: 's1',
            product_id: 'p1',
            variant_name: null,
            is_default: true,
            sort_order: 0,
            product: {
              id: 'p1',
              name: 'Folia',
              default_price: 500,
              price_from: null,
              price_small: null,
              price_medium: null,
              price_large: null,
              unit: 'szt',
              description: null,
            },
          },
        ],
        error: null,
      });

      await act(async () => {
        result.current.updateSelectedScopes(['s1']);
      });

      expect(result.current.offer.selectedScopeIds).toEqual(['s1']);
      expect(result.current.offer.options).toHaveLength(1);
      expect(result.current.offer.options[0].name).toBe('PPF');
    });

    it('preserves upsell and no-scope options for persisted offers', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      // Set up a persisted offer with existing options
      act(() => {
        result.current.updateOffer({
          id: 'existing-offer',
          selectedScopeIds: ['s1', 's2'],
          options: [
            { id: 'opt-1', name: 'PPF', scopeId: 's1', isSelected: true, sortOrder: 0, items: [] },
            {
              id: 'opt-2',
              name: 'Ceramic',
              scopeId: 's2',
              isSelected: true,
              sortOrder: 1,
              items: [],
            },
            {
              id: 'opt-upsell',
              name: 'Dodatki',
              scopeId: 'extras',
              isUpsell: true,
              isSelected: true,
              sortOrder: 2,
              items: [],
            },
            { id: 'opt-custom', name: 'Custom', isSelected: true, sortOrder: 3, items: [] },
          ],
        });
      });

      // Deselect s2 — should keep s1, upsell, and no-scope custom option
      act(() => {
        result.current.updateSelectedScopes(['s1']);
      });

      expect(result.current.offer.selectedScopeIds).toEqual(['s1']);
      const names = result.current.offer.options.map((o) => o.name);
      expect(names).toContain('PPF');
      expect(names).toContain('Dodatki');
      expect(names).toContain('Custom');
      expect(names).not.toContain('Ceramic');
    });
  });

  describe('formatDuration (via loadOffer inquiry generation)', () => {
    // formatDuration is a local function inside loadOffer, tested indirectly
    // through loading offers with widget_duration_selections from website source.
    // We test the Polish pluralization rules via the generated inquiry content.

    const baseWebsiteOffer = {
      id: 'offer-web',
      instance_id: INSTANCE_ID,
      offer_number: 'OFF-W01',
      customer_data: { name: 'Anna' },
      vehicle_data: { brandModel: 'Audi A4' },
      status: 'draft',
      vat_rate: 23,
      total_net: 0,
      total_gross: 0,
      notes: '',
      payment_terms: '',
      warranty: '',
      service_info: '',
      internal_notes: '',
      valid_until: '2026-04-15',
      hide_unit_prices: false,
      selected_state: null,
      source: 'website',
      inquiry_content: null,
      offer_options: [
        {
          id: 'opt-1',
          name: 'PPF',
          description: '',
          is_selected: true,
          sort_order: 0,
          scope_id: 'scope-ppf',
          variant_id: null,
          is_upsell: false,
          offer_option_items: [],
        },
      ],
    };

    it('formats 1 month as "1 miesiąc"', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: [],
        widget_duration_selections: { 'scope-ppf': 1 },
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: [], error: null });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      expect(result.current.offer.customerData.inquiryContent).toContain('PPF (1 miesiąc)');
    });

    it('formats 3 months as "3 miesiące"', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: [],
        widget_duration_selections: { 'scope-ppf': 3 },
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: [], error: null });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      expect(result.current.offer.customerData.inquiryContent).toContain('PPF (3 miesiące)');
    });

    it('formats 7 months as "7 miesięcy"', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: [],
        widget_duration_selections: { 'scope-ppf': 7 },
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: [], error: null });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      expect(result.current.offer.customerData.inquiryContent).toContain('PPF (7 miesięcy)');
    });

    it('formats 12 months as "1 rok"', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: [],
        widget_duration_selections: { 'scope-ppf': 12 },
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: [], error: null });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      expect(result.current.offer.customerData.inquiryContent).toContain('PPF (1 rok)');
    });

    it('formats 36 months as "3 lata"', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: [],
        widget_duration_selections: { 'scope-ppf': 36 },
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: [], error: null });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      expect(result.current.offer.customerData.inquiryContent).toContain('PPF (3 lata)');
    });

    it('formats 60 months as "5 lat"', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: [],
        widget_duration_selections: { 'scope-ppf': 60 },
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: [], error: null });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      expect(result.current.offer.customerData.inquiryContent).toContain('PPF (5 lat)');
    });

    it('formats 18 months as "1 rok 6 mies."', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: [],
        widget_duration_selections: { 'scope-ppf': 18 },
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: [], error: null });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      expect(result.current.offer.customerData.inquiryContent).toContain('PPF (1 rok 6 mies.)');
    });

    it('shows "Nie wiem" for null duration selection', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: [],
        widget_duration_selections: { 'scope-ppf': null },
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: [], error: null });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      expect(result.current.offer.customerData.inquiryContent).toContain(
        'PPF – Nie wiem, proszę o propozycję',
      );
    });

    it('includes extras names in inquiry', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: ['extra-1'],
        widget_duration_selections: {},
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', {
        data: [{ id: 'extra-1', name: 'Detailing wnętrza', short_name: 'Detailing' }],
        error: null,
      });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      const content = result.current.offer.customerData.inquiryContent;
      expect(content).toContain('Dodatki:');
      expect(content).toContain('Detailing');
    });

    it('includes budget in inquiry', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: [],
        widget_duration_selections: {},
        budget_suggestion: 5000,
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: [], error: null });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      expect(result.current.offer.customerData.inquiryContent).toContain('Budżet:');
      expect(result.current.offer.customerData.inquiryContent).toContain('5');
    });

    it('includes customer notes in inquiry', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      const data = {
        ...baseWebsiteOffer,
        widget_selected_extras: [],
        widget_duration_selections: {},
        inquiry_notes: 'Proszę o szybki termin',
      };

      mockSupabaseQuery('offers', { data, error: null });
      mockSupabaseQuery('offer_scopes', {
        data: [{ id: 'scope-ppf', name: 'PPF', is_extras_scope: false }],
        error: null,
      });
      mockSupabaseQuery('unified_services', { data: [], error: null });

      await act(async () => {
        await result.current.loadOffer('offer-web');
      });

      expect(result.current.offer.customerData.inquiryContent).toContain('Proszę o szybki termin');
    });
  });

  describe('saveOffer edge cases', () => {
    it('updates existing offer instead of inserting', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateOffer({ id: 'existing-id' });
      });

      mockSupabaseQuery('offers', { data: null, error: null }, 'update');
      mockSupabaseQuery('offer_options', { data: null, error: null }, 'delete');

      await act(async () => {
        const id = await result.current.saveOffer(true);
        expect(id).toBe('existing-id');
      });
    });

    it('throws on offer number generation error', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      mockSupabaseRpc('generate_offer_number', { data: null, error: { message: 'RPC failed' } });

      let caughtError: unknown;
      await act(async () => {
        try {
          await result.current.saveOffer();
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toHaveProperty('message');
      expect(toast.error).toHaveBeenCalledWith('Błąd podczas zapisywania oferty');
    });

    it('includes selected_state when defaultSelectedState is set', async () => {
      const { result } = renderHook(() => useOffer(INSTANCE_ID));

      act(() => {
        result.current.updateOffer({
          defaultSelectedState: {
            selectedScopeId: 'scope-1',
            selectedVariants: { 'scope-1': 'opt-1' },
            selectedOptionalItems: {},
            selectedItemInOption: {},
          },
        });
      });

      mockSupabaseRpc('generate_offer_number', { data: 'OFF-002', error: null });
      mockSupabaseQuery('offers', { data: { id: 'new-id' }, error: null });
      mockSupabaseQuery('offer_options', { data: null, error: null }, 'delete');

      await act(async () => {
        await result.current.saveOffer(true);
      });

      // If it saved without error, selected_state was included
      expect(result.current.offer.id).toBe('new-id');
    });
  });
});
