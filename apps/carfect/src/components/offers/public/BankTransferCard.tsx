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
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => {
            navigator.clipboard.writeText(text);
            toast.success('Skopiowano');
          }}
          className="p-1 hover:bg-hover rounded transition-colors"
        >
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Kopiuj</TooltipContent>
    </Tooltip>
  );
}

export function BankTransferCard({ instance, vehicleModel, offerNumber }: BankTransferCardProps) {
  if (!instance.offer_bank_account_number && !instance.offer_bank_company_name) return null;

  const transferTitle = `Usługa ${vehicleModel || ''}, oferta ${offerNumber}`.trim();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Dane do płatności
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {/* Company name */}
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Nazwa firmy:{' '}
            <span className="font-medium">{instance.offer_bank_company_name || instance.name}</span>
          </p>
          <CopyButton text={instance.offer_bank_company_name || instance.name || ''} />
        </div>

        {/* Account number */}
        {instance.offer_bank_account_number && (
          <div className="flex items-center justify-between">
            <p className="text-sm">
              Numer konta:{' '}
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
              Adres: <span className="font-medium">{instance.address}</span>
            </p>
            <CopyButton text={instance.address} />
          </div>
        )}

        {/* Transfer title */}
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Tytuł przelewu: <span className="font-medium">{transferTitle}</span>
          </p>
          <CopyButton text={transferTitle} />
        </div>
      </CardContent>
    </Card>
  );
}
