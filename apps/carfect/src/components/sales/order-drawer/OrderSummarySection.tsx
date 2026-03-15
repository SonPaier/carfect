import { Label } from '@shared/ui';
import { Separator } from '@shared/ui';
import { formatCurrency } from '../constants';

interface OrderSummarySectionProps {
  subtotalNet: number;
  discountAmount: number;
  customerDiscount: number;
  totalNet: number;
  totalGross: number;
}

export const OrderSummarySection = ({
  subtotalNet,
  discountAmount,
  customerDiscount,
  totalNet,
  totalGross,
}: OrderSummarySectionProps) => {
  return (
    <>
      <Separator />
      <div className="space-y-3">
        <Label>Podsumowanie</Label>

        <div className="bg-card border border-border rounded-md p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Suma netto</span>
            <span className="tabular-nums">{formatCurrency(subtotalNet)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Rabat ({customerDiscount}%)</span>
              <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Netto po rabacie</span>
              <span className="tabular-nums font-medium">{formatCurrency(totalNet)}</span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="flex justify-between font-semibold">
            <span>Brutto (23% VAT)</span>
            <span className="tabular-nums">{formatCurrency(totalGross)}</span>
          </div>
        </div>
      </div>
    </>
  );
};
