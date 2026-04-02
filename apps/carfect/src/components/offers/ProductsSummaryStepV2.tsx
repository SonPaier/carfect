import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Separator } from '@shared/ui';
import { Gift, Plus, Trash2, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OfferProductPickerDrawer, PickedProduct } from './OfferProductPickerDrawer';
import { ConditionsSection } from './summary/ConditionsSection';
import type { OfferState, OfferOption, OfferItem } from '@/hooks/useOffer';

interface ProductsSummaryStepV2Props {
  instanceId: string;
  offer: OfferState;
  showUnitPrices: boolean;
  isEditing: boolean;
  onUpdateOffer: (partial: Partial<OfferState>) => void;
  calculateTotalNet: () => number;
  calculateTotalGross: () => number;
  onShowPreview: () => void;
}

interface FlatProduct {
  itemId: string;
  productId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  isSuggested: boolean;
}

export const ProductsSummaryStepV2 = ({
  instanceId,
  offer,
  showUnitPrices,
  isEditing,
  onUpdateOffer,
  calculateTotalNet,
  calculateTotalGross,
  onShowPreview,
}: ProductsSummaryStepV2Props) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<FlatProduct[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
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
        discountPercent: 0,
        isOptional: p.isSuggested,
        isCustom: false,
      })),
      isSelected: true,
      sortOrder: 0,
    };
    onUpdateOffer({ options: [syntheticOption] });
  }, [products]);

  const selectedProducts = products.filter((p) => !p.isSuggested);
  const suggestedProducts = products.filter((p) => p.isSuggested);
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

  const getTextareaRows = (value: string | undefined | null, minRows = 2) => {
    if (!value) return minRows;
    return Math.max(value.split('\n').length + 1, minRows);
  };

  return (
    <div className="space-y-6">
      {/* Selected Products */}
      <div className="space-y-3">
        <h3 className="font-semibold">
          Wybrane usługi, ceny netto
        </h3>

        {selectedProducts.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Brak wybranych uslug. Kliknij &quot;Dodaj usluge&quot; ponizej.
          </p>
        )}

        <div className="space-y-2">
          {selectedProducts.map((product) => (
            <ProductRow
              key={product.itemId}
              product={product}
              onPriceChange={handlePriceChange}
              onToggleSuggested={handleToggleSuggested}
              onRemove={handleRemove}
              isSuggested={false}
            />
          ))}
        </div>

      </div>

      {/* Suggested Products */}
      {suggestedProducts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">
            Sugerowane — opcjonalne dla klienta ({suggestedProducts.length})
          </h3>

          <div className="space-y-2">
            {suggestedProducts.map((product) => (
              <ProductRow
                key={product.itemId}
                product={product}
                onPriceChange={handlePriceChange}
                onToggleSuggested={handleToggleSuggested}
                onRemove={handleRemove}
                isSuggested
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Product Button */}
      <Button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="w-full h-12"
      >
        <Plus className="w-4 h-4 mr-2" />
        Dodaj usluge
      </Button>

      <Separator />

      {/* Conditions — always expanded for v2 */}
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
    </div>
  );
};

// ---- Product Row ----
interface ProductRowProps {
  product: FlatProduct;
  onPriceChange: (itemId: string, price: number) => void;
  onToggleSuggested: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  isSuggested: boolean;
}

function ProductRow({ product, onPriceChange, onToggleSuggested, onRemove, isSuggested }: ProductRowProps) {
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
    <div
      className="flex items-center gap-3 p-3 rounded-lg border bg-white"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {product.name}
        </p>
      </div>

      <div className="shrink-0">
        {editingPrice ? (
          <Input
            type="number"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => e.key === 'Enter' && commitPrice()}
            className="w-24 h-8 text-right text-sm"
            min={0}
            step={1}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => { setPriceValue(product.price.toString()); setEditingPrice(true); }}
            className="text-sm font-semibold hover:text-primary transition-colors min-w-[70px] text-right"
          >
            {product.price} zl
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onToggleSuggested(product.itemId)}
        className={cn(
          'p-1.5 rounded-full transition-colors',
          isSuggested ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-muted',
        )}
        title={isSuggested ? 'Przenies do wybranych' : 'Oznacz jako sugerowane'}
      >
        {isSuggested ? <ArrowUp className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
      </button>

      <button
        type="button"
        onClick={() => onRemove(product.itemId)}
        className="p-1.5 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ProductsSummaryStepV2;
