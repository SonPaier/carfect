import { useTranslation } from 'react-i18next';
import { Label } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Input } from '@shared/ui';
import type { OfferState } from '@/hooks/useOffer';

interface ConditionsSectionProps {
  offer: OfferState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateOffer: (data: Partial<OfferState>) => void;
  getTextareaRows: (value: string | undefined | null, minRows?: number) => number;
}

export function ConditionsSection({
  offer,
  onUpdateOffer,
  getTextareaRows,
}: ConditionsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="validUntil">{t('summary.validUntil')}</Label>
        <Input
          id="validUntil"
          type="date"
          value={offer.validUntil || ''}
          onChange={(e) => onUpdateOffer({ validUntil: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="warranty">{t('summary.warranty')}</Label>
        <Textarea
          id="warranty"
          value={offer.warranty || ''}
          onChange={(e) => onUpdateOffer({ warranty: e.target.value })}
          rows={getTextareaRows(offer.warranty)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentTerms">{t('summary.paymentTerms')}</Label>
        <Textarea
          id="paymentTerms"
          value={offer.paymentTerms || ''}
          onChange={(e) => onUpdateOffer({ paymentTerms: e.target.value })}
          rows={getTextareaRows(offer.paymentTerms)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="serviceInfo">{t('summary.serviceInfo')}</Label>
        <Textarea
          id="serviceInfo"
          value={offer.serviceInfo || ''}
          onChange={(e) => onUpdateOffer({ serviceInfo: e.target.value })}
          rows={getTextareaRows(offer.serviceInfo)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('summary.notes')}</Label>
        <Textarea
          id="notes"
          value={offer.notes || ''}
          onChange={(e) => onUpdateOffer({ notes: e.target.value })}
          rows={getTextareaRows(offer.notes)}
        />
      </div>
    </div>
  );
}
