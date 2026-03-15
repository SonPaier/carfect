import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@shared/ui';
import { Label } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Input } from '@shared/ui';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@shared/ui';
import { FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  open,
  onOpenChange,
  onUpdateOffer,
  getTextareaRows,
}: ConditionsSectionProps) {
  const { t } = useTranslation();

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card>
        <CollapsibleTrigger className="w-full p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <FileText className="w-4 h-4 text-primary" />
              {t('summary.additionalConditions')}
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                open && 'rotate-180',
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="validUntil">{t('summary.validUntil')}</Label>
              <Input
                id="validUntil"
                type="date"
                value={offer.validUntil || ''}
                onChange={(e) => onUpdateOffer({ validUntil: e.target.value })}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty">{t('summary.warranty')}</Label>
              <Textarea
                id="warranty"
                value={offer.warranty || ''}
                onChange={(e) => onUpdateOffer({ warranty: e.target.value })}
                placeholder={t('summary.warrantyPlaceholder')}
                rows={getTextareaRows(offer.warranty)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">{t('summary.paymentTerms')}</Label>
              <Textarea
                id="paymentTerms"
                value={offer.paymentTerms || ''}
                onChange={(e) => onUpdateOffer({ paymentTerms: e.target.value })}
                placeholder={t('summary.paymentTermsPlaceholder')}
                rows={getTextareaRows(offer.paymentTerms)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceInfo">{t('summary.serviceInfo')}</Label>
              <Textarea
                id="serviceInfo"
                value={offer.serviceInfo || ''}
                onChange={(e) => onUpdateOffer({ serviceInfo: e.target.value })}
                placeholder={t('summary.serviceInfoPlaceholder')}
                rows={getTextareaRows(offer.serviceInfo)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('summary.notes')}</Label>
              <Textarea
                id="notes"
                value={offer.notes || ''}
                onChange={(e) => onUpdateOffer({ notes: e.target.value })}
                placeholder={t('summary.notesPlaceholder')}
                rows={getTextareaRows(offer.notes)}
                className="bg-white"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
