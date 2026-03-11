import { Label } from '@shared/ui';
import { Switch } from '@shared/ui';
import { Separator } from '@shared/ui';
import { formatCurrency } from '../constants';

interface OrderSummarySectionProps {
  subtotalNet: number;
  discountAmount: number;
  customerDiscount: number;
  totalNet: number;
  totalGross: number;
  applyDiscount: boolean;
  setApplyDiscount: (v: boolean) => void;
  showDiscount: boolean;
}

export const OrderSummarySection = ({
  subtotalNet,
  discountAmount,
  customerDiscount,
  totalNet,
  totalGross,
  applyDiscount,
  setApplyDiscount,
  showDiscount,
}: OrderSummarySectionProps) => {
  return (
    <>
      <Separator />
      <div className="space-y-3">
        <Label>Podsumowanie</Label>

        {showDiscount && (
          <div className="flex items-center justify-between bg-muted/20 border border-border rounded-md px-3 py-2">
            <span className="text-sm">Rabat: {customerDiscount}%</span>
            <div className="flex items-center gap-2">
              <Label htmlFor="apply-discount" className="text-xs text-muted-foreground font-normal">
                Zastosuj
              </Label>
              <Switch
                id="apply-discount"
                checked={applyDiscount}
                onCheckedChange={setApplyDiscount}
              />
            </div>
          </div>
        )}

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
