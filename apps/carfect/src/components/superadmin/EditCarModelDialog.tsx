import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/ui';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EditCarModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: {
    id: string;
    brand: string;
    name: string;
    size: string;
  };
  onSuccess: () => Promise<void>;
}

export const EditCarModelDialog: React.FC<EditCarModelDialogProps> = ({
  open,
  onOpenChange,
  model,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [brand, setBrand] = useState(model.brand);
  const [name, setName] = useState(model.name);
  const [size, setSize] = useState<'S' | 'M' | 'L'>(model.size as 'S' | 'M' | 'L');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setBrand(model.brand);
    setName(model.name);
    setSize(model.size as 'S' | 'M' | 'L');
  }, [model]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand.trim() || !name.trim()) {
      toast.error(t('superAdmin.editCarModelDialog.fillAllFields'));
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('car_models')
        .update({
          brand: brand.trim(),
          name: name.trim(),
          size,
          updated_at: new Date().toISOString(),
        })
        .eq('id', model.id);

      if (error) {
        if (error.code === '23505') {
          toast.error(t('superAdmin.editCarModelDialog.alreadyExists', { brand, name }));
        } else {
          throw error;
        }
        return;
      }

      toast.success(t('superAdmin.editCarModelDialog.updateSuccess', { brand, name }));
      onOpenChange(false);
      await onSuccess();
    } catch (error) {
      console.error('Error updating car model:', error);
      toast.error(t('superAdmin.editCarModelDialog.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('superAdmin.editCarModelDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand">{t('superAdmin.editCarModelDialog.brand')}</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={t('superAdmin.editCarModelDialog.brandPlaceholder')}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{t('superAdmin.editCarModelDialog.model')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('superAdmin.editCarModelDialog.modelPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">{t('superAdmin.editCarModelDialog.size')}</Label>
            <Select value={size} onValueChange={(v: 'S' | 'M' | 'L') => setSize(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S">{t('superAdmin.editCarModelDialog.sizeSmall')}</SelectItem>
                <SelectItem value="M">{t('superAdmin.editCarModelDialog.sizeMedium')}</SelectItem>
                <SelectItem value="L">{t('superAdmin.editCarModelDialog.sizeLarge')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('superAdmin.editCarModelDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
