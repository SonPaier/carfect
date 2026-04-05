import { useState, useCallback, useEffect, useRef } from 'react';
import { addMonths, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizePhone } from '@shared/utils';
import { getLowestPrice } from '@/lib/offerUtils';
import type { Json } from '@/integrations/supabase/types';
import { defaultCustomerData, defaultVehicleData } from './useOfferTypes';
import type {
  ScopeProductWithJoin,
  CustomerData,
  VehicleData,
  OfferItem,
  OfferOption,
  DefaultSelectedState,
  OfferState,
} from './useOfferTypes';

// Re-export types for consumers that import from useOffer
export type { CustomerData, VehicleData, OfferItem, OfferOption, DefaultSelectedState, OfferState };

export const useOffer = (instanceId: string) => {
  // Default valid until: 1 month from now
  const defaultValidUntil = format(addMonths(new Date(), 1), 'yyyy-MM-dd');

  const [offer, setOffer] = useState<OfferState>({
    instanceId,
    customerData: defaultCustomerData,
    vehicleData: defaultVehicleData,
    selectedScopeIds: [],
    options: [],
    additions: [],
    vatRate: 23,
    hideUnitPrices: false,
    status: 'draft',
    validUntil: defaultValidUntil,
    paymentTerms: '',
    warranty: '',
    serviceInfo: '',
    notes: '',
    defaultSelectedState: undefined,
    offerFormat: null,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ref for latest offer state — used in saveOffer to avoid stale closures (#22)
  const offerRef = useRef(offer);
  offerRef.current = offer;

  // Mutex to prevent concurrent saves (#1)
  const saveInProgressRef = useRef(false);

  // Build options for given scopes (no state mutation)
  const buildOptionsFromScopes = useCallback(
    async (scopeIds: string[]): Promise<OfferOption[]> => {
      if (scopeIds.length === 0) return [];

      // Fetch scopes and products in parallel (#19)
      const [scopesResult, productsResult] = await Promise.all([
        supabase
          .from('offer_scopes')
          .select('*')
          .in('id', scopeIds)
          .eq('active', true)
          .order('sort_order'),
        supabase
          .from('offer_scope_products')
          .select(
            `
            id,
            scope_id,
            product_id,
            variant_name,
            is_default,
            sort_order,
            product:unified_services!product_id(id, name, default_price, price_from, price_small, price_medium, price_large, unit, description)
          `,
          )
          .in('scope_id', scopeIds)
          .order('sort_order'),
      ]);

      if (scopesResult.error) throw scopesResult.error;
      if (productsResult.error) throw productsResult.error;

      const scopes = scopesResult.data;
      const scopeProducts = productsResult.data;

      // Generate one option per scope containing all its DEFAULT products
      // (matches SummaryStepV2.buildDefaultSelected() expectations)
      const newOptions: OfferOption[] = [];
      let sortOrder = 0;

      // Sort scopes: extras last
      const sortedScopes = [...(scopes || [])].sort((a, b) => {
        if (a.is_extras_scope && !b.is_extras_scope) return 1;
        if (!a.is_extras_scope && b.is_extras_scope) return -1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      });

      for (const scope of sortedScopes) {
        const products = (scopeProducts || [])
          .filter((p) => p.scope_id === scope.id && p.is_default)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        const items: OfferItem[] = products.map((p) => {
          const product = (p as ScopeProductWithJoin).product as {
            id: string;
            name: string;
            default_price: number | null;
            price_from: number | null;
            price_small: number | null;
            price_medium: number | null;
            price_large: number | null;
            unit: string | null;
            description: string | null;
          } | null;

          return {
            id: crypto.randomUUID(),
            productId: p.product_id || undefined,
            customName: p.variant_name
              ? `${p.variant_name}\n${product?.name || ''}`
              : product?.name || '',
            customDescription: '',
            quantity: 1,
            unitPrice: getLowestPrice(product),
            unit: product?.unit || 'szt',
            discountPercent: 0,
            isOptional: false,
            isCustom: !p.product_id,
          };
        });

        newOptions.push({
          id: crypto.randomUUID(),
          name: scope.name,
          description: scope.description || '',
          items,
          isSelected: true,
          sortOrder,
          scopeId: scope.id,
          variantId: undefined,
          isUpsell: scope.is_extras_scope || false,
        });
        sortOrder++;
      }

      return newOptions;
    },
    [],
  );

  // Generate options from selected scopes (state mutation)
  const generateOptionsFromScopes = useCallback(
    async (scopeIds: string[]) => {
      if (scopeIds.length === 0) {
        setOffer((prev) => ({ ...prev, options: [] }));
        return;
      }

      try {
        const newOptions = await buildOptionsFromScopes(scopeIds);
        setOffer((prev) => ({ ...prev, options: newOptions }));
      } catch (error) {
        console.error('Error generating options from scopes:', error);
      }
    },
    [buildOptionsFromScopes],
  );

  // Customer data handlers
  const updateCustomerData = useCallback((data: Partial<CustomerData>) => {
    setOffer((prev) => ({
      ...prev,
      customerData: { ...prev.customerData, ...data },
    }));
  }, []);

  // Vehicle data handlers
  const updateVehicleData = useCallback((data: Partial<VehicleData>) => {
    setOffer((prev) => ({
      ...prev,
      vehicleData: { ...prev.vehicleData, ...data },
    }));
  }, []);

  // Scope handlers
  const updateSelectedScopes = useCallback(
    (scopeIds: string[]) => {
      if (offerRef.current.offerFormat === 'v2') return; // v2 nie używa scopów

      type ScopeUpdateAction =
        | { type: 'none' }
        | { type: 'replace' }
        | { type: 'append'; newScopeIds: string[] };

      // TS note: we compute the action inside setOffer(prev => ...) and read it afterwards.
      // Using a mutable holder avoids incorrect TS narrowing while keeping the functional update.
      const holder: { action: ScopeUpdateAction } = { action: { type: 'none' } };

      setOffer((prev) => {
        // Only update if actually changed to prevent loops
        if (JSON.stringify(prev.selectedScopeIds) === JSON.stringify(scopeIds)) {
          return prev;
        }

        // NEW OFFER: replace options from templates
        if (!prev.id) {
          holder.action = { type: 'replace' };
          return {
            ...prev,
            selectedScopeIds: scopeIds,
          };
        }

        // PERSISTED OFFER: preserve existing options/items/prices.
        // - Keep extras (Dodatki) regardless of step-2 selection
        // - Remove options for deselected NON-extras scopes
        // - Append options only for newly added scopes
        const nextOptions = prev.options.filter((opt) => {
          if (!opt.scopeId) return true;
          if (opt.isUpsell) return true;
          return scopeIds.includes(opt.scopeId);
        });

        const existingRegularScopeIds = new Set(
          nextOptions
            .filter((opt) => opt.scopeId && !opt.isUpsell)
            .map((opt) => opt.scopeId as string),
        );

        const newScopeIds = scopeIds.filter((id) => !existingRegularScopeIds.has(id));
        if (newScopeIds.length > 0) {
          holder.action = { type: 'append', newScopeIds };
        }

        return {
          ...prev,
          selectedScopeIds: scopeIds,
          options: nextOptions,
        };
      });

      const action = holder.action;

      if (action.type === 'replace') {
        void generateOptionsFromScopes(scopeIds);
        return;
      }

      if (action.type === 'append') {
        void (async () => {
          const builtOptions = await buildOptionsFromScopes(action.newScopeIds);

          setOffer((prev) => {
            const desiredScopeIds = new Set(prev.selectedScopeIds);
            const existingScopeIds = new Set(
              prev.options.filter((o) => o.scopeId).map((o) => o.scopeId as string),
            );

            const safeToAdd = builtOptions.filter((o) => {
              if (!o.scopeId) return true;
              if (!desiredScopeIds.has(o.scopeId)) return false; // selection changed while awaiting
              return !existingScopeIds.has(o.scopeId);
            });

            if (safeToAdd.length === 0) return prev;

            const merged = [...prev.options, ...safeToAdd].map((opt, idx) => ({
              ...opt,
              sortOrder: idx,
            }));

            return {
              ...prev,
              options: merged,
            };
          });
        })().catch((err) => {
          console.error('[updateSelectedScopes] Failed to append scopes:', err);
        });
      }
    },
    [buildOptionsFromScopes, generateOptionsFromScopes],
  );

  // Option handlers
  const addOption = useCallback((option: Omit<OfferOption, 'id' | 'sortOrder'>) => {
    const id = crypto.randomUUID();
    setOffer((prev) => ({
      ...prev,
      options: [...prev.options, { ...option, id, sortOrder: prev.options.length }],
    }));
    return id;
  }, []);

  const updateOption = useCallback((optionId: string, data: Partial<OfferOption>) => {
    setOffer((prev) => ({
      ...prev,
      options: prev.options.map((opt) => (opt.id === optionId ? { ...opt, ...data } : opt)),
    }));
  }, []);

  const removeOption = useCallback((optionId: string) => {
    setOffer((prev) => ({
      ...prev,
      options: prev.options
        .filter((opt) => opt.id !== optionId)
        .map((opt, idx) => ({ ...opt, sortOrder: idx })),
    }));
  }, []);

  const duplicateOption = useCallback((optionId: string) => {
    setOffer((prev) => {
      const option = prev.options.find((o) => o.id === optionId);
      if (!option) return prev;

      const newOption: OfferOption = {
        ...option,
        id: crypto.randomUUID(),
        name: `${option.name} (kopia)`,
        sortOrder: prev.options.length,
        items: option.items.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        })),
      };
      return { ...prev, options: [...prev.options, newOption] };
    });
  }, []);

  // Item handlers
  const addItemToOption = useCallback((optionId: string, item: Omit<OfferItem, 'id'>) => {
    const newItem: OfferItem = {
      ...item,
      id: crypto.randomUUID(),
    };
    setOffer((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === optionId ? { ...opt, items: [...opt.items, newItem] } : opt,
      ),
    }));
    return newItem.id;
  }, []);

  const updateItemInOption = useCallback(
    (optionId: string, itemId: string, data: Partial<OfferItem>) => {
      setOffer((prev) => ({
        ...prev,
        options: prev.options.map((opt) =>
          opt.id === optionId
            ? {
                ...opt,
                items: opt.items.map((item) => (item.id === itemId ? { ...item, ...data } : item)),
              }
            : opt,
        ),
      }));
    },
    [],
  );

  const removeItemFromOption = useCallback((optionId: string, itemId: string) => {
    setOffer((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === optionId
          ? { ...opt, items: opt.items.filter((item) => item.id !== itemId) }
          : opt,
      ),
    }));
  }, []);

  // Additions handlers
  const addAddition = useCallback((item: Omit<OfferItem, 'id'>) => {
    const newItem: OfferItem = {
      ...item,
      id: crypto.randomUUID(),
    };
    setOffer((prev) => ({
      ...prev,
      additions: [...prev.additions, newItem],
    }));
    return newItem.id;
  }, []);

  const updateAddition = useCallback((itemId: string, data: Partial<OfferItem>) => {
    setOffer((prev) => ({
      ...prev,
      additions: prev.additions.map((item) => (item.id === itemId ? { ...item, ...data } : item)),
    }));
  }, []);

  const removeAddition = useCallback((itemId: string) => {
    setOffer((prev) => ({
      ...prev,
      additions: prev.additions.filter((item) => item.id !== itemId),
    }));
  }, []);

  // General update
  const updateOffer = useCallback((data: Partial<OfferState>) => {
    setOffer((prev) => ({ ...prev, ...data }));
  }, []);

  // Calculations
  const calculateOptionTotal = useCallback((option: OfferOption) => {
    return option.items.reduce((sum, item) => {
      if (item.isOptional) return sum;
      const clampedDiscount = Math.min(Math.max(item.discountPercent, 0), 100);
      const itemTotal =
        Math.round(item.quantity * item.unitPrice * (1 - clampedDiscount / 100) * 100) / 100;
      return sum + itemTotal;
    }, 0);
  }, []);

  const calculateAdditionsTotal = useCallback(() => {
    return offer.additions.reduce((sum, item) => {
      if (item.isOptional) return sum;
      const clampedDiscount = Math.min(Math.max(item.discountPercent, 0), 100);
      const itemTotal =
        Math.round(item.quantity * item.unitPrice * (1 - clampedDiscount / 100) * 100) / 100;
      return sum + itemTotal;
    }, 0);
  }, [offer.additions]);

  const calculateTotalNet = useCallback(() => {
    const optionsTotal = offer.options
      .filter((opt) => opt.isSelected)
      .reduce((sum, opt) => sum + calculateOptionTotal(opt), 0);
    return optionsTotal + calculateAdditionsTotal();
  }, [offer.options, calculateOptionTotal, calculateAdditionsTotal]);

  const calculateTotalGross = useCallback(() => {
    const net = calculateTotalNet();
    return net * (1 + offer.vatRate / 100);
  }, [calculateTotalNet, offer.vatRate]);

  // Save offer to database
  // silent: if true, don't show success toast (used for auto-save)
  const saveOffer = useCallback(
    async (silent = false) => {
      // Prevent concurrent saves (#1)
      if (saveInProgressRef.current) return offerRef.current.id;
      saveInProgressRef.current = true;

      // Read latest offer state from ref (#22)
      const offer = offerRef.current;

      setSaving(true);
      try {
        // Generate offer number if new
        let offerNumber = '';
        if (!offer.id) {
          const { data: numberData, error: numberError } = await supabase.rpc(
            'generate_offer_number',
            { _instance_id: instanceId },
          );

          if (numberError) throw numberError;
          offerNumber = numberData;
        }

        const totalNet = calculateTotalNet();
        const totalGross = calculateTotalGross();

        // Build selected_state from defaultSelectedState if present (for admin pre-selection)
        const selectedStateToSave = offer.defaultSelectedState
          ? {
              selectedScopeId: offer.defaultSelectedState.selectedScopeId,
              selectedVariants: offer.defaultSelectedState.selectedVariants,
              selectedOptionalItems: offer.defaultSelectedState.selectedOptionalItems,
              selectedItemInOption: offer.defaultSelectedState.selectedItemInOption,
              selectedUpsells: {}, // Legacy field, derive from selectedOptionalItems
              isDefault: true, // Marker that this is admin's pre-selection, not customer's choice
            }
          : null;

        // Save main offer - cast to Json for Supabase
        const offerData: {
          instance_id: string;
          customer_data: Json;
          vehicle_data: Json;
          notes?: string;
          payment_terms?: string;
          warranty?: string;
          service_info?: string;
          internal_notes?: string | null;
          valid_until?: string;
          vat_rate: number;
          total_net: number;
          total_gross: number;
          status: string;
          hide_unit_prices: boolean;
          offer_number?: string;
          selected_state?: Json;
          has_unified_services?: boolean;
          offer_format?: string | null;
        } = {
          instance_id: instanceId,
          customer_data: offer.customerData as unknown as Json,
          vehicle_data: offer.vehicleData as unknown as Json,
          notes: offer.notes,
          payment_terms: offer.paymentTerms,
          warranty: offer.warranty,
          service_info: offer.serviceInfo,
          internal_notes: offer.internalNotes || null,
          valid_until: offer.validUntil,
          vat_rate: offer.vatRate,
          total_net: totalNet,
          total_gross: totalGross,
          status: offer.status,
          hide_unit_prices: offer.hideUnitPrices,
          ...(offerNumber && { offer_number: offerNumber }),
          ...(selectedStateToSave && { selected_state: selectedStateToSave as unknown as Json }),
          // New offers use unified services (service_type='both')
          ...(!offer.id && { has_unified_services: true }),
          offer_format: offer.offerFormat ?? null,
        };

        let offerId = offer.id;

        if (offer.id) {
          // Update existing
          const { error } = await supabase
            .from('offers')
            .update(offerData)
            .eq('id', offer.id)
            .eq('instance_id', instanceId);

          if (error) throw error;
        } else {
          // Insert new - offer_number is required
          const insertData = { ...offerData, offer_number: offerNumber };
          const { data, error } = await supabase
            .from('offers')
            .insert(insertData)
            .select('id')
            .single();

          if (error) throw error;
          offerId = data.id;
          setOffer((prev) => ({ ...prev, id: offerId }));
        }

        // Delete existing options and items (will re-insert)
        // Use offerId (not offer.id) to handle both new and existing offers consistently
        const { error: deleteError } = await supabase
          .from('offer_options')
          .delete()
          .eq('offer_id', offerId);

        if (deleteError) {
          console.error('Error deleting old options:', deleteError);
          throw deleteError;
        }

        // ===================== AUTO-REPAIR: Detect and fix stale IDs from duplication =====================
        // Check if any option IDs already exist in the database for a DIFFERENT offer
        const optionIdsToCheck = offer.options.map((o) => o.id);
        const itemIdsToCheck = offer.options.flatMap((o) => o.items.map((i) => i.id));

        const optionIdMap: Record<string, string> = {};
        const itemIdMap: Record<string, string> = {};
        let needsIdRegeneration = false;

        if (optionIdsToCheck.length > 0) {
          const { data: existingOptions } = await supabase
            .from('offer_options')
            .select('id, offer_id')
            .in('id', optionIdsToCheck);

          // If any option ID exists for a DIFFERENT offer, we need to regenerate
          const conflictingOptions = (existingOptions || []).filter((o) => o.offer_id !== offerId);
          if (conflictingOptions.length > 0) {
            needsIdRegeneration = true;
          }
        }

        // Prepare options and items with potentially regenerated IDs
        let processedOptions = offer.options;
        let processedAdditions = offer.additions;
        let processedDefaultSelectedState = offer.defaultSelectedState;

        if (needsIdRegeneration) {
          // Generate new IDs for all options and items
          processedOptions = offer.options.map((option) => {
            const newOptionId = crypto.randomUUID();
            optionIdMap[option.id] = newOptionId;

            return {
              ...option,
              id: newOptionId,
              items: option.items.map((item) => {
                const newItemId = crypto.randomUUID();
                itemIdMap[item.id] = newItemId;
                return { ...item, id: newItemId };
              }),
            };
          });

          // Regenerate additions IDs
          processedAdditions = offer.additions.map((item) => {
            const newItemId = crypto.randomUUID();
            itemIdMap[item.id] = newItemId;
            return { ...item, id: newItemId };
          });

          // Update defaultSelectedState with new IDs
          if (offer.defaultSelectedState) {
            const { selectedVariants, selectedOptionalItems, selectedItemInOption } =
              offer.defaultSelectedState;

            const newSelectedVariants: Record<string, string> = {};
            for (const [scopeId, oldOptionId] of Object.entries(selectedVariants || {})) {
              newSelectedVariants[scopeId] = optionIdMap[oldOptionId] || oldOptionId;
            }

            const newSelectedOptionalItems: Record<string, boolean> = {};
            for (const [oldItemId, value] of Object.entries(selectedOptionalItems || {})) {
              const newItemId = itemIdMap[oldItemId] || oldItemId;
              newSelectedOptionalItems[newItemId] = value;
            }

            const newSelectedItemInOption: Record<string, string> = {};
            for (const [oldOptionId, oldItemId] of Object.entries(selectedItemInOption || {})) {
              const newOptionId = optionIdMap[oldOptionId] || oldOptionId;
              const newItemId = itemIdMap[oldItemId] || oldItemId;
              newSelectedItemInOption[newOptionId] = newItemId;
            }

            processedDefaultSelectedState = {
              ...offer.defaultSelectedState,
              selectedVariants: newSelectedVariants,
              selectedOptionalItems: newSelectedOptionalItems,
              selectedItemInOption: newSelectedItemInOption,
            };
          }

          // Update local state with regenerated IDs
          setOffer((prev) => ({
            ...prev,
            options: processedOptions,
            additions: processedAdditions,
            defaultSelectedState: processedDefaultSelectedState,
          }));
        }
        // ===================== END AUTO-REPAIR =====================

        // Prepare all options for bulk insert
        const allOptionsData = processedOptions.map((option, idx) => ({
          id: option.id,
          offer_id: offerId,
          name: option.name,
          description: option.description,
          is_selected: option.isSelected,
          sort_order: option.sortOrder,
          subtotal_net: calculateOptionTotal(option),
          scope_id: option.scopeId || null,
          variant_id: option.variantId || null,
          is_upsell: option.isUpsell || false,
        }));

        // Add additions as a special option if present (generate new ID for additions)
        const additionsId = processedAdditions.length > 0 ? crypto.randomUUID() : null;
        if (processedAdditions.length > 0 && additionsId) {
          allOptionsData.push({
            id: additionsId,
            offer_id: offerId,
            name: 'Dodatki',
            description: '',
            is_selected: true,
            sort_order: processedOptions.length,
            subtotal_net: calculateAdditionsTotal(),
            scope_id: null,
            variant_id: null,
            is_upsell: false,
          });
        }

        // Bulk insert all options at once
        if (allOptionsData.length > 0) {
          const { error: optionsError } = await supabase
            .from('offer_options')
            .insert(allOptionsData);

          if (optionsError) throw optionsError;

          // FIX: Insert items WITH their existing IDs to prevent selected_state mismatch
          const allItemsData: Array<{
            id: string;
            option_id: string;
            product_id: string | null;
            custom_name: string | undefined;
            custom_description: string | undefined;
            quantity: number;
            unit_price: number;
            unit: string;
            discount_percent: number;
            is_optional: boolean;
            is_custom: boolean;
            sort_order: number;
          }> = [];

          // Add items from regular options - use processedOptions with potentially regenerated IDs
          processedOptions.forEach((option) => {
            if (option.items.length > 0) {
              option.items.forEach((item, itemIdx) => {
                allItemsData.push({
                  id: item.id,
                  option_id: option.id,
                  product_id: item.productId || null,
                  custom_name: item.customName,
                  custom_description: item.customDescription,
                  quantity: item.quantity,
                  unit_price: item.unitPrice,
                  unit: item.unit,
                  discount_percent: item.discountPercent,
                  is_optional: item.isOptional,
                  is_custom: item.isCustom,
                  sort_order: itemIdx,
                });
              });
            }
          });

          // Add items from additions (if present)
          if (processedAdditions.length > 0 && additionsId) {
            processedAdditions.forEach((item, idx) => {
              allItemsData.push({
                id: item.id,
                option_id: additionsId,
                product_id: item.productId || null,
                custom_name: item.customName,
                custom_description: item.customDescription,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                unit: item.unit,
                discount_percent: item.discountPercent,
                is_optional: item.isOptional,
                is_custom: item.isCustom,
                sort_order: idx,
              });
            });
          }

          // Bulk insert all items at once
          if (allItemsData.length > 0) {
            const { error: itemsError } = await supabase
              .from('offer_option_items')
              .insert(allItemsData);

            if (itemsError) throw itemsError;
          }
        }

        // Save customer to customers table (unified — no source filter)
        try {
          if (offer.customerData.name || offer.customerData.company) {
            const fullAddress = offer.customerData.companyAddress
              ? `${offer.customerData.companyAddress}${offer.customerData.companyPostalCode ? ', ' + offer.customerData.companyPostalCode : ''}${offer.customerData.companyCity ? ' ' + offer.customerData.companyCity : ''}`
              : null;

            // Try to find existing customer by phone within this instance (any source)
            let existingCustomerId: string | null = null;
            const normalizedPhone = offer.customerData.phone?.trim()
              ? normalizePhone(offer.customerData.phone)
              : null;

            if (normalizedPhone) {
              const { data: existingByPhone } = await supabase
                .from('customers')
                .select('id')
                .eq('instance_id', instanceId)
                .eq('phone', normalizedPhone)
                .maybeSingle();

              if (existingByPhone) {
                existingCustomerId = existingByPhone.id;
              }
            }

            // If not found by phone, try by email
            if (!existingCustomerId && offer.customerData.email) {
              const { data: existingByEmail } = await supabase
                .from('customers')
                .select('id')
                .eq('instance_id', instanceId)
                .eq('email', offer.customerData.email)
                .maybeSingle();

              if (existingByEmail) {
                existingCustomerId = existingByEmail.id;
              }
            }

            if (existingCustomerId) {
              // Update existing customer — only overwrite non-empty fields to avoid data loss (#2)
              const customerUpdate: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
              };
              const name = offer.customerData.name || offer.customerData.company;
              if (name) customerUpdate.name = name;
              if (offer.customerData.email) customerUpdate.email = offer.customerData.email;
              if (normalizedPhone) customerUpdate.phone = normalizedPhone;
              if (offer.customerData.company) customerUpdate.company = offer.customerData.company;
              if (offer.customerData.nip) customerUpdate.nip = offer.customerData.nip;
              if (fullAddress) customerUpdate.address = fullAddress;
              if (offer.customerData.companyAddress)
                customerUpdate.billing_street = offer.customerData.companyAddress;
              if (offer.customerData.companyPostalCode)
                customerUpdate.billing_postal_code = offer.customerData.companyPostalCode;
              if (offer.customerData.companyCity)
                customerUpdate.billing_city = offer.customerData.companyCity;

              await supabase
                .from('customers')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- billing columns missing from generated types
                .update(customerUpdate as any)
                .eq('id', existingCustomerId);
            } else {
              // Insert new customer
              const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                  instance_id: instanceId,
                  name: offer.customerData.name || offer.customerData.company || 'Nieznany',
                  phone: normalizedPhone,
                  email: offer.customerData.email || null,
                  company: offer.customerData.company || null,
                  nip: offer.customerData.nip || null,
                  address: fullAddress,
                  billing_street: offer.customerData.companyAddress || null,
                  billing_postal_code: offer.customerData.companyPostalCode || null,
                  billing_city: offer.customerData.companyCity || null,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- billing columns missing from generated types
                } as any)
                .select('id')
                .maybeSingle();

              if (customerError) {
                console.error('Error saving offer customer:', customerError);
              } else { /* customer saved successfully, no action needed */ }
            }
          }
        } catch (customerSaveError) {
          // Don't fail the whole offer save if customer save fails
          console.error('Error saving customer from offer:', customerSaveError);
        }

        // Save vehicle from offer to customer_vehicles (if brandModel and phone exist)
        try {
          const vehicleName = offer.vehicleData.brandModel?.trim();
          const customerPhone = offer.customerData.phone?.trim()
            ? normalizePhone(offer.customerData.phone)
            : null;

          if (vehicleName && customerPhone) {
            await supabase.rpc('upsert_customer_vehicle', {
              _instance_id: instanceId,
              _phone: customerPhone,
              _model: vehicleName,
              _plate: offer.vehicleData.plate?.trim() || undefined,
            });
          }
        } catch (vehicleSaveError) {
          console.error('Error saving vehicle from offer:', vehicleSaveError);
        }

        if (!silent) {
          toast.success('Oferta została zapisana');
        }
        return offerId;
      } catch (error) {
        console.error('Error saving offer:', error);
        toast.error('Błąd podczas zapisywania oferty');
        throw error;
      } finally {
        setSaving(false);
        saveInProgressRef.current = false;
      }
    },
    [
      instanceId,
      calculateTotalNet,
      calculateTotalGross,
      calculateOptionTotal,
      calculateAdditionsTotal,
    ],
  );

  // ── Local types for Supabase nested join in loadOffer ───────────────────
  interface LoadedOptionItem {
    id: string;
    product_id: string | null;
    custom_name: string | null;
    custom_description: string | null;
    quantity: number;
    unit_price: number;
    unit: string | null;
    discount_percent: number;
    is_optional: boolean;
    is_custom: boolean;
    sort_order: number;
  }

  interface LoadedOption {
    id: string;
    name: string;
    description: string | null;
    is_selected: boolean;
    sort_order: number;
    scope_id: string | null;
    variant_id: string | null;
    is_upsell: boolean;
    offer_option_items: LoadedOptionItem[] | null;
  }

  // Load offer from database
  // isDuplicate: if true, regenerates all option/item IDs to prevent primary key conflicts
  const loadOffer = useCallback(async (offerId: string, isDuplicate = false) => {
    setLoading(true);
    try {
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select(
          `
          *,
          offer_options (
            *,
            offer_option_items (*)
          )
        `,
        )
        .eq('id', offerId)
        .eq('instance_id', instanceId)
        .single();

      if (offerError) throw offerError;

      const allOptions = ((offerData.offer_options || []) as LoadedOption[]).sort(
        (a, b) => a.sort_order - b.sort_order,
      );

      // Separate additions from regular options
      // "Additions" option has name 'Dodatki' but NO scope_id - these are manually added items
      // Options with scope_id (even if named 'Dodatki') are service-based and should be loaded as regular options
      const additionsOption = allOptions.find(
        (opt) => opt.name === 'Dodatki' && !opt.scope_id,
      );
      const regularOptions = allOptions.filter(
        (opt) => !(opt.name === 'Dodatki' && !opt.scope_id),
      );

      // Build ID mappings for duplication
      const optionIdMap: Record<string, string> = {};
      const itemIdMap: Record<string, string> = {};

      const options: OfferOption[] = regularOptions.map((opt) => {
        const originalOptionId = opt.id;
        const newOptionId = isDuplicate ? crypto.randomUUID() : originalOptionId;

        if (isDuplicate) {
          optionIdMap[originalOptionId] = newOptionId;
        }

        return {
          id: newOptionId,
          name: opt.name,
          description: opt.description,
          isSelected: opt.is_selected,
          sortOrder: opt.sort_order,
          scopeId: opt.scope_id,
          variantId: opt.variant_id,
          isUpsell: opt.is_upsell,
          items: (opt.offer_option_items || [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => {
              const originalItemId = item.id;
              const newItemId = isDuplicate ? crypto.randomUUID() : originalItemId;

              if (isDuplicate) {
                itemIdMap[originalItemId] = newItemId;
              }

              return {
                id: newItemId,
                productId: item.product_id,
                customName: item.custom_name,
                customDescription: item.custom_description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unit_price),
                unit: item.unit,
                discountPercent: Number(item.discount_percent),
                isOptional: item.is_optional,
                isCustom: item.is_custom,
              };
            }),
        };
      });

      // Extract unique scope IDs from options
      const scopeIdsFromOptions = [
        ...new Set(options.filter((opt) => opt.scopeId).map((opt) => opt.scopeId as string)),
      ];

      const additions: OfferItem[] = additionsOption
        ? (additionsOption.offer_option_items || [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => {
              const originalItemId = item.id;
              const newItemId = isDuplicate ? crypto.randomUUID() : originalItemId;

              if (isDuplicate) {
                itemIdMap[originalItemId] = newItemId;
              }

              return {
                id: newItemId,
                productId: item.product_id,
                customName: item.custom_name,
                customDescription: item.custom_description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unit_price),
                unit: item.unit,
                discountPercent: Number(item.discount_percent),
                isOptional: item.is_optional,
                isCustom: item.is_custom,
              };
            })
        : [];

      // Handle legacy vehicle data format
      // Merge separate paint_color/paint_finish columns with vehicle_data JSONB
      const vehicleDataRaw = (offerData.vehicle_data || defaultVehicleData) as Record<
        string,
        string
      >;
      const vehicleData: VehicleData = {
        brandModel:
          vehicleDataRaw.brandModel ||
          [vehicleDataRaw.brand, vehicleDataRaw.model].filter(Boolean).join(' ') ||
          '',
        plate: vehicleDataRaw.plate || '',
        paintColor: vehicleDataRaw.paintColor || offerData.paint_color || '',
        paintType: vehicleDataRaw.paintType || offerData.paint_finish || '',
      };

      // Load widget selections for offer hydration in Step 3
      const widgetSelectedExtras = offerData.widget_selected_extras || [];
      const widgetDurationSelections = (offerData.widget_duration_selections || {}) as Record<
        string,
        number | null
      >;

      // Auto-generate inquiry content for website leads
      let generatedInquiryContent: string | undefined;
      const offerSource = offerData.source;
      const customerDataRaw = (offerData.customer_data || {}) as Record<string, string>;
      const existingInquiryContent = customerDataRaw.inquiryContent || '';

      if (offerSource === 'website' && !existingInquiryContent) {
        // Get all scope IDs from the offer (both from duration selections and from options)
        const durationScopeIds = Object.keys(widgetDurationSelections);
        const optionScopeIds = regularOptions
          .filter((opt: { scope_id?: string }) => opt.scope_id)
          .map((opt: { scope_id?: string }) => opt.scope_id as string);
        const allScopeIds = [...new Set([...durationScopeIds, ...optionScopeIds])];

        const scopeNamesMap: Record<string, string> = {};

        if (allScopeIds.length > 0) {
          const { data: scopesData } = await supabase
            .from('offer_scopes')
            .select('id, name, short_name, is_extras_scope')
            .in('id', allScopeIds);

          if (scopesData) {
            scopesData
              .filter((s) => !s.is_extras_scope) // Exclude extras scope from template list
              .forEach((s) => {
                scopeNamesMap[s.id] = s.short_name || s.name;
              });
          }
        }

        // Fetch service names for widget_selected_extras
        let extrasNames: string[] = [];
        if (widgetSelectedExtras.length > 0) {
          const { data: extrasData } = await supabase
            .from('unified_services')
            .select('id, name, short_name')
            .in('id', widgetSelectedExtras);

          if (extrasData) {
            extrasNames = extrasData.map((e) => e.short_name || e.name);
          }
        }

        // Helper to format duration in Polish
        const formatDuration = (months: number): string => {
          if (months < 12) {
            if (months === 1) return '1 miesiąc';
            if (months >= 2 && months <= 4) return `${months} miesiące`;
            return `${months} miesięcy`;
          }
          if (months % 12 !== 0) {
            const y = Math.floor(months / 12);
            const m = months % 12;
            const yearPart = y === 1 ? '1 rok' : y <= 4 ? `${y} lata` : `${y} lat`;
            return `${yearPart} ${m} mies.`;
          }
          const years = months / 12;
          if (years === 1) return '1 rok';
          if (years <= 4) return `${years} lata`;
          return `${years} lat`;
        };

        // Build inquiry content
        const parts: string[] = [];
        const customerName = customerDataRaw.name || 'Klient';
        parts.push(`Klient ${customerName} chce:`);

        // Add selected templates - use scopeNamesMap keys to get all templates
        for (const scopeId of Object.keys(scopeNamesMap)) {
          const scopeName = scopeNamesMap[scopeId];
          const months = widgetDurationSelections[scopeId];

          if (months !== undefined && months !== null && typeof months === 'number') {
            parts.push(`• ${scopeName} (${formatDuration(months)})`);
          } else if (scopeId in widgetDurationSelections && months === null) {
            // Customer explicitly chose "Nie wiem, proszę o propozycję"
            parts.push(`• ${scopeName} – Nie wiem, proszę o propozycję`);
          } else {
            parts.push(`• ${scopeName}`);
          }
        }

        // Add selected extras
        if (extrasNames.length > 0) {
          parts.push('');
          parts.push('Dodatki:');
          extrasNames.forEach((name) => {
            parts.push(`• ${name}`);
          });
        }

        // Add budget if provided
        const budgetSuggestion = offerData.budget_suggestion;
        if (budgetSuggestion) {
          parts.push('');
          parts.push(`Budżet: ${budgetSuggestion.toLocaleString('pl-PL')} zł`);
        }

        // Add customer notes if provided
        const inquiryNotes = offerData.inquiry_notes;
        if (inquiryNotes) {
          parts.push('');
          parts.push(`Notatki klienta: ${inquiryNotes}`);
        }

        generatedInquiryContent = parts.join('\n');
      }

      // Parse defaultSelectedState from selected_state if it has isDefault marker
      const loadedOptionIds = options.map((o: OfferOption) => o.id);
      const loadedItemIds = options.flatMap((o: OfferOption) =>
        o.items.map((i: OfferItem) => i.id),
      );

      const rawSelectedState = offerData.selected_state as unknown as
        | (DefaultSelectedState & { isDefault?: boolean })
        | null;
      let defaultSelectedState: DefaultSelectedState | undefined;

      if (rawSelectedState?.isDefault) {
        if (isDuplicate) {
          // Remap IDs in selected state for duplication
          const { selectedVariants, selectedOptionalItems, selectedItemInOption } =
            rawSelectedState;

          // Map selectedVariants values (optionIds) to new IDs
          const newSelectedVariants: Record<string, string> = {};
          for (const [scopeId, oldOptionId] of Object.entries(selectedVariants || {})) {
            newSelectedVariants[scopeId] =
              optionIdMap[oldOptionId as string] || (oldOptionId as string);
          }

          // Map selectedOptionalItems keys (itemIds) to new IDs
          const newSelectedOptionalItems: Record<string, boolean> = {};
          for (const [oldItemId, value] of Object.entries(selectedOptionalItems || {})) {
            const newItemId = itemIdMap[oldItemId] || oldItemId;
            newSelectedOptionalItems[newItemId] = value as boolean;
          }

          // Map selectedItemInOption keys (optionIds) and values (itemIds) to new IDs
          const newSelectedItemInOption: Record<string, string> = {};
          for (const [oldOptionId, oldItemId] of Object.entries(selectedItemInOption || {})) {
            const newOptionId = optionIdMap[oldOptionId] || oldOptionId;
            const newItemIdVal = itemIdMap[oldItemId as string] || (oldItemId as string);
            newSelectedItemInOption[newOptionId] = newItemIdVal;
          }

          defaultSelectedState = {
            selectedScopeId: rawSelectedState.selectedScopeId ?? null,
            selectedVariants: newSelectedVariants,
            selectedOptionalItems: newSelectedOptionalItems,
            selectedItemInOption: newSelectedItemInOption,
          };
        } else {
          defaultSelectedState = {
            selectedScopeId: rawSelectedState.selectedScopeId ?? null,
            selectedVariants: rawSelectedState.selectedVariants || {},
            selectedOptionalItems: rawSelectedState.selectedOptionalItems || {},
            selectedItemInOption: rawSelectedState.selectedItemInOption || {},
          };
        }

        // Consistency check (only log for non-duplicates to avoid noise)
      }

      // Merge generated inquiry content into customer data if available
      const finalCustomerData: CustomerData = {
        ...((offerData.customer_data || defaultCustomerData) as unknown as CustomerData),
        ...(generatedInquiryContent && { inquiryContent: generatedInquiryContent }),
      };

      setOffer({
        id: isDuplicate ? undefined : offerData.id, // Clear ID for duplicates
        instanceId: offerData.instance_id,
        customerData: finalCustomerData,
        vehicleData,
        selectedScopeIds: scopeIdsFromOptions,
        options,
        additions,
        notes: offerData.notes,
        paymentTerms: offerData.payment_terms,
        warranty: offerData.warranty || '',
        serviceInfo: offerData.service_info || '',
        internalNotes: offerData.internal_notes || '',
        validUntil: offerData.valid_until,
        vatRate: Number(offerData.vat_rate),
        hideUnitPrices: offerData.hide_unit_prices || false,
        status: isDuplicate ? 'draft' : (offerData.status as OfferState['status']), // Reset status for duplicates
        defaultSelectedState,
        widgetSelectedExtras,
        widgetDurationSelections,
        offerFormat: (offerData.offer_format as 'v1' | 'v2' | null) ?? null,
      });
    } catch (error) {
      console.error('Error loading offer:', error);
      toast.error('Błąd podczas wczytywania oferty');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  // Reset offer
  const resetOffer = useCallback(() => {
    setOffer({
      instanceId,
      customerData: defaultCustomerData,
      vehicleData: defaultVehicleData,
      selectedScopeIds: [],
      options: [],
      additions: [],
      vatRate: 23,
      hideUnitPrices: false,
      status: 'draft',
    });
  }, [instanceId]);

  return {
    offer,
    loading,
    saving,
    updateCustomerData,
    updateVehicleData,
    updateSelectedScopes,
    generateOptionsFromScopes,
    addOption,
    updateOption,
    removeOption,
    duplicateOption,
    addItemToOption,
    updateItemInOption,
    removeItemFromOption,
    addAddition,
    updateAddition,
    removeAddition,
    updateOffer,
    calculateOptionTotal,
    calculateAdditionsTotal,
    calculateTotalNet,
    calculateTotalGross,
    saveOffer,
    loadOffer,
    resetOffer,
  };
};
