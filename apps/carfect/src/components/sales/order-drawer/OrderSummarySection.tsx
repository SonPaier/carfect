import { Label } from '@shared/ui';
import { Separator } from '@shared/ui';
import { formatCurrency } from '../constants';
import { VAT_RATE } from '../constants';
import type { OrderProduct } from '../hooks/useOrderPackages';

interface OrderSummarySectionProps {
  products: OrderProduct[];
  subtotalNet: number;
  discountAmount: number;
  customerDiscount: number;
  /** Shipping costs in brutto (from Apaczka) */
  shippingCosts?: number[];
  totalNet: number;
  totalGross: number;
  isNetPayer?: boolean;
}

export const OrderSummarySection = ({
  products,
  customerDiscount,
  shippingCosts = [],
  totalNet,
  totalGross,
  isNetPayer = false,
}: OrderSummarySectionProps) => {
  const vatAmount = totalNet * VAT_RATE;

  const getEffectiveQty = (p: OrderProduct) => {
    if (p.priceUnit === 'meter' && p.rollAssignments?.length) {
      return p.rollAssignments.reduce((sum, a) => sum + a.usageM2, 0);
    }
    return p.quantity;
  };

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <Label>Podsumowanie</Label>

        <div className="bg-card border border-border rounded-md p-3 space-y-1.5 text-sm">
          {/* Individual products with their discounts */}
          {products.map((p, i) => {
            const qty = getEffectiveQty(p);
            const lineNet = p.priceNet * qty;
            const discount =
              p.discountPercent ?? (p.excludeFromDiscount ? 0 : (customerDiscount ?? 0));
            const lineNetAfterDiscount = lineNet * (1 - discount / 100);
            const unit =
              p.priceUnit === 'piece'
                ? 'szt.'
                : p.priceUnit === 'meter'
                  ? 'm²'
                  : p.priceUnit || 'szt.';
            return (
              <div key={i}>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate">
                    {p.name} ({qty} {unit} × {formatCurrency(p.priceNet)})
                  </span>
                  <span className="tabular-nums shrink-0">{formatCurrency(lineNet)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between gap-2 text-destructive">
                    <span className="text-xs pl-2">Rabat {discount}%</span>
                    <span className="tabular-nums text-xs shrink-0">
                      -{formatCurrency(lineNet - lineNetAfterDiscount)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Shipping */}
          {shippingCosts.map((cost, i) => (
            <div key={`ship-${i}`} className="flex justify-between">
              <span className="text-muted-foreground">
                {shippingCosts.length === 1 ? 'Wysyłka' : `Wysyłka #${i + 1}`} (netto)
              </span>
              <span className="tabular-nums">{formatCurrency(cost / (1 + VAT_RATE))}</span>
            </div>
          ))}

          <Separator className="my-1" />

          {/* Totals */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Razem netto</span>
            <span className="tabular-nums font-medium">{formatCurrency(totalNet)}</span>
          </div>
          {!isNetPayer && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (23%)</span>
                <span className="tabular-nums">{formatCurrency(vatAmount)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Razem brutto</span>
                <span className="tabular-nums">{formatCurrency(totalGross)}</span>
              </div>
            </>
          )}
          {isNetPayer && (
            <div className="flex justify-between font-semibold text-lg">
              <span>Do zapłaty (netto)</span>
              <span className="tabular-nums">{formatCurrency(totalNet)}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
