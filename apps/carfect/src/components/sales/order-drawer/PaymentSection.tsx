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
  const selectedAccount = bankAccounts.find((a) => a.number === bankAccountNumber);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sposób płatności</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cod">Za pobraniem</SelectItem>
              <SelectItem value="transfer">Przelew</SelectItem>
              <SelectItem value="cash">Gotówka</SelectItem>
              <SelectItem value="card">Karta płatnicza</SelectItem>
              <SelectItem value="free">Bezpłatne</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Płatnik</Label>
          <RadioGroup
            value={isNetPayer ? 'netto' : 'brutto'}
            onValueChange={(v) => setIsNetPayer(v === 'netto')}
            className="flex gap-4 pt-1"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="brutto" id="payer-brutto" />
              <Label htmlFor="payer-brutto" className="font-normal cursor-pointer">
                Brutto
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="netto" id="payer-netto" />
              <Label htmlFor="payer-netto" className="font-normal cursor-pointer">
                Netto
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {bankAccounts.length > 0 && (
        <div className="space-y-2">
          <Label>Numer konta</Label>
          <Select value={bankAccountNumber || undefined} onValueChange={setBankAccountNumber}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz konto">
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
