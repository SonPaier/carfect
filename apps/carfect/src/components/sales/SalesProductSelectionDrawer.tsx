import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Check, Loader2, Search, X, ScanBarcode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { useRollQuickSearch, type RollMatch } from './hooks/useRollQuickSearch';

export interface SalesProductOption {
  id: string;
  fullName: string;
  shortName: string;
  priceNet: number;
  priceUnit: string;
  productType?: 'roll' | 'other';
  hasVariants?: boolean;
  excludeFromDiscount?: boolean;
  categoryName?: string;
  variants?: SalesProductVariantOption[];
}

export interface SalesProductVariantOption {
  id: string;
  productId: string;
  variantName: string;
  fullName: string;
  shortName: string;
  priceUnit: string;
}

export interface SelectedProductItem {
  id: string;
  productId: string;
  variantId?: string;
  fullName: string;
  shortName: string;
  variantName?: string;
  priceNet: number;
  priceUnit: string;
  productType?: 'roll' | 'other';
  excludeFromDiscount?: boolean;
  categoryName?: string;
}

interface SalesProductSelectionDrawerProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
  selectedProductIds: string[];
  selectedVariantIds?: string[];
  /** Current customer name — used to pick the correct "Wycinanie formatek" variant */
  customerName?: string;
  onConfirm: (
    products: SelectedProductItem[],
    options?: {
      addFormatki?: boolean;
      formatkiProduct?: { productId: string; fullName: string; priceNet: number };
      /** Auto-assign this roll to the first roll product */
      rollAssignment?: { rollId: string; widthMm: number; remainingMb: number };
    },
  ) => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';

const formatPriceUnit = (unit: string): string => {
  if (unit === 'piece') return 'szt.';
  if (unit === 'meter') return 'm²';
  return unit;
};

