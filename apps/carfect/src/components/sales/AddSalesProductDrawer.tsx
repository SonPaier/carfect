import { useState, useEffect } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@shared/ui';
import { Input } from '@shared/ui';
import { NumericInput } from '@shared/ui';
import { Button } from '@shared/ui';
import { Label } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { RadioGroup, RadioGroupItem } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Checkbox } from '@shared/ui';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUnsavedChanges, UnsavedChangesDialog } from './hooks/useUnsavedChanges';

interface SalesProductVariant {
  id?: string;
  name: string;
  sortOrder: number;
}

export type ProductType = 'roll' | 'other';

interface SalesProductData {
  id: string;
  fullName: string;
  shortName: string;
  description?: string;
  priceNet: number;
  priceUnit: string;
  productType?: ProductType;
  categoryId?: string | null;
  hasVariants?: boolean;
  excludeFromDiscount?: boolean;
  variants?: SalesProductVariant[];
}

interface AddSalesProductDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  onSaved?: () => void;
  product?: SalesProductData | null;
}

const AddSalesProductDrawer = ({
  open,
  onOpenChange,
  instanceId,
  onSaved,
  product,
}: AddSalesProductDrawerProps) => {
  const isEdit = !!product;
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [priceNet, setPriceNet] = useState<number | undefined>(undefined);
  const [priceUnit, setPriceUnit] = useState<'piece' | 'meter'>('meter');
  const [productType, setProductType] = useState<ProductType>('roll');
  const [categoryId, setCategoryId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const {
    markDirty,
    resetDirty,
    handleClose: handleUnsavedClose,
    dialogProps,
  } = useUnsavedChanges();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [excludeFromDiscount, setExcludeFromDiscount] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<SalesProductVariant[]>([]);

  useEffect(() => {
    if (!instanceId || !open) return;
    supabase
      .from('unified_categories')
      .select('id, name')
      .eq('instance_id', instanceId)
      .eq('category_type', 'sales')
      .order('sort_order')
      .then(({ data }) => setCategories(data || []));
  }, [instanceId, open]);

  const resetForm = () => {
    setFullName('');
    setShortName('');
    setDescription('');
    setPriceNet(undefined);
    setPriceUnit('meter');
    setProductType('roll');
    setCategoryId('');
    setExcludeFromDiscount(false);
    setHasVariants(false);
    setVariants([]);
  };

  useEffect(() => {
    if (!open) return;
    if (product) {
      setFullName(product.fullName);
      setShortName(product.shortName);
      setDescription(product.description || '');
      setPriceNet(product.priceNet || undefined);
      setPriceUnit((product.priceUnit as 'piece' | 'meter') || 'piece');
      setProductType(product.productType || 'roll');
      setCategoryId(product.categoryId || '');
      setExcludeFromDiscount(product.excludeFromDiscount || false);
      setHasVariants(product.hasVariants || false);
      if (product.hasVariants && product.id) {
        supabase
          .from('sales_product_variants')
          .select('id, name, sort_order')
          .eq('product_id', product.id)
          .order('sort_order')
          .then(({ data }) => {
            setVariants(
              (data || []).map((v) => ({
                id: v.id,
                name: v.name,
                sortOrder: v.sort_order,
              })),
            );
          });
      } else {
        setVariants([]);
      }
    } else {
      resetForm();
    }
  }, [open, product]);

  const handleClose = () => {
    handleUnsavedClose(handleSubmit, () => {
      resetDirty();
      resetForm();
      onOpenChange(false);
    });
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { name: '', sortOrder: prev.length }]);
    markDirty();
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  const updateVariantName = (index: number, value: string) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, name: value } : v)));
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !shortName.trim()) {
      toast.error('Uzupełnij wymagane pola');
      return;
    }
    if (hasVariants && variants.length === 0) {
      toast.error('Dodaj przynajmniej jeden wariant');
      return;
    }
    if (hasVariants && variants.some((v) => !v.name.trim())) {
      toast.error('Uzupełnij nazwy wariantów');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        short_name: shortName.trim(),
        description: description.trim() || null,
        price_net: priceNet ?? 0,
        price_unit: priceUnit,
        product_type: productType,
        category_id: categoryId || null,
        exclude_from_discount: excludeFromDiscount,
        has_variants: hasVariants,
      };

      let productId: string;

      if (isEdit && product) {
        const { error } = await supabase
          .from('sales_products')
          .update(payload)
          .eq('id', product.id);
        if (error) throw error;
        productId = product.id;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: insertedProduct, error } = await supabase
          .from('sales_products')
          .insert({ instance_id: instanceId, ...payload, created_by: user?.id ?? null })
          .select('id')
          .single();
        if (error) throw error;
        productId = insertedProduct.id;
      }

      // Handle variants
      await supabase.from('sales_product_variants').delete().eq('product_id', productId);

      if (hasVariants && variants.length > 0) {
        const variantPayload = variants.map((v, idx) => ({
          product_id: productId,
          name: v.name.trim(),
          sort_order: idx,
        }));
        const { error: vError } = await supabase
          .from('sales_product_variants')
          .insert(variantPayload);
        if (vError) throw vError;
      }

      toast.success(isEdit ? 'Produkt zaktualizowany' : 'Produkt został dodany');
      resetDirty();
      resetForm();
      onOpenChange(false);
      onSaved?.();
    } catch (err: unknown) {
      toast.error('Błąd: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
      modal={false}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[var(--drawer-width)] flex flex-col h-full p-0 gap-0 shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.15)] bg-white"
        hideOverlay
        hideCloseButton
        onInteractOutside={(e) => {
          e.preventDefault();
          handleClose();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleClose();
        }}
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle>{isEdit ? 'Edytuj produkt' : 'Dodaj produkt'}</SheetTitle>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-hover transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Typ produktu</Label>
              <RadioGroup
                value={productType}
                onValueChange={(v) => {
                  setProductType(v as ProductType);
                  if (v === 'other') setPriceUnit('piece');
                  if (v === 'roll') setPriceUnit('meter');
                  markDirty();
                }}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="roll" id="type-roll" />
                  <Label htmlFor="type-roll" className="font-normal cursor-pointer">
                    Rolka (folia)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="other" id="type-other" />
                  <Label htmlFor="type-other" className="font-normal cursor-pointer">
                    Inny produkt
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-full-name">Pełna nazwa produktu</Label>
              <Input
                id="product-full-name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  markDirty();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-short-name">Skrócona nazwa produktu</Label>
              <Input
                id="product-short-name"
                value={shortName}
                onChange={(e) => {
                  setShortName(e.target.value);
                  markDirty();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v);
                  markDirty();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Opis</Label>
              <Textarea
                id="product-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  markDirty();
                }}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">Cena netto</Label>
              <NumericInput
                id="product-price"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={priceNet ?? undefined}
                onChange={(v) => {
                  setPriceNet(v ?? 0);
                  markDirty();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Cena za</Label>
              <RadioGroup
                value={priceUnit}
                onValueChange={(v) => {
                  setPriceUnit(v as 'piece' | 'meter');
                  markDirty();
                }}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="piece" id="unit-piece" />
                  <Label htmlFor="unit-piece" className="font-normal cursor-pointer">
                    Sztukę
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="meter" id="unit-meter" />
                  <Label htmlFor="unit-meter" className="font-normal cursor-pointer">
                    m²
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="exclude-from-discount"
                checked={excludeFromDiscount}
                onCheckedChange={(v) => {
                  setExcludeFromDiscount(v === true);
                  markDirty();
                }}
              />
              <Label htmlFor="exclude-from-discount" className="text-sm font-normal cursor-pointer">
                Wykluczaj ten produkt z rabatów
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="has-variants"
                checked={hasVariants}
                onCheckedChange={(v) => {
                  setHasVariants(v === true);
                  markDirty();
                }}
              />
              <Label htmlFor="has-variants" className="text-sm font-normal cursor-pointer">
                Produkt posiada warianty
              </Label>
            </div>

            {hasVariants && (
              <div className="space-y-3">
                <Label>Warianty</Label>
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 border border-border rounded-md p-2 bg-muted/20"
                  >
                    <Input
                      placeholder="np. 1220mm x 2m"
                      value={variant.name}
                      onChange={(e) => {
                        updateVariantName(index, e.target.value);
                        markDirty();
                      }}
                      className="h-8 text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={addVariant}
                >
                  <Plus className="w-4 h-4" />
                  Dodaj wariant
                </Button>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t shrink-0">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Anuluj
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Zapisuję...
                </>
              ) : isEdit ? (
                'Zapisz zmiany'
              ) : (
                'Dodaj produkt'
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
      <UnsavedChangesDialog {...dialogProps} />
    </Sheet>
  );
};

export default AddSalesProductDrawer;
