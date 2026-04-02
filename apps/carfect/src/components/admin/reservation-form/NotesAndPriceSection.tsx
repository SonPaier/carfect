import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@shared/ui';
import { Input } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { calculatePricePair } from '@/utils/pricing';
import type { PricingMode } from '@/hooks/usePricingMode';

interface NotesAndPriceSectionProps {
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  showPrice: boolean;
  finalPrice: string;
  setFinalPrice: (price: string) => void;
  discountedPrice: number;
  totalPrice: number;
  customerDiscountPercent: number | null;
  markUserEditing?: () => void;
  onFinalPriceUserEdit?: () => void;
  pricingMode?: PricingMode;
}

export const NotesAndPriceSection = ({
  adminNotes,
  setAdminNotes,
  showPrice,
  finalPrice,
  setFinalPrice,
  discountedPrice,
  totalPrice,
  customerDiscountPercent,
  markUserEditing,
  onFinalPriceUserEdit,
  pricingMode = 'brutto',
}: NotesAndPriceSectionProps) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  // When focused: allow empty string for editing
  // When not focused: fallback to discountedPrice if empty
  const displayedValue = isFocused
    ? finalPrice
    : (finalPrice !== '' ? finalPrice : (discountedPrice || ''));

  const priceLabel = pricingMode === 'netto' ? 'Kwota netto' : 'Kwota brutto';

  // Calculate the other price for preview
  const currentPrice = finalPrice !== '' ? parseFloat(finalPrice) : discountedPrice;
  const pair = currentPrice > 0 ? calculatePricePair(currentPrice, pricingMode) : null;
  const otherPrice = pair ? (pricingMode === 'netto' ? pair.brutto : pair.netto) : null;
  const otherLabel = pricingMode === 'netto' ? 'brutto' : 'netto';

  return (
    <>
      {/* Notes - always visible */}
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

      {/* Final Price - visible in reservation mode */}
      {showPrice && (
        <div className="space-y-2">
          <Label htmlFor="finalPrice" className="text-sm text-foreground">
            {priceLabel}
          </Label>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              id="finalPrice"
              type="number"
              value={displayedValue}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => {
                markUserEditing?.();
                onFinalPriceUserEdit?.();
                setFinalPrice(e.target.value);
              }}
              className="w-32"
              placeholder={discountedPrice > 0 ? String(discountedPrice) : '0'}
            />
            <span className="text-muted-foreground">zł</span>
            {customerDiscountPercent && customerDiscountPercent > 0 && totalPrice > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="line-through text-muted-foreground">{totalPrice} zł</span>
                <span className="text-green-600 font-medium">-{customerDiscountPercent}%</span>
              </div>
            )}
          </div>
          {otherPrice !== null && (
            <p className="text-xs text-muted-foreground">
              {otherPrice.toFixed(2)} zł {otherLabel}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default NotesAndPriceSection;
