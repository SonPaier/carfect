import { useTranslation } from 'react-i18next';
import { Label } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Input } from '@shared/ui';
import type { OfferState } from '@/hooks/useOffer';
import { useConditionTemplates, type TemplateType } from '@/hooks/useConditionTemplates';
import { TemplatePicker } from './TemplatePicker';

interface ConditionsSectionProps {
  offer: OfferState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateOffer: (data: Partial<OfferState>) => void;
  getTextareaRows: (value: string | undefined | null, minRows?: number) => number;
  instanceId?: string | null;
}

/** Maps template_type → offer state key */
const TYPE_TO_KEY: Record<TemplateType, keyof OfferState> = {
  warranty: 'warranty',
  payment_terms: 'paymentTerms',
  service_info: 'serviceInfo',
  notes: 'notes',
};

export function ConditionsSection({
  offer,
  onUpdateOffer,
  getTextareaRows,
  instanceId,
}: ConditionsSectionProps) {
  const { t } = useTranslation();
  const { byType } = useConditionTemplates(instanceId ?? null);

  const renderField = (
    id: string,
    label: string,
    offerKey: keyof OfferState,
    templateType: TemplateType,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <TemplatePicker
          templates={byType(templateType)}
          onSelect={(content) => onUpdateOffer({ [offerKey]: content })}
        />
      </div>
      <Textarea
        id={id}
        value={(offer[offerKey] as string) || ''}
        onChange={(e) => onUpdateOffer({ [offerKey]: e.target.value })}
        rows={getTextareaRows((offer[offerKey] as string) || '')}
      />
    </div>
  );

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

      {renderField('warranty', t('summary.warranty'), 'warranty', 'warranty')}
      {renderField('paymentTerms', t('summary.paymentTerms'), 'paymentTerms', 'payment_terms')}
      {renderField('serviceInfo', t('summary.serviceInfo'), 'serviceInfo', 'service_info')}
      {renderField('notes', t('summary.notes'), 'notes', 'notes')}
    </div>
  );
}
