import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';

import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { OfferProductPickerDrawer, PickedProduct } from './OfferProductPickerDrawer';
import { ConditionsSection } from './summary/ConditionsSection';
import { ServiceFormDialog, ServiceData } from '@/components/admin/ServiceFormDialog';
import { formatPrice } from '@/lib/offerUtils';
import type { OfferState, OfferOption, OfferItem } from '@/hooks/useOffer';

const clampPercent = (v: number) => (isNaN(v) ? 0 : Math.min(100, Math.max(0, v)));

interface ProductsSummaryStepV2Props {
  instanceId: string;
  offer: OfferState;
  showUnitPrices: boolean;
  discountsEnabled: boolean;
  isEditing: boolean;
  onUpdateOffer: (partial: Partial<OfferState>) => void;
  calculateTotalNet: () => number;
  calculateTotalGross: () => number;
  onShowPreview: () => void;
  onServiceSaved?: () => void;
}

interface FlatProduct {
  itemId: string;
  productId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  isSuggested: boolean;
  discountPercent: number;
}

export const ProductsSummaryStepV2 = ({
  instanceId,
  offer,
  showUnitPrices,
  discountsEnabled,
  isEditing,
  onUpdateOffer,
  calculateTotalNet,
  calculateTotalGross,
  onShowPreview,
  onServiceSaved,
}: ProductsSummaryStepV2Props) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<FlatProduct[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch categories once for ServiceFormDialog
  useEffect(() => {
    supabase
      .from('service_categories')
      .select('id, name')
      .eq('instance_id', instanceId)
      .then(({ data }) => { if (data) setCategories(data); });
  }, [instanceId]);

  const handleEditService = useCallback(async (productId: string) => {
    const { data } = await supabase
      .from('unified_services')
      .select('*')
      .eq('id', productId)
      .single();
    if (data) {
      setEditingService(data as unknown as ServiceData);
      setEditDialogOpen(true);
    }
  }, []);
  const initializedRef = useRef(false);

  // Mount: load existing products from offer.options[0]
  useEffect(() => {
    if (initializedRef.current) return;
    const items = offer.options[0]?.items ?? [];
    if (items.length > 0) {
      setProducts(
        items.map((item) => ({
          itemId: item.id,
          productId: item.productId ?? '',
          name: item.customName ?? '',
          description: item.customDescription,
          price: item.unitPrice,
          quantity: item.quantity,
          isSuggested: item.isOptional,
          discountPercent: item.discountPercent ?? 0,
        })),
      );
    }
    initializedRef.current = true;
  }, [offer.options]);

  // Sync products -> offer.options
  useEffect(() => {
    if (!initializedRef.current) return;

    const syntheticOption: OfferOption = {
      id: offer.options[0]?.id ?? crypto.randomUUID(),
      name: '',
      items: products.map((p) => ({
        id: p.itemId,
        productId: p.productId,
        customName: p.name,
        customDescription: p.description,
        quantity: p.quantity,
        unitPrice: p.price,
        unit: 'szt.',
        discountPercent: p.discountPercent,
        isOptional: p.isSuggested,
        isCustom: false,
      })),
      isSelected: true,
      sortOrder: 0,
    };
    onUpdateOffer({ options: [syntheticOption] });
  }, [products]);

  const alreadyAddedIds = products.map((p) => p.productId);

  const handleAddProducts = useCallback((picked: PickedProduct[]) => {
    setProducts((prev) => [
      ...prev,
      ...picked.map((p) => ({
        itemId: crypto.randomUUID(),
        productId: p.id,
        name: p.name,
        description: p.description ?? undefined,
        price: p.price,
        quantity: 1,
        isSuggested: false,
        discountPercent: 0,
      })),
    ]);
  }, []);

  const handleToggleSuggested = useCallback((itemId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.itemId === itemId ? { ...p, isSuggested: !p.isSuggested } : p)),
    );
  }, []);

  const handleRemove = useCallback((itemId: string) => {
    setProducts((prev) => prev.filter((p) => p.itemId !== itemId));
  }, []);

  const handlePriceChange = useCallback((itemId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.itemId === itemId ? { ...p, price: newPrice } : p)),
    );
  }, []);

  const handleDiscountChange = useCallback((itemId: string, newDiscount: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.itemId === itemId ? { ...p, discountPercent: newDiscount } : p)),
    );
  }, []);

  const getTextareaRows = (value: string | undefined | null, minRows = 2) => {
    if (!value) return minRows;
    return Math.max(value.split('\n').length + 1, minRows);
  };

  return (
    <div className="space-y-6">
      {/* Products */}
      <div className="space-y-3">
        <h3 className="font-semibold">
          Wybrane usługi, ceny netto
        </h3>

        {products.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Brak wybranych usług. Kliknij &quot;Dodaj usługę&quot; poniżej.
          </p>
        )}

        <div className="space-y-2">
          {products.map((product) => (
            <ProductRow
              key={product.itemId}
              product={product}
              discountsEnabled={discountsEnabled}
              onPriceChange={handlePriceChange}
              onDiscountChange={handleDiscountChange}
              onToggleSuggested={handleToggleSuggested}
              onRemove={handleRemove}
              onEdit={handleEditService}
            />
          ))}
        </div>
      </div>

      {/* Add Product Button */}
      <Button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="w-full h-12"
      >
        <Plus className="w-4 h-4 mr-2" />
        Dodaj usługę
      </Button>

      {/* Conditions */}
      <ConditionsSection
        offer={offer}
        open={true}
        onOpenChange={() => {}}
        onUpdateOffer={onUpdateOffer}
        getTextareaRows={getTextareaRows}
      />

      {/* Picker Drawer */}
      <OfferProductPickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        instanceId={instanceId}
        alreadyAddedProductIds={alreadyAddedIds}
        onConfirm={handleAddProducts}
      />

      {/* Service Edit Dialog */}
      <ServiceFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        instanceId={instanceId}
        service={editingService}
        categories={categories}
        onSaved={() => {
          setEditDialogOpen(false);
          setEditingService(null);
          onServiceSaved?.();
        }}
      />
    </div>
  );
};

