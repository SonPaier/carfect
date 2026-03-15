import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@shared/ui';
import { FileText, Plus } from 'lucide-react';
import { ScopeProductSelectionDrawer } from './services/ScopeProductSelectionDrawer';
import { ServiceFormDialog, ServiceData } from '@/components/admin/ServiceFormDialog';
import { ProductItemRow } from './summary/ProductItemRow';
import { CustomerVehicleSummary } from './summary/CustomerVehicleSummary';
import { ConditionsSection } from './summary/ConditionsSection';
import type { OfferState, OfferOption } from '@/hooks/useOffer';
import { formatPrice } from '@/lib/offerUtils';
import { supabase } from '@/integrations/supabase/client';
import { useSummaryServices } from '@/hooks/useSummaryServices';

interface SummaryStepV2Props {
  instanceId: string;
  offer: OfferState;
  showUnitPrices: boolean;
  isEditing?: boolean;
  onUpdateOffer: (data: Partial<OfferState>) => void;
  calculateTotalNet: () => number;
  calculateTotalGross: () => number;
  onShowPreview?: () => void;
}

export const SummaryStepV2 = ({
  instanceId,
  offer,
  showUnitPrices,
  isEditing,
  onUpdateOffer,
  calculateTotalNet,
  calculateTotalGross,
  onShowPreview,
}: SummaryStepV2Props) => {
  const { t } = useTranslation();

  const {
    services,
    setServices,
    loading,
    categoryOrder,
    removeProduct,
    removeSuggestedProduct,
    updateProductPrice,
    getAvailableProducts,
    mapAvailableProducts,
    buildDrawerConfirmHandler,
    refreshProductData,
  } = useSummaryServices(instanceId, offer, isEditing, onUpdateOffer);

  const [conditionsOpen, setConditionsOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState<{
    scopeId: string;
    target: 'selected' | 'suggested';
  } | null>(null);
  const [editingPrice, setEditingPrice] = useState<{
    scopeId: string;
    productId: string;
    value: string;
    isSuggested?: boolean;
  } | null>(null);
  const [editingProduct, setEditingProduct] = useState<ServiceData | null>(null);
  const [productCategories, setProductCategories] = useState<{ id: string; name: string }[]>([]);

  // Price editing helpers for ProductItemRow
  const handleEditPrice = (
    scopeId: string,
    productId: string,
    value: string,
    isSuggested: boolean,
  ) => {
    setEditingPrice({ scopeId, productId, value, isSuggested });
  };

  const handleCommitPrice = (
    scopeId: string,
    productId: string,
    value: string,
    isSuggested: boolean,
  ) => {
    updateProductPrice(scopeId, productId, parseFloat(value) || 0, isSuggested);
    setEditingPrice(null);
  };

  // Calculate textarea rows based on content
  const getTextareaRows = (value: string | undefined | null, minRows: number = 3): number => {
    if (!value) return minRows;
    const lineCount = value.split('\n').length;
    return Math.max(lineCount + 1, minRows);
  };

  const formatPriceRounded = (value: number) => formatPrice(value, true);

  // Open product edit dialog
  const openProductEdit = async (productId: string) => {
    const { data } = await supabase
      .from('unified_services')
      .select(
        'id, name, short_name, description, price_from, price_small, price_medium, price_large, prices_are_net, duration_minutes, duration_small, duration_medium, duration_large, category_id, service_type, visibility, reminder_template_id',
      )
      .eq('id', productId)
      .single();

    if (data) {
      // Map unified_services fields to ServiceData format
      setEditingProduct({
        id: data.id,
        name: data.name,
        short_name: data.short_name,
        description: data.description,
        price_from: data.price_from,
        price_small: data.price_small,
        price_medium: data.price_medium,
        price_large: data.price_large,
        prices_are_net: data.prices_are_net ?? true,
        duration_minutes: data.duration_minutes,
        duration_small: data.duration_small,
        duration_medium: data.duration_medium,
        duration_large: data.duration_large,
        category_id: data.category_id,
        service_type: (data.service_type as 'both' | 'reservation' | 'offer') ?? 'both',
        visibility:
          (data.visibility as 'everywhere' | 'only_reservations' | 'only_offers') ?? 'everywhere',
        reminder_template_id: data.reminder_template_id,
      });
      // Also fetch categories
      const { data: categories } = await supabase
        .from('unified_categories')
        .select('id, name')
        .eq('instance_id', instanceId)
        .eq('category_type', 'both')
        .eq('active', true);

      setProductCategories(categories || []);
    }
  };

  // Calculate totals from services - only count preselected items
  const totalNet = useMemo(() => {
    return services.reduce((sum, s) => {
      const preselectedTotal = s.selectedProducts
        .filter((p) => p.isPreselected)
        .reduce((pSum, p) => pSum + p.price, 0);
      return sum + preselectedTotal;
    }, 0);
  }, [services]);

  const totalGross = useMemo(() => {
    return totalNet * (1 + offer.vatRate / 100);
  }, [totalNet, offer.vatRate]);

  const vatAmount = totalGross - totalNet;

  // Sync services to offer.options and defaultSelectedState whenever services change (but not on initial load)
  useEffect(() => {
    if (loading || services.length === 0) return;

    // Generate stable option IDs based on scopeId (use same ID for each scope)
    // This ensures consistency between save and load
    const optionIdMap = new Map<string, string>();
    services.forEach((service) => {
      // Check if we already have an option with this scopeId in current offer
      const existingOption = offer.options.find((o) => o.scopeId === service.scopeId);
      optionIdMap.set(service.scopeId, existingOption?.id || crypto.randomUUID());
    });

    // Convert services to offer options format
    // Include both selected (preselected) and suggested (not preselected) products
    const newOptions: OfferOption[] = services.map((service, idx) => {
      const allProducts = [
        ...service.selectedProducts.map((p) => ({ ...p, isPreselected: true })),
        ...service.suggestedProducts.map((p) => ({ ...p, isPreselected: false })),
      ];

      const optionId = optionIdMap.get(service.scopeId)!;

      return {
        id: optionId, // Use stable generated ID
        name: service.name,
        description: '',
        items: allProducts.map((p) => ({
          id: p.id,
          productId: p.productId,
          customName: p.variantName ? `${p.variantName}\n${p.productName}` : p.productName,
          customDescription: '',
          quantity: 1,
          unitPrice: p.price,
          unit: 'szt',
          discountPercent: 0,
          isOptional: !p.isPreselected, // isOptional = NOT preselected (for customer view)
          isCustom: false,
        })),
        isSelected: true,
        sortOrder: idx,
        scopeId: service.scopeId,
        isUpsell: service.isExtrasScope,
      };
    });

    // Build defaultSelectedState for public view
    // For extras scope: selectedOptionalItems maps itemId -> true for preselected items (from selectedProducts)
    // For regular scopes: selectedItemInOption maps optionId -> itemId for first item
    const selectedOptionalItems: Record<string, boolean> = {};
    const selectedItemInOption: Record<string, string> = {};

    services.forEach((service) => {
      const optionId = optionIdMap.get(service.scopeId)!;

      if (service.isExtrasScope) {
        // For extras: mark all products in selectedProducts (these are preselected)
        service.selectedProducts.forEach((p) => {
          selectedOptionalItems[p.id] = true;
        });
      } else {
        // For regular services: set the first item as selected
        // Use optionId (not scopeId) as key - this matches how PublicOfferCustomerView reads it
        const firstItem = service.selectedProducts[0];
        if (firstItem) {
          selectedItemInOption[optionId] = firstItem.id;
        }
      }
    });

    // Find the first non-extras scope as selected scope
    const selectedScopeId = services.find((s) => !s.isExtrasScope)?.scopeId || null;

    onUpdateOffer({
      options: newOptions,
      defaultSelectedState: {
        selectedScopeId,
        selectedVariants: {},
        selectedOptionalItems,
        selectedItemInOption,
      },
    });
  }, [services, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer & Vehicle Summary */}
      <CustomerVehicleSummary customerData={offer.customerData} vehicleData={offer.vehicleData} />

      {/* Services */}
      {services
        .filter((s) => !s.isExtrasScope)
        .map((service) => (
          <Card key={service.scopeId} className="p-5">
            {/* Service header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">{service.name}</h3>
              </div>
            </div>

            {/* Selected Products */}
            <div className="space-y-2">
              {service.selectedProducts.map((product) => (
                <ProductItemRow
                  key={product.id}
                  scopeId={service.scopeId}
                  product={product}
                  editingPrice={editingPrice}
                  formatPrice={formatPrice}
                  onEditPrice={handleEditPrice}
                  onCommitPrice={handleCommitPrice}
                  onCancelEditPrice={() => setEditingPrice(null)}
                  onRemove={removeProduct}
                  onEditProduct={openProductEdit}
                />
              ))}
            </div>

            {/* Add Product Button */}
            {getAvailableProducts(service).length > 0 && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white"
                  onClick={() => setDrawerOpen({ scopeId: service.scopeId, target: 'selected' })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('summary.addService')}
                </Button>
              </div>
            )}

            <ScopeProductSelectionDrawer
              open={drawerOpen?.scopeId === service.scopeId && drawerOpen.target === 'selected'}
              onClose={() => setDrawerOpen(null)}
              availableProducts={mapAvailableProducts(service)}
              alreadySelectedIds={service.selectedProducts.map((p) => p.scopeProductId)}
              categoryOrder={categoryOrder}
              onConfirm={buildDrawerConfirmHandler(service.scopeId, 'selected', 'first-if-empty')}
            />
          </Card>
        ))}

      {/* Extras Sections */}
      {services
        .filter((s) => s.isExtrasScope)
        .map((service) => (
          <div key={service.scopeId} className="space-y-4">
            {/* Selected Extras */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">{t('summary.selectedExtras')}</h3>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{formatPriceRounded(service.totalPrice)}</p>
                  <p className="text-xs text-muted-foreground">{t('summary.net')}</p>
                </div>
              </div>

              <div className="space-y-2">
                {service.selectedProducts.map((product) => (
                  <ProductItemRow
                    key={product.id}
                    scopeId={service.scopeId}
                    product={product}
                    editingPrice={editingPrice}
                    formatPrice={formatPrice}
                    onEditPrice={handleEditPrice}
                    onCommitPrice={handleCommitPrice}
                    onCancelEditPrice={() => setEditingPrice(null)}
                    onRemove={removeProduct}
                    onEditProduct={openProductEdit}
                  />
                ))}
              </div>

              {getAvailableProducts(service).length > 0 && (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white"
                    onClick={() => setDrawerOpen({ scopeId: service.scopeId, target: 'selected' })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('summary.addService')}
                  </Button>
                </div>
              )}

              <ScopeProductSelectionDrawer
                open={drawerOpen?.scopeId === service.scopeId && drawerOpen.target === 'selected'}
                onClose={() => setDrawerOpen(null)}
                availableProducts={mapAvailableProducts(service)}
                alreadySelectedIds={service.selectedProducts.map((p) => p.scopeProductId)}
                disabledIds={service.suggestedProducts.map((p) => p.scopeProductId)}
                categoryOrder={categoryOrder}
                onConfirm={buildDrawerConfirmHandler(service.scopeId, 'selected', 'always')}
              />
            </Card>

            {/* Suggested Extras */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-bold text-lg text-muted-foreground">
                  {t('summary.suggestedExtras')}
                </h3>
              </div>

              <div className="space-y-2">
                {service.suggestedProducts.map((product) => (
                  <ProductItemRow
                    key={product.id}
                    scopeId={service.scopeId}
                    product={product}
                    isSuggested
                    editingPrice={editingPrice}
                    formatPrice={formatPrice}
                    onEditPrice={handleEditPrice}
                    onCommitPrice={handleCommitPrice}
                    onCancelEditPrice={() => setEditingPrice(null)}
                    onRemove={removeSuggestedProduct}
                    onEditProduct={openProductEdit}
                  />
                ))}
              </div>

              {getAvailableProducts(service).length > 0 && (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white"
                    onClick={() => setDrawerOpen({ scopeId: service.scopeId, target: 'suggested' })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('summary.addRecommended')}
                  </Button>
                </div>
              )}

              <ScopeProductSelectionDrawer
                open={drawerOpen?.scopeId === service.scopeId && drawerOpen.target === 'suggested'}
                onClose={() => setDrawerOpen(null)}
                availableProducts={mapAvailableProducts(service)}
                alreadySelectedIds={service.suggestedProducts.map((p) => p.scopeProductId)}
                disabledIds={service.selectedProducts.map((p) => p.scopeProductId)}
                categoryOrder={categoryOrder}
                onConfirm={buildDrawerConfirmHandler(service.scopeId, 'suggested', 'never')}
              />
            </Card>
          </div>
        ))}

      {/* Totals - hidden, pricing shown only in preview */}

      {/* Additional Conditions */}
      <ConditionsSection
        offer={offer}
        open={conditionsOpen}
        onOpenChange={setConditionsOpen}
        onUpdateOffer={onUpdateOffer}
        getTextareaRows={getTextareaRows}
      />

      {/* Product Edit Dialog */}
      <ServiceFormDialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        instanceId={instanceId}
        categories={productCategories}
        service={editingProduct}
        onSaved={() => {
          refreshProductData();
          setEditingProduct(null);
        }}
      />
    </div>
  );
};