const SalesProductSelectionDrawer = ({
  open,
  onClose,
  instanceId,
  selectedProductIds: initialSelectedProductIds,
  selectedVariantIds: initialSelectedVariantIds = [],
  customerName,
  onConfirm,
}: SalesProductSelectionDrawerProps) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<SalesProductOption[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [addFormatki, setAddFormatki] = useState(false);
  const [pendingRollMatch, setPendingRollMatch] = useState<RollMatch | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const keys = new Set<string>();
      initialSelectedProductIds.forEach((id) => keys.add(id));
      initialSelectedVariantIds.forEach((id) => keys.add(`variant:${id}`));
      setSelectedKeys(keys);
      setSearchQuery('');
      setAddFormatki(false);
      setPendingRollMatch(null);
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [open, initialSelectedProductIds, initialSelectedVariantIds]);

  const fetchProducts = useCallback(async () => {
    if (!open || !instanceId) return;
    setLoading(true);
    const { data } = await supabase
      .from('sales_products')
      .select(
        'id, full_name, short_name, price_net, price_unit, product_type, has_variants, exclude_from_discount, category_id',
      )
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false });

    // Fetch category names
    const { data: cats } = await supabase
      .from('unified_categories')
      .select('id, name')
      .eq('instance_id', instanceId)
      .eq('category_type', 'sales');
    const catMap = new Map((cats || []).map((c) => [c.id, c.name]));

    const allProducts: SalesProductOption[] = (data || []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      shortName: p.short_name || '',
      priceNet: Number(p.price_net),
      priceUnit: p.price_unit || 'szt.',
      productType: (p.product_type as 'roll' | 'other') || 'roll',
      hasVariants: p.has_variants || false,
      excludeFromDiscount: p.exclude_from_discount || false,
      categoryName: p.category_id ? catMap.get(p.category_id) || undefined : undefined,
      variants: [],
    }));

    // Fetch variants for products that have them
    const variantProductIds = allProducts.filter((p) => p.hasVariants).map((p) => p.id);
    if (variantProductIds.length > 0) {
      const { data: variants } = await supabase
        .from('sales_product_variants')
        .select('id, product_id, name, sort_order')
        .in('product_id', variantProductIds)
        .order('sort_order');

      const variantsByProduct = new Map<string, SalesProductVariantOption[]>();
      (variants || []).forEach((v) => {
        const parent = allProducts.find((p) => p.id === v.product_id);
        if (!parent) return;
        const list = variantsByProduct.get(v.product_id) || [];
        list.push({
          id: v.id,
          productId: v.product_id,
          variantName: v.name,
          fullName: parent.fullName,
          shortName: parent.shortName,
          priceUnit: parent.priceUnit,
        });
        variantsByProduct.set(v.product_id, list);
      });

      allProducts.forEach((p) => {
        if (p.hasVariants) {
          p.variants = variantsByProduct.get(p.id) || [];
        }
      });
    }

    setProducts(allProducts);
    setLoading(false);
  }, [open, instanceId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const { match: rollMatch, searching: rollSearching } = useRollQuickSearch(
    instanceId,
    searchQuery,
    products,
  );

  // When a roll match is found and user hasn't manually selected anything, auto-select it
  const handleRollMatchSelect = useCallback(
    (match: RollMatch) => {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.add(match.selectionKey);
        return next;
      });
      setPendingRollMatch(match);
    },
    [],
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.shortName.toLowerCase().includes(q) ||
        (p.variants || []).some((v) => v.variantName.toLowerCase().includes(q)),
    );
  }, [products, searchQuery]);

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedCount = selectedKeys.size;

  // Check if any selected product is a roll type
  const hasSelectedRoll = useMemo(() => {
    for (const key of selectedKeys) {
      if (key.startsWith('variant:')) {
        for (const product of products) {
          if (product.variants?.some((v) => v.id === key.slice(8))) {
            if (product.productType === 'roll' || !product.productType) return true;
          }
        }
      } else {
        const product = products.find((p) => p.id === key);
        if (product && (product.productType === 'roll' || !product.productType)) return true;
      }
    }
    return false;
  }, [selectedKeys, products]);

  // Find the correct "Wycinanie formatek" product based on customer name.
  // If customer name contains "struzik", use the Struzik-specific formatki product.
  const formatkiProduct = useMemo(() => {
    const all = products.filter((p) => p.fullName.toLowerCase().includes('wycinanie formatek'));
    if (all.length === 0) return undefined;
    if (all.length === 1) return all[0];
    const isStruzik = customerName?.toLowerCase().includes('struzik');
    return (
      all.find((p) =>
        isStruzik
          ? p.fullName.toLowerCase().includes('struzik')
          : !p.fullName.toLowerCase().includes('struzik'),
      ) || all[0]
    );
  }, [products, customerName]);

  const totalNet = useMemo(() => {
    let total = 0;
    selectedKeys.forEach((key) => {
      if (key.startsWith('variant:')) {
        const variantId = key.slice(8);
        for (const product of products) {
          const variant = product.variants?.find((v) => v.id === variantId);
          if (variant) {
            total += product.priceNet;
            break;
          }
        }
      } else {
        const product = products.find((p) => p.id === key);
        if (product) total += product.priceNet;
      }
    });
    return total;
  }, [selectedKeys, products]);

  const handleConfirm = () => {
    const selected: SelectedProductItem[] = [];

    selectedKeys.forEach((key) => {
      if (key.startsWith('variant:')) {
        const variantId = key.slice(8);
        for (const product of products) {
          const variant = product.variants?.find((v) => v.id === variantId);
          if (variant) {
            selected.push({
              id: variantId,
              productId: product.id,
              variantId: variantId,
              fullName: product.fullName,
              shortName: product.shortName,
              variantName: variant.variantName,
              priceNet: product.priceNet,
              priceUnit: product.priceUnit,
              productType: product.productType,
              excludeFromDiscount: product.excludeFromDiscount,
              categoryName: product.categoryName,
            });
            break;
          }
        }
      } else {
        const product = products.find((p) => p.id === key);
        if (product) {
          selected.push({
            id: product.id,
            productId: product.id,
            fullName: product.fullName,
            shortName: product.shortName,
            priceNet: product.priceNet,
            priceUnit: product.priceUnit,
            productType: product.productType,
            excludeFromDiscount: product.excludeFromDiscount,
            categoryName: product.categoryName,
          });
        }
      }
    });

    const options: Parameters<typeof onConfirm>[1] = {};

    if (addFormatki && formatkiProduct) {
      options.addFormatki = true;
      options.formatkiProduct = {
        productId: formatkiProduct.id,
        fullName: formatkiProduct.fullName,
        priceNet: formatkiProduct.priceNet,
      };
    }

    if (pendingRollMatch) {
      options.rollAssignment = {
        rollId: pendingRollMatch.rollId,
        widthMm: pendingRollMatch.rollWidthMm,
        remainingMb: pendingRollMatch.rollRemainingMb,
      };
    }

    onConfirm(selected, Object.keys(options).length > 0 ? options : undefined);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        hideOverlay
        hideCloseButton
        className="w-full sm:max-w-[var(--drawer-width)] h-full p-0 flex flex-col overflow-hidden shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.15)] z-[1000] bg-white"
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <SheetHeader
          className="border-b px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors shrink-0"
          onClick={onClose}
        >
          <SheetTitle className="flex items-center gap-3 text-lg font-semibold">
            <ArrowLeft className="w-5 h-5" />
            Wybierz produkty
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 py-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj produktu lub wpisz 8 ost. znaków rolki..."
              className="pl-9 pr-9 h-11"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Product List */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          style={{ touchAction: 'pan-y' }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 && !rollMatch ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {searchQuery.trim() ? 'Brak pasujących produktów' : 'Brak produktów'}
            </div>
          ) : (
            <div className="pb-4">
              {/* Roll quick match */}
              {rollMatch && (
                <button
                  type="button"
                  onClick={() => handleRollMatchSelect(rollMatch)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 border-b-2 border-primary/20 transition-colors',
                    selectedKeys.has(rollMatch.selectionKey)
                      ? 'bg-primary/10'
                      : 'bg-primary/5 hover:bg-primary/10',
                  )}
                >
                  <ScanBarcode className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-foreground text-sm">
                      {rollMatch.product.shortName || rollMatch.product.fullName}
                    </p>
                    <p className="font-medium text-foreground text-xs">
                      {rollMatch.variant.variantName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rolka {rollMatch.rollCode} · {rollMatch.rollRemainingMb.toFixed(1)} mb dost.
                    </p>
                  </div>
                  <div className="text-right mr-2 shrink-0">
                    <p className="font-semibold text-foreground text-sm">
                      {formatCurrency(rollMatch.product.priceNet)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      netto/{formatPriceUnit(rollMatch.product.priceUnit)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      selectedKeys.has(rollMatch.selectionKey)
                        ? 'bg-primary border-primary'
                        : 'border-primary/40',
                    )}
                  >
                    {selectedKeys.has(rollMatch.selectionKey) && (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                </button>
              )}
              {rollSearching && searchQuery.trim().replace(/-/g, '').length >= 8 && (
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-b">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Szukam rolki...
                </div>
              )}
              {filteredProducts.map((product) => {
                // Product with variants
                if (product.hasVariants && product.variants && product.variants.length > 0) {
                  return (
                    <div key={product.id}>
                      {/* Parent product header with price (non-selectable) */}
                      <div className="w-full flex items-center px-4 py-3 border-b border-border/50 bg-muted/15">
                        <div className="flex-1 text-left min-w-0">
                          {product.shortName ? (
                            <>
                              <p className="font-bold text-foreground text-sm">
                                {product.shortName}
                              </p>
                              <p className="text-muted-foreground text-xs leading-tight truncate">
                                {product.fullName}
                              </p>
                            </>
                          ) : (
                            <p className="font-bold text-foreground text-sm">{product.fullName}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-foreground text-sm">
                            {formatCurrency(product.priceNet)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            netto/{formatPriceUnit(product.priceUnit)}
                          </p>
                        </div>
                      </div>
                      {/* Variant rows (selectable) */}
                      {product.variants.map((variant) => {
                        const variantKey = `variant:${variant.id}`;
                        const isSelected = selectedKeys.has(variantKey);
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => toggleKey(variantKey)}
                            className={cn(
                              'w-full flex items-center px-4 pl-8 py-2.5 border-b border-border/50 transition-colors',
                              isSelected ? 'bg-primary/5' : 'hover:bg-primary/5',
                            )}
                          >
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-medium text-foreground text-sm">
                                {variant.variantName}
                              </p>
                            </div>
                            <div
                              className={cn(
                                'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground/40',
                              )}
                            >
                              {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                // Non-variant product
                const isSelected = selectedKeys.has(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleKey(product.id)}
                    className={cn(
                      'w-full flex items-center px-4 py-3 border-b border-border/50 transition-colors',
                      isSelected ? 'bg-primary/5' : 'hover:bg-primary/5',
                    )}
                  >
                    <div className="flex-1 text-left min-w-0">
                      {product.shortName ? (
                        <>
                          <p className="font-bold text-foreground">{product.shortName}</p>
                          <p className="text-muted-foreground text-xs leading-tight truncate">
                            {product.fullName}
                          </p>
                        </>
                      ) : (
                        <p className="font-medium text-foreground">{product.fullName}</p>
                      )}
                    </div>

                    <div className="text-right mr-4 shrink-0">
                      <p className="font-semibold text-foreground text-sm">
                        {formatCurrency(product.priceNet)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        netto/{formatPriceUnit(product.priceUnit)}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40',
                      )}
                    >
                      {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-4 shrink-0">
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">
                Wybrano: {selectedCount}
              </span>
            </div>
            {selectedCount > 0 && (
              <div className="text-right">
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(totalNet)} netto
                </span>
              </div>
            )}
          </div>
          {hasSelectedRoll && formatkiProduct && (
            <button
              type="button"
              onClick={() => setAddFormatki((v) => !v)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg border-2 px-4 mb-3 transition-colors',
                addFormatki
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              )}
              style={{ minHeight: 48 }}
            >
              <div
                className={cn(
                  'w-[28px] h-[28px] rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                  addFormatki ? 'bg-primary border-primary' : 'border-muted-foreground/40',
                )}
              >
                {addFormatki && <Check className="w-5 h-5 text-primary-foreground" />}
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground text-sm">
                  + Wycinanie formatek
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({formatCurrency(formatkiProduct.priceNet)}/m²)
                </span>
              </div>
            </button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="w-full"
            size="lg"
          >
            Zatwierdź
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SalesProductSelectionDrawer;
