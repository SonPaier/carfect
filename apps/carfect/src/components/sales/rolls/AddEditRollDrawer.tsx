import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@shared/ui';
import { Input, Button, Label, Textarea } from '@shared/ui';
import { toast } from 'sonner';
import type { SalesRoll } from '../types/rolls';
import { createRoll, updateRoll, uploadRollPhoto } from '../services/rollService';

interface AddEditRollDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string | null;
  roll?: SalesRoll | null;
  onSaved?: () => void;
}

const AddEditRollDrawer = ({
  open,
  onOpenChange,
  instanceId,
  roll,
  onSaved,
}: AddEditRollDrawerProps) => {
  const isEdit = !!roll;

  const [brand, setBrand] = useState('ULTRAFIT');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [productCode, setProductCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [widthMm, setWidthMm] = useState<number | ''>('');
  const [lengthM, setLengthM] = useState<number | ''>('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && roll) {
      setBrand(roll.brand);
      setProductName(roll.productName);
      setDescription(roll.description || '');
      setProductCode(roll.productCode || '');
      setBarcode(roll.barcode || '');
      setWidthMm(roll.widthMm);
      setLengthM(roll.lengthM);
      setDeliveryDate(roll.deliveryDate || '');
      setPhotoUrl(roll.photoUrl || '');
      setPhotoFile(null);
      setPhotoPreview(roll.photoUrl || null);
    } else if (open && !roll) {
      setBrand('ULTRAFIT');
      setProductName('');
      setDescription('');
      setProductCode('');
      setBarcode('');
      setWidthMm('');
      setLengthM('');
      setDeliveryDate('');
      setPhotoUrl('');
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }, [open, roll]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!instanceId) return;
    if (!productName.trim()) {
      toast.error('Nazwa produktu jest wymagana');
      return;
    }
    if (!widthMm || widthMm <= 0) {
      toast.error('Szerokość musi być większa od 0');
      return;
    }
    if (!lengthM || lengthM <= 0) {
      toast.error('Długość musi być większa od 0');
      return;
    }

    setSaving(true);
    try {
      let finalPhotoUrl = photoUrl;

      // Upload new photo if selected
      if (photoFile) {
        finalPhotoUrl = await uploadRollPhoto(photoFile, instanceId);
      }

      if (isEdit && roll) {
        await updateRoll(roll.id, {
          brand: brand.trim(),
          productName: productName.trim(),
          description: description.trim() || undefined,
          productCode: productCode.trim() || undefined,
          barcode: barcode.replace(/\s+/g, '').trim() || undefined,
          widthMm: Number(widthMm),
          lengthM: Number(lengthM),
          deliveryDate: deliveryDate || undefined,
          photoUrl: finalPhotoUrl || undefined,
        });
        toast.success('Rolka zaktualizowana');
      } else {
        await createRoll({
          instanceId,
          brand: brand.trim(),
          productName: productName.trim(),
          description: description.trim() || undefined,
          productCode: productCode.trim() || undefined,
          barcode: barcode.replace(/\s+/g, '').trim() || undefined,
          widthMm: Number(widthMm),
          lengthM: Number(lengthM),
          deliveryDate: deliveryDate || undefined,
          photoUrl: finalPhotoUrl || undefined,
        });
        toast.success('Rolka dodana');
      }

      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      toast.error('Błąd: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col"
        hideCloseButton
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
          <SheetTitle>{isEdit ? 'Edytuj rolkę' : 'Dodaj rolkę'}</SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Brand */}
          <div className="space-y-1.5">
            <Label>Marka / Producent</Label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="np. ULTRAFIT"
            />
          </div>

          {/* Product Name */}
          <div className="space-y-1.5">
            <Label>Nazwa produktu *</Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="np. XP CRYSTAL"
            />
            <p className="text-xs text-muted-foreground">
              Musi odpowiadać nazwie produktu w katalogu, aby działał autocomplete w zamówieniach
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Opis</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Paint Protection Film"
              rows={2}
            />
          </div>

          {/* Product Code */}
          <div className="space-y-1.5">
            <Label>Kod produktu</Label>
            <Input
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="np. PXCR-6015-UH44-6709"
              className="font-mono"
            />
          </div>

          {/* Barcode */}
          <div className="space-y-1.5">
            <Label>Kod kreskowy</Label>
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="np. 8801990000153"
              className="font-mono"
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Szerokość (mm) *</Label>
              <Input
                type="number"
                value={widthMm}
                onChange={(e) => setWidthMm(e.target.value ? Number(e.target.value) : '')}
                placeholder="np. 1524"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Długość (m) *</Label>
              <Input
                type="number"
                value={lengthM}
                onChange={(e) => setLengthM(e.target.value ? Number(e.target.value) : '')}
                placeholder="np. 15"
                min={0}
                step={0.1}
              />
            </div>
          </div>

          {/* Delivery date */}
          <div className="space-y-1.5">
            <Label>Data dostawy</Label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>

          {/* Photo */}
          <div className="space-y-1.5">
            <Label>Zdjęcie etykiety</Label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
            {photoPreview && (
              <div className="mt-2 relative w-32 h-32">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg border"
                />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setPhotoUrl('');
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="border-t pt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Zapisz zmiany' : 'Dodaj rolkę'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AddEditRollDrawer;
