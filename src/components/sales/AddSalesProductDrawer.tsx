import { useState, useEffect } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SalesProductVariant {
  id?: string;
  name: string;
  priceNet: number;
  sortOrder: number;
}

interface SalesProductData {
  id: string;
  fullName: string;
  shortName: string;
  description?: string;
  priceNet: number;
  priceUnit: string;
  categoryId?: string | null;
  hasVariants?: boolean;
  variants?: SalesProductVariant[];
}

interface AddSalesProductDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  onSaved?: () => void;
  product?: SalesProductData | null;
}

const AddSalesProductDrawer = ({ open, onOpenChange, instanceId, onSaved, product }: AddSalesProductDrawerProps) => {
  const isEdit = !!product;
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [priceNet, setPriceNet] = useState('');
  const [priceUnit, setPriceUnit] = useState<'piece' | 'meter'>('piece');
  const [categoryId, setCategoryId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
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
    setPriceNet('');
    setPriceUnit('piece');
    setCategoryId('');
    setHasVariants(false);
    setVariants([]);
  };

  useEffect(() => {
    if (!open) return;
    if (product) {
      setFullName(product.fullName);
      setShortName(product.shortName);
      setDescription(product.description || '');
      setPriceNet(product.priceNet ? String(product.priceNet) : '');
      setPriceUnit((product.priceUnit as 'piece' | 'meter') || 'piece');
      setCategoryId(product.categoryId || '');
      setHasVariants(product.hasVariants || false);
      if (product.hasVariants && product.id) {
        (supabase
          .from('sales_product_variants')
          .select('id, name, price_net, sort_order')
          .eq('product_id', product.id)
          .order('sort_order') as any)
          .then(({ data }: any) => {
            setVariants((data || []).map((v: any) => ({
              id: v.id,
              name: v.name,
              priceNet: Number(v.price_net),
              sortOrder: v.sort_order,
            })));
          });
      } else {
        setVariants([]);
      }
    } else {
      resetForm();
    }
  }, [open, product]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const addVariant = () => {
    setVariants(prev => [...prev, { name: '', priceNet: 0, sortOrder: prev.length }]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: 'name' | 'priceNet', value: string | number) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
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
    if (hasVariants && variants.some(v => !v.name.trim())) {
      toast.error('Uzupełnij nazwy wariantów');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        short_name: shortName.trim(),
        description: description.trim() || null,
        price_net: hasVariants ? 0 : (parseFloat(priceNet) || 0),
        price_unit: priceUnit,
        category_id: categoryId || null,
        has_variants: hasVariants,
      };

      let productId: string;

      if (isEdit && product) {
        const { error } = await (supabase
          .from('sales_products')
          .update(payload)
          .eq('id', product.id) as any);
        if (error) throw error;
        productId = product.id;
      } else {
        const { data: insertedProduct, error } = await (supabase
          .from('sales_products')
          .insert({ instance_id: instanceId, ...payload })
          .select('id')
          .single() as any);
        if (error) throw error;
        productId = insertedProduct.id;
      }

      // Handle variants
      await (supabase
        .from('sales_product_variants')
        .delete()
        .eq('product_id', productId) as any);

      if (hasVariants && variants.length > 0) {
        const variantPayload = variants.map((v, idx) => ({
          product_id: productId,
          name: v.name.trim(),
          price_net: v.priceNet || 0,
          sort_order: idx,
        }));
        const { error: vError } = await (supabase
          .from('sales_product_variants')
          .insert(variantPayload) as any);
        if (vError) throw vError;
      }

      toast.success(isEdit ? 'Produkt zaktualizowany' : 'Produkt został dodany');
      resetForm();
      handleClose();
      onSaved?.();
    } catch (err: any) {
      toast.error('Błąd: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
          onOpenChange(false);
        }
      }}
      modal={false}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[27rem] flex flex-col h-full p-0 gap-0 shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.15)] bg-white [&_input]:border-foreground/60 [&_textarea]:border-foreground/60 [&_select]:border-foreground/60"
        hideOverlay
        hideCloseButton
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
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
              <Label htmlFor="product-full-name">Pełna nazwa produktu</Label>
              <Input
                id="product-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-short-name">Skrócona nazwa produktu</Label>
              <Input
                id="product-short-name"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
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
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="has-variants"
                checked={hasVariants}
                onCheckedChange={(v) => setHasVariants(v === true)}
              />
              <Label htmlFor="has-variants" className="text-sm font-normal cursor-pointer">
                Produkt posiada warianty
              </Label>
            </div>

            {hasVariants ? (
              <div className="space-y-3">
                <Label>Warianty</Label>
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-center gap-2 border border-border rounded-md p-2 bg-muted/20">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Nazwa wariantu"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Cena netto"
                        value={variant.priceNet || ''}
                        onChange={(e) => updateVariant(index, 'priceNet', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
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
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="product-price">Cena netto</Label>
                  <Input
                    id="product-price"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={priceNet}
                    onChange={(e) => setPriceNet(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cena za</Label>
                  <RadioGroup
                    value={priceUnit}
                    onValueChange={(v) => setPriceUnit(v as 'piece' | 'meter')}
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
              </>
            )}
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t shrink-0">
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Anuluj
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Zapisuję...</> : isEdit ? 'Zapisz zmiany' : 'Dodaj produkt'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AddSalesProductDrawer;
