import { useState, useEffect, useCallback, useRef } from 'react';
import { getLowestPrice } from '@/lib/offerUtils';
import { supabase } from '@/integrations/supabase/client';
import type { OfferState } from '@/hooks/useOffer';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface ProductPricing {
  id: string;
  name: string;
  short_name: string | null;
  default_price: number | null;
  price_from: number | null;
  price_small: number | null;
  price_medium: number | null;
  price_large: number | null;
  category: string | null;
  metadata?: { trwalosc_produktu_w_mesiacach?: number } | null;
}

export interface ScopeProduct {
  id: string;
  product_id: string;
  variant_name: string | null;
  is_default: boolean;
  product: ProductPricing | null;
  durabilityMonths?: number | null;
}

export interface SelectedProduct {
  id: string;
  scopeProductId: string;
  productId: string;
  variantName: string | null;
  productName: string;
  productShortName: string | null;
  price: number;
  isDefault: boolean;
  isPreselected: boolean;
}

export interface ServiceState {
  scopeId: string;
  name: string;
  shortName: string | null;
  isExtrasScope: boolean;
  availableProducts: ScopeProduct[];
  selectedProducts: SelectedProduct[];
  suggestedProducts: SelectedProduct[];
  totalPrice: number;
}

/** Props for ScopeProductSelectionDrawer's availableProducts */
export interface DrawerProduct {
  id: string;
  productId: string;
  productName: string;
  productShortName: string | null;
  variantName: string | null;
  price: number;
  category: string | null;
}

type PreselectedStrategy = 'first-if-empty' | 'always' | 'never';

// ── Hook ────────────────────────────────────────────────────────────────────

