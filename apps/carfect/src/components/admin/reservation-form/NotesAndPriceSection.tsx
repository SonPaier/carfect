import { useTranslation } from 'react-i18next';
import { Label } from '@shared/ui';
import { Textarea } from '@shared/ui';

interface NotesAndPriceSectionProps {
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  markUserEditing?: () => void;
  // Keep unused props for backward compat — callers still pass them
  showPrice?: boolean;
  finalPrice?: string;
  setFinalPrice?: (price: string) => void;
  discountedPrice?: number;
  totalPrice?: number;
  customerDiscountPercent?: number | null;
  onFinalPriceUserEdit?: () => void;
  pricingMode?: string;
}

export const NotesAndPriceSection = ({
  adminNotes,
  setAdminNotes,
  markUserEditing,
}: NotesAndPriceSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Label htmlFor="adminNotes" className="text-sm text-foreground">
        {t('addReservation.notes')}
      </Label>
      <Textarea
        id="adminNotes"
        value={adminNotes}
        onChange={(e) => {
          markUserEditing?.();
          setAdminNotes(e.target.value);
        }}
        rows={2}
        placeholder=""
      />
    </div>
  );
};

export default NotesAndPriceSection;