// ---- Product Row ----
interface ProductRowProps {
  product: FlatProduct;
  discountsEnabled: boolean;
  onPriceChange: (itemId: string, price: number) => void;
  onDiscountChange: (itemId: string, discount: number) => void;
  onToggleSuggested: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onEdit: (productId: string) => void;
}

function ProductRow({ product, discountsEnabled, onPriceChange, onDiscountChange, onToggleSuggested, onRemove, onEdit }: ProductRowProps) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(product.price.toString());

  const commitPrice = () => {
    const parsed = parseFloat(priceValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onPriceChange(product.itemId, parsed);
    } else {
      setPriceValue(product.price.toString());
    }
    setEditingPrice(false);
  };

  return (
    <div className="p-3 rounded-lg border bg-white space-y-2">
      {/* Row 1: Name + delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          {product.productId ? (
            <button
              type="button"
              onClick={() => onEdit(product.productId)}
              className="font-medium text-sm block text-left hover:text-primary transition-colors"
            >
              {product.name}
            </button>
          ) : (
            <p className="font-medium text-sm">{product.name}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleSuggested(product.itemId)}
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
              product.isSuggested
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted',
            )}
            title={product.isSuggested ? 'Oznaczone jako opcja' : 'Oznacz jako opcje'}
          >
            Opcja
          </button>
          <button
            type="button"
            onClick={() => onRemove(product.itemId)}
            className="p-1.5 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 2: Price + discount */}
      <div className="flex items-center gap-3">
        {editingPrice ? (
          <Input
            type="number"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commitPrice}
            onKeyDown={(e) => e.key === 'Enter' && commitPrice()}
            className="w-28 h-8 text-sm"
            min={0}
            step={1}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => { setPriceValue(product.price.toString()); setEditingPrice(true); }}
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            {formatPrice(product.price, true)}
          </button>
        )}
        {discountsEnabled && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Rabat:</span>
            <Input
              type="number"
              value={product.discountPercent === 0 ? '' : product.discountPercent}
              onChange={(e) => {
                const raw = parseFloat(e.target.value);
                onDiscountChange(product.itemId, clampPercent(raw));
              }}
              placeholder="0"
              min={0}
              max={100}
              step={1}
              className="w-16 h-8 text-right text-sm"
              aria-label="Rabat %"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsSummaryStepV2;
