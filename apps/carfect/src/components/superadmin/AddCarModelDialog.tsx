import React, { useState } from 'react';
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

interface AddCarModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export const AddCarModelDialog: React.FC<AddCarModelDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [size, setSize] = useState<'S' | 'M' | 'L'>('M');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand.trim() || !name.trim()) {
      toast.error(t('superAdmin.addCarModelDialog.fillAllFields'));
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('car_models')
        .insert({
          brand: brand.trim(),
          name: name.trim(),
          size,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error(t('superAdmin.addCarModelDialog.alreadyExists', { brand, name }));
        } else {
          throw error;
        }
        return;
      }

      toast.success(t('superAdmin.addCarModelDialog.addSuccess', { brand, name }));
      setBrand('');
      setName('');
      setSize('M');
      onOpenChange(false);
      await onSuccess();
    } catch (error) {
      console.error('Error adding car model:', error);
      toast.error(t('superAdmin.addCarModelDialog.addError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('superAdmin.addCarModelDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand">{t('superAdmin.addCarModelDialog.brand')}</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={t('superAdmin.addCarModelDialog.brandPlaceholder')}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{t('superAdmin.addCarModelDialog.model')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('superAdmin.addCarModelDialog.modelPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">{t('superAdmin.addCarModelDialog.size')}</Label>
            <Select value={size} onValueChange={(v: 'S' | 'M' | 'L') => setSize(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S">{t('superAdmin.addCarModelDialog.sizeSmall')}</SelectItem>
                <SelectItem value="M">{t('superAdmin.addCarModelDialog.sizeMedium')}</SelectItem>
                <SelectItem value="L">{t('superAdmin.addCarModelDialog.sizeLarge')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('superAdmin.addCarModelDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