export function useSummaryServices(
  instanceId: string,
  offer: OfferState,
  isEditing: boolean | undefined,
  onUpdateOffer: (data: Partial<OfferState>) => void,
) {
  const [services, setServices] = useState<ServiceState[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryOrder, setCategoryOrder] = useState<Record<string, number>>({});

  // Track whether conditions have been initialized from a loaded offer
  const conditionsInitializedRef = useRef(false);
  const prevOfferIdRef = useRef(offer.id);

  useEffect(() => {
    if (prevOfferIdRef.current !== offer.id) {
      conditionsInitializedRef.current = false;
      prevOfferIdRef.current = offer.id;
    }
  }, [offer.id]);

  // ── Data fetching ───────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // First, fetch all extras scopes for this instance (always shown)
      // Only use unified templates (has_unified_services = true)
      const { data: extrasScopes } = await supabase
        .from('offer_scopes')
        .select('id')
        .eq('instance_id', instanceId)
        .eq('active', true)
        .eq('is_extras_scope', true)
        .eq('has_unified_services', true);

      const extrasScopeIds = (extrasScopes || []).map((s) => s.id);

      // Combine selected scopes with extras scopes
      const allScopeIds = [...new Set([...offer.selectedScopeIds, ...extrasScopeIds])];

      if (allScopeIds.length === 0) {
        setServices([]);
        setLoading(false);
        return;
      }

      // Fetch scopes with default conditions
      const { data: scopesData } = await supabase
        .from('offer_scopes')
        .select(
          'id, name, short_name, is_extras_scope, default_warranty, default_payment_terms, default_notes, default_service_info',
        )
        .in('id', allScopeIds)
        .order('sort_order');

      if (!scopesData) {
        setLoading(false);
        return;
      }

      // Fetch products for non-extras scopes (regular offer_scope_products)
      const nonExtrasScopeIds = scopesData.filter((s) => !s.is_extras_scope).map((s) => s.id);
      const { data: scopeProductsData } = await supabase
        .from('offer_scope_products')
        .select(
          `
          id,
          scope_id,
          product_id,
          variant_name,
          is_default,
          sort_order,
          product:unified_services!product_id(id, name, short_name, default_price, price_from, price_small, price_medium, price_large, category_id, metadata)
        `,
        )
        .in('scope_id', nonExtrasScopeIds.length > 0 ? nonExtrasScopeIds : ['__none__'])
        .order('sort_order');

      // For extras scopes - fetch products with service_type='both' (unified model)
      const { data: allProductsData } = await supabase
        .from('unified_services')
        .select(
          'id, name, short_name, default_price, price_from, price_small, price_medium, price_large, category_id, service_type, visibility, metadata',
        )
        .eq('instance_id', instanceId)
        .eq('service_type', 'both')
        .eq('active', true)
        .order('name');

      // Filter out services with visibility='only_reservations'
      const filteredProductsData = (allProductsData || []).filter((p) => {
        const vis = (p as { visibility?: string }).visibility || 'everywhere';
        return vis !== 'only_reservations';
      });

      // Fetch categories with category_type='both' (unified model)
      const { data: categoryData } = await supabase
        .from('unified_categories')
        .select('id, name, sort_order')
        .eq('instance_id', instanceId)
        .eq('category_type', 'both')
        .eq('active', true);

      // Build category ID -> name map for resolving UUIDs
      const categoryIdToNameMap: Record<string, string> = {};
      const categoryOrderMap: Record<string, number> = {};
      if (categoryData) {
        categoryData.forEach((cat) => {
          categoryIdToNameMap[cat.id] = cat.name;
          categoryOrderMap[cat.name] = cat.sort_order ?? 999;
        });
      }
      setCategoryOrder(categoryOrderMap);

      // Build services state
      const newServices: ServiceState[] = scopesData.map((scope) => {
        let scopeProducts: ScopeProduct[];

        if (scope.is_extras_scope) {
          scopeProducts = filteredProductsData.map((product) => ({
            id: `extras-${product.id}`,
            product_id: product.id,
            variant_name: null,
            is_default: false,
            product: {
              id: product.id,
              name: product.name,
              short_name: product.short_name,
              default_price: product.default_price,
              price_from: product.price_from,
              price_small: product.price_small,
              price_medium: product.price_medium,
              price_large: product.price_large,
              category: product.category_id
                ? categoryIdToNameMap[product.category_id] || null
                : null,
              metadata: (product as { metadata?: unknown }).metadata || null,
            },
            durabilityMonths:
              (product as { metadata?: { trwalosc_produktu_w_mesiacach?: number } }).metadata
                ?.trwalosc_produktu_w_mesiacach ?? null,
          }));
        } else {
          scopeProducts = (scopeProductsData || [])
            .filter((p) => p.scope_id === scope.id)
            .map((p) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join type not in generated types
              const prod = (p as any).product;
              return {
                id: p.id,
                product_id: p.product_id,
                variant_name: p.variant_name,
                is_default: p.is_default,
                product: prod
                  ? {
                      id: prod.id,
                      name: prod.name,
                      short_name: prod.short_name,
                      default_price: prod.default_price,
                      price_from: prod.price_from,
                      price_small: prod.price_small,
                      price_medium: prod.price_medium,
                      price_large: prod.price_large,
                      category: prod.category_id
                        ? categoryIdToNameMap[prod.category_id] || null
                        : null,
                      metadata: prod.metadata || null,
                    }
                  : null,
                durabilityMonths: prod?.metadata?.trwalosc_produktu_w_mesiacach ?? null,
              };
            });
        }

        // Check if we have saved options for this scope - restore them
        const existingOption = offer.options.find((opt) => opt.scopeId === scope.id);

        // Helper: convert scope product to SelectedProduct
        const toSelectedProduct = (p: ScopeProduct, isPreselected: boolean): SelectedProduct => ({
          id: crypto.randomUUID(),
          scopeProductId: p.id,
          productId: p.product_id,
          variantName: p.variant_name,
          productName: p.product?.name ?? '',
          productShortName: p.product?.short_name ?? null,
          price: getLowestPrice(p.product),
          isDefault: p.is_default,
          isPreselected,
        });

        // Helper: build defaults (only is_default products)
        const buildDefaultSelected = (): SelectedProduct[] => {
          const defaults = scopeProducts.filter((p) => p.is_default && p.product);
          return defaults.map((p, idx) =>
            toSelectedProduct(p, scope.is_extras_scope ? true : idx === 0),
          );
        };

        let selectedProducts: SelectedProduct[] = [];
        let suggestedProducts: SelectedProduct[] = [];

        // Get customer selections from saved state
        const customerSelectedOptionalItems =
          offer.defaultSelectedState?.selectedOptionalItems || {};

        const isPersistedOffer = Boolean(offer.id);

        if (isPersistedOffer && existingOption && existingOption.items.length > 0) {
          // Restore from saved offer
          const allRestored = existingOption.items
            .map((item) => {
              const nameParts = (item.customName || '').split('\n');
              const productNameFromItem =
                nameParts.length > 1 ? nameParts[nameParts.length - 1] : item.customName;
              const variantFromItem = nameParts.length > 1 ? nameParts[0] : null;

              const matchingProduct = scopeProducts.find(
                (sp) =>
                  sp.product_id === item.productId ||
                  (sp.product?.name === productNameFromItem && sp.variant_name === variantFromItem),
              );

              const wasSelectedByCustomer = customerSelectedOptionalItems[item.id] === true;

              return {
                id: item.id,
                scopeProductId: matchingProduct?.id || '',
                productId: item.productId || matchingProduct?.product_id || '',
                variantName: variantFromItem || matchingProduct?.variant_name || null,
                productName: productNameFromItem || matchingProduct?.product?.name || '',
                productShortName: matchingProduct?.product?.short_name || null,
                price: item.unitPrice,
                isDefault: matchingProduct?.is_default || false,
                isPreselected: !item.isOptional || wasSelectedByCustomer,
              };
            })
            .filter((p) => p.productId);

          if (scope.is_extras_scope) {
            selectedProducts = allRestored.filter((p) => p.isPreselected);
            suggestedProducts = allRestored.filter((p) => !p.isPreselected);
          } else {
            selectedProducts = allRestored;
          }
        } else {
          // NEW OFFER: use ONLY is_default products from the scope template
          selectedProducts = buildDefaultSelected();

          // For NEW offers from widget: auto-add widget-selected extras
          if (scope.is_extras_scope && offer.widgetSelectedExtras?.length) {
            const widgetExtrasProducts = scopeProducts.filter(
              (p) => offer.widgetSelectedExtras?.includes(p.product_id) && p.product,
            );
            const widgetPreselected = widgetExtrasProducts.map((p) => toSelectedProduct(p, true));
            const existingIds = new Set(selectedProducts.map((sp) => sp.productId));
            widgetPreselected.forEach((wp) => {
              if (!existingIds.has(wp.productId)) {
                selectedProducts.push(wp);
              }
            });
          }

          // For NEW offers from widget with duration selection
          if (!scope.is_extras_scope && offer.widgetDurationSelections) {
            const selectedDuration = offer.widgetDurationSelections[scope.id];

            if (selectedDuration !== undefined && selectedDuration !== null) {
              const durationMatchingProducts = scopeProducts.filter(
                (p) => p.durabilityMonths === selectedDuration && p.product,
              );

              if (durationMatchingProducts.length > 0) {
                selectedProducts = durationMatchingProducts.map((p) => toSelectedProduct(p, true));
              }
            }
          }
        }

        const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

        return {
          scopeId: scope.id,
          name: scope.name,
          shortName: scope.short_name,
          isExtrasScope: scope.is_extras_scope,
          availableProducts: scopeProducts,
          selectedProducts,
          suggestedProducts,
          totalPrice,
        };
      });

      // Sort services: extras scope always last
      const sortedServices = newServices.sort((a, b) => {
        if (a.isExtrasScope && !b.isExtrasScope) return 1;
        if (!a.isExtrasScope && b.isExtrasScope) return -1;
        return 0;
      });

      setServices(sortedServices);

      // Combine default conditions from all scopes with headers
      const combineWithHeaders = (
        field:
          | 'default_warranty'
          | 'default_payment_terms'
          | 'default_notes'
          | 'default_service_info',
      ): string => {
        const scopeValues = scopesData
          .map((scope) => ({ name: scope.name, value: (scope[field] || '').trim() }))
          .filter((sv) => sv.value);

        if (scopeValues.length === 0) return '';

        const uniqueValues = new Set(scopeValues.map((sv) => sv.value));

        if (uniqueValues.size === 1) {
          return scopeValues[0].value;
        }

        const parts: string[] = [];
        scopeValues.forEach((sv) => {
          parts.push(`${sv.name}:\n${sv.value}`);
        });
        return parts.join('\n\n');
      };

      // Update conditions — skip overwriting on first load of existing offer
      if (isEditing && offer.id && !conditionsInitializedRef.current) {
        conditionsInitializedRef.current = true;
      } else {
        conditionsInitializedRef.current = true;
        const updates: Partial<OfferState> = {
          warranty: combineWithHeaders('default_warranty'),
          paymentTerms: combineWithHeaders('default_payment_terms'),
          notes: combineWithHeaders('default_notes'),
          serviceInfo: combineWithHeaders('default_service_info'),
        };
        onUpdateOffer(updates);
      }

      setLoading(false);
    };

    fetchData();
  }, [instanceId, offer.selectedScopeIds, offer.id]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addProduct = useCallback((scopeId: string, scopeProduct: ScopeProduct) => {
    if (!scopeProduct.product) return;

    setServices((prev) =>
      prev.map((service) => {
        if (service.scopeId !== scopeId) return service;

        const newProduct: SelectedProduct = {
          id: crypto.randomUUID(),
          scopeProductId: scopeProduct.id,
          productId: scopeProduct.product_id,
          variantName: scopeProduct.variant_name,
          productName: scopeProduct.product!.name,
          productShortName: scopeProduct.product!.short_name,
          price: getLowestPrice(scopeProduct.product),
          isDefault: scopeProduct.is_default,
          isPreselected: false,
        };

        const newSelectedProducts = [...service.selectedProducts, newProduct];
        const totalPrice = newSelectedProducts.reduce((sum, p) => sum + p.price, 0);

        return { ...service, selectedProducts: newSelectedProducts, totalPrice };
      }),
    );
  }, []);

  const removeProduct = useCallback((scopeId: string, productId: string) => {
    setServices((prev) =>
      prev.map((service) => {
        if (service.scopeId !== scopeId) return service;

        const newSelectedProducts = service.selectedProducts.filter((p) => p.id !== productId);
        const totalPrice = newSelectedProducts.reduce((sum, p) => sum + p.price, 0);

        return { ...service, selectedProducts: newSelectedProducts, totalPrice };
      }),
    );
  }, []);

  const removeSuggestedProduct = useCallback((scopeId: string, productId: string) => {
    setServices((prev) =>
      prev.map((service) => {
        if (service.scopeId !== scopeId) return service;
        return {
          ...service,
          suggestedProducts: service.suggestedProducts.filter((p) => p.id !== productId),
        };
      }),
    );
  }, []);

  const updateProductPrice = useCallback(
    (scopeId: string, productId: string, newPrice: number, isSuggested: boolean = false) => {
      setServices((prev) =>
        prev.map((service) => {
          if (service.scopeId !== scopeId) return service;

          if (isSuggested) {
            const newSuggestedProducts = service.suggestedProducts.map((p) =>
              p.id === productId ? { ...p, price: newPrice } : p,
            );
            return { ...service, suggestedProducts: newSuggestedProducts };
          }

          const newSelectedProducts = service.selectedProducts.map((p) =>
            p.id === productId ? { ...p, price: newPrice } : p,
          );
          const totalPrice = newSelectedProducts.reduce((sum, p) => sum + p.price, 0);

          return { ...service, selectedProducts: newSelectedProducts, totalPrice };
        }),
      );
    },
    [],
  );

  // ── Drawer helpers ────────────────────────────────────────────────────────

  const getAvailableProducts = useCallback((service: ServiceState) => {
    const addedProductIds = new Set([
      ...service.selectedProducts.map((p) => p.scopeProductId),
      ...service.suggestedProducts.map((p) => p.scopeProductId),
    ]);
    return service.availableProducts.filter((p) => !addedProductIds.has(p.id));
  }, []);

  /** Map service.availableProducts → format required by ScopeProductSelectionDrawer */
  const mapAvailableProducts = useCallback((service: ServiceState): DrawerProduct[] => {
    return service.availableProducts
      .filter((p) => p.product)
      .map((p) => ({
        id: p.id,
        productId: p.product_id,
        productName: p.product?.name || '',
        productShortName: p.product?.short_name || null,
        variantName: p.variant_name,
        price: getLowestPrice(p.product),
        category: p.product?.category || null,
      }));
  }, []);

  /** Factory for onConfirm handlers — deduplicated from 3 identical blocks */
  const buildDrawerConfirmHandler = useCallback(
    (
      scopeId: string,
      target: 'selected' | 'suggested',
      preselectedStrategy: PreselectedStrategy,
    ) => {
      return (products: DrawerProduct[]) => {
        setServices((prev) =>
          prev.map((s) => {
            if (s.scopeId !== scopeId) return s;

            const sourceList = target === 'selected' ? s.selectedProducts : s.suggestedProducts;
            const newSelectedIds = new Set(products.map((p) => p.id));

            const kept = sourceList.filter((p) => newSelectedIds.has(p.scopeProductId));
            const keptIds = new Set(kept.map((p) => p.scopeProductId));

            const added: SelectedProduct[] = products
              .filter((p) => !keptIds.has(p.id))
              .map((p, idx) => {
                const scopeProduct = s.availableProducts.find((sp) => sp.id === p.id);
                return {
                  id: crypto.randomUUID(),
                  scopeProductId: p.id,
                  productId: p.productId,
                  variantName: p.variantName,
                  productName: p.productName,
                  productShortName: p.productShortName,
                  price: p.price,
                  isDefault: scopeProduct?.is_default || false,
                  isPreselected:
                    preselectedStrategy === 'always'
                      ? true
                      : preselectedStrategy === 'never'
                        ? false
                        : kept.length === 0 && idx === 0, // 'first-if-empty'
                };
              });

            const merged = [...kept, ...added];

            if (target === 'selected') {
              return {
                ...s,
                selectedProducts: merged,
                totalPrice: merged.reduce((sum, p) => sum + p.price, 0),
              };
            }
            return { ...s, suggestedProducts: merged };
          }),
        );
      };
    },
    [],
  );

  // ── Product data refresh after edit ─────────────────────────────────────

  const refreshProductData = useCallback(async () => {
    if (services.length === 0) return;

    const { data: scopeProductsData } = await supabase
      .from('offer_scope_products')
      .select(
        `
        id,
        scope_id,
        product_id,
        variant_name,
        is_default,
        sort_order,
        product:unified_services!product_id(id, name, short_name, default_price, price_from, price_small, price_medium, price_large)
      `,
      )
      .in(
        'scope_id',
        services.map((s) => s.scopeId),
      )
      .order('sort_order');

    setServices((prev) =>
      prev.map((service) => {
        const updatedProducts = service.selectedProducts.map((sp) => {
          const freshData = (scopeProductsData || []).find((p) => p.id === sp.scopeProductId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join
          const product = (freshData as any)?.product;
          if (product) {
            return {
              ...sp,
              productName: product.name,
              productShortName: product.short_name,
              price: getLowestPrice(product),
            };
          }
          return sp;
        });

        const updatedSuggested = service.suggestedProducts.map((sp) => {
          const freshData = (scopeProductsData || []).find((p) => p.id === sp.scopeProductId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join
          const product = (freshData as any)?.product;
          if (product) {
            return {
              ...sp,
              productName: product.name,
              productShortName: product.short_name,
              price: getLowestPrice(product),
            };
          }
          return sp;
        });

        return {
          ...service,
          selectedProducts: updatedProducts,
          suggestedProducts: updatedSuggested,
          totalPrice: updatedProducts.reduce((sum, p) => sum + p.price, 0),
        };
      }),
    );
  }, [services]);

  return {
    services,
    setServices,
    loading,
    categoryOrder,
    addProduct,
    removeProduct,
    removeSuggestedProduct,
    updateProductPrice,
    getAvailableProducts,
    mapAvailableProducts,
    buildDrawerConfirmHandler,
    refreshProductData,
  };
}
