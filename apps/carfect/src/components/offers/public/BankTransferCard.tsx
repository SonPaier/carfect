import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@shared/ui';
import { CreditCard, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface BankTransferCardProps {
  instance: {
    name?: string;
    address?: string;
    offer_bank_company_name?: string;
    offer_bank_account_number?: string;
    offer_bank_name?: string;
  };
  vehicleModel?: string;
  offerNumber: string;
}

function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => {
            navigator.clipboard.writeText(text);
            toast.success(t('publicOffer.bank.copied'));
          }}
          className="p-1 hover:bg-hover rounded transition-colors"
        >
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{t('publicOffer.bank.copy')}</TooltipContent>
    </Tooltip>
  );
}

export function BankTransferCard({ instance, vehicleModel, offerNumber }: BankTransferCardProps) {
  const { t } = useTranslation();
  if (!instance.offer_bank_account_number) return null;

  const transferTitle = t('publicOffer.bank.transferTitleValue', {
    vehicle: vehicleModel || '',
    offerNumber,
  }).trim();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          {t('publicOffer.bank.paymentDetails')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {/* Company name */}
        <div className="flex items-center justify-between">
          <p className="text-sm">
            {t('publicOffer.bank.companyName')}:{' '}
            <span className="font-medium">{instance.offer_bank_company_name || instance.name}</span>
          </p>
          <CopyButton text={instance.offer_bank_company_name || instance.name || ''} />
        </div>

        {/* Account number */}
        {instance.offer_bank_account_number && (
          <div className="flex items-center justify-between">
            <p className="text-sm">
              {t('publicOffer.bank.accountNumber')}:{' '}
              {instance.offer_bank_name && (
                <span className="text-muted-foreground">{instance.offer_bank_name} </span>
              )}
              <span className="font-mono">{instance.offer_bank_account_number}</span>
            </p>
            <CopyButton text={instance.offer_bank_account_number} />
          </div>
        )}

        {/* Address */}
        {instance.address && (
          <div className="flex items-center justify-between">
            <p className="text-sm">
              {t('publicOffer.bank.address')}:{' '}
              <span className="font-medium">{instance.address}</span>
            </p>
            <CopyButton text={instance.address} />
          </div>
        )}

        {/* Transfer title */}
        <div className="flex items-center justify-between">
          <p className="text-sm">
            {t('publicOffer.bank.transferTitle')}:{' '}
            <span className="font-medium">{transferTitle}</span>
          </p>
          <CopyButton text={transferTitle} />
        </div>
      </CardContent>
    </Card>
  );
}
