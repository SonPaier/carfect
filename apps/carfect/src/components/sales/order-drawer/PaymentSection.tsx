import { Label } from '@shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui';

type PaymentMethod = 'cod' | 'transfer';

interface PaymentSectionProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  bankAccountNumber: string;
  setBankAccountNumber: (v: string) => void;
  bankAccounts: string[];
}

export const PaymentSection = ({
  paymentMethod,
  setPaymentMethod,
  bankAccountNumber,
  setBankAccountNumber,
  bankAccounts,
}: PaymentSectionProps) => {
  return (
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
          </SelectContent>
        </Select>
      </div>

      {bankAccounts.length > 0 && (
        <div className="space-y-2">
          <Label>Numer konta</Label>
          <Select
            value={bankAccountNumber || undefined}
            onValueChange={setBankAccountNumber}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz konto" />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((account, idx) => (
                <SelectItem key={idx} value={account}>
                  {account}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
