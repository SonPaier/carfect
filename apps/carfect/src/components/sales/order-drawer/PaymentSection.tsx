import { useTranslation } from 'react-i18next';
import { Label } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { RadioGroup, RadioGroupItem } from '@shared/ui';

type PaymentMethod = 'cod' | 'transfer' | 'free' | 'cash' | 'card';

export interface BankAccount {
  name: string;
  number: string;
}

const formatIBAN = (value: string): string => {
  const clean = value.replace(/\s/g, '');
  // Polish format: XX XXXX XXXX XXXX XXXX XXXX XXXX (26 digits)
  return clean.replace(/(.{2})(.{4})(.{4})(.{4})(.{4})(.{4})(.{4})/, '$1 $2 $3 $4 $5 $6 $7').trim();
};

interface PaymentSectionProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  bankAccountNumber: string;
  setBankAccountNumber: (v: string) => void;
  bankAccounts: BankAccount[];
  isNetPayer: boolean;
  setIsNetPayer: (v: boolean) => void;
}

export const PaymentSection = ({
  paymentMethod,
  setPaymentMethod,
  bankAccountNumber,
  setBankAccountNumber,
  bankAccounts,
  isNetPayer,
  setIsNetPayer,
}: PaymentSectionProps) => {
  const { t } = useTranslation();
  const selectedAccount = bankAccounts.find((a) => a.number === bankAccountNumber);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('payment.method')}</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cod">{t('payment.cod')}</SelectItem>
              <SelectItem value="transfer">{t('payment.transfer')}</SelectItem>
              <SelectItem value="cash">{t('payment.cash')}</SelectItem>
              <SelectItem value="card">{t('payment.card')}</SelectItem>
              <SelectItem value="free">{t('payment.free')}</SelectItem>
              <SelectItem value="tab">{t('payment.tab')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('payment.payer')}</Label>
          <RadioGroup
            value={isNetPayer ? 'netto' : 'brutto'}
            onValueChange={(v) => setIsNetPayer(v === 'netto')}
            className="flex gap-4 pt-1"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="brutto" id="payer-brutto" />
              <Label htmlFor="payer-brutto" className="font-normal cursor-pointer">
                {t('payment.brutto')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="netto" id="payer-netto" />
              <Label htmlFor="payer-netto" className="font-normal cursor-pointer">
                {t('payment.netto')}
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {bankAccounts.length > 0 && (
        <div className="space-y-2">
          <Label>{t('payment.accountNumber')}</Label>
          <Select value={bankAccountNumber || undefined} onValueChange={setBankAccountNumber}>
            <SelectTrigger>
              <SelectValue placeholder={t('payment.selectAccount')}>
                {selectedAccount && (
                  <span className="truncate">
                    {selectedAccount.name
                      ? selectedAccount.name
                      : formatIBAN(selectedAccount.number)}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((account, idx) => (
                <SelectItem key={idx} value={account.number}>
                  <div>
                    {account.name && <span className="font-medium">{account.name} · </span>}
                    <span className="font-mono text-xs">{formatIBAN(account.number)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
