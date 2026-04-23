import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  priceNet?: number | null;
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
  const { t } = useTranslation();
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
          .select('id, name, sort_order, price_net')
          .eq('product_id', product.id)
          .order('sort_order')
          .then(({ data, error }) => {
            if (error) {
              console.error('Failed to load variants:', error);
              return;
            }
            setVariants(
              (data || []).map((v) => ({
                id: v.id,
                name: v.name,
                sortOrder: v.sort_order,
                priceNet: v.price_net ? Number(v.price_net) : null,
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

  const updateVariantPrice = (index: number, value: number | undefined) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, priceNet: value ?? null } : v)),
    );
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !shortName.trim()) {
      toast.error(t('sales.products.errorRequiredFields'));
      return;
    }
    if (hasVariants && variants.length === 0) {
      toast.error(t('sales.products.errorAddVariant'));
      return;
    }
    if (hasVariants && variants.some((v) => !v.name.trim())) {
      toast.error(t('sales.products.errorVariantNames'));
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

      // Handle variants — upsert existing, insert new, remove deleted
      if (hasVariants && variants.length > 0) {
        const keepIds: string[] = [];

        for (let idx = 0; idx < variants.length; idx++) {
          const v = variants[idx];
          if (v.id) {
            // Update existing variant
            await supabase
              .from('sales_product_variants')
              .update({ name: v.name.trim(), sort_order: idx, price_net: v.priceNet && v.priceNet > 0 ? v.priceNet : 0 })
              .eq('id', v.id);
            keepIds.push(v.id);
          } else {
            // Insert new variant
            const { data: inserted, error: iError } = await supabase
              .from('sales_product_variants')
              .insert({ product_id: productId, name: v.name.trim(), sort_order: idx, price_net: v.priceNet && v.priceNet > 0 ? v.priceNet : 0 })
              .select('id')
              .single();
            if (iError) throw iError;
            keepIds.push(inserted.id);
          }
        }

        // Remove only variants that user explicitly deleted from the list
        if (keepIds.length > 0) {
          await supabase
            .from('sales_product_variants')
            .delete()
            .eq('product_id', productId)
            .not('id', 'in', `(${keepIds.join(',')})`);
        }
      } else if (!hasVariants) {
        await supabase.from('sales_product_variants').delete().eq('product_id', productId);
      }

      toast.success(isEdit ? t('sales.products.successUpdated') : t('sales.products.successAdded'));
      resetDirty();
      resetForm();
      onOpenChange(false);
      onSaved?.();
    } catch (err: unknown) {
      toast.error(t('sales.products.errorSave', { message: err instanceof Error ? err.message : '' }));
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
            <SheetTitle>{isEdit ? t('salesProduct.editTitle') : t('salesProduct.addTitle')}</SheetTitle>
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
              <Label>{t('salesProduct.productType')}</Label>
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
                    {t('salesProduct.rollFilm')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="other" id="type-other" />
                  <Label htmlFor="type-other" className="font-normal cursor-pointer">
                    {t('salesProduct.otherProduct')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-full-name">{t('salesProduct.fullName')}</Label>
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
              <Label htmlFor="product-short-name">{t('salesProduct.shortName')}</Label>
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
              <Label>{t('salesProduct.category')}</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v);
                  markDirty();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('salesProduct.selectCategory')} />
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
              <Label htmlFor="product-description">{t('salesProduct.description')}</Label>
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
              <Label htmlFor="product-price">{t('salesProduct.priceNet')}</Label>
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
              <Label>{t('salesProduct.priceFor')}</Label>
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
                    {t('salesProduct.piece')}
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
                {t('salesProduct.excludeFromDiscount')}
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
                {t('salesProduct.hasVariants')}
              </Label>
            </div>

            {hasVariants && (
              <div className="space-y-3">
                <Label>{t('salesProduct.variants')}</Label>
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
                    <NumericInput
                      placeholder={t('salesProduct.variantPricePlaceholder')}
                      min={0.01}
                      step="0.01"
                      value={variant.priceNet ?? undefined}
                      onChange={(v) => {
                        updateVariantPrice(index, v);
                        markDirty();
                      }}
                      className="h-8 text-sm w-28"
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
                  {t('salesProduct.addVariant')}
                </Button>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t shrink-0">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t('common.saving')}
                </>
              ) : isEdit ? (
                t('salesOrder.saveChanges')
              ) : (
                t('salesProduct.addTitle')
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
