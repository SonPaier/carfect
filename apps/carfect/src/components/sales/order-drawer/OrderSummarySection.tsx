import { Label } from '@shared/ui';
import { Separator } from '@shared/ui';
import { formatCurrency } from '../constants';
import { VAT_RATE } from '../constants';
import { mbToM2 } from '../types/rolls';
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
  paymentMethod?: 'cod' | 'transfer' | 'free';
}

export const OrderSummarySection = ({
  products,
  customerDiscount,
  shippingCosts = [],
  totalNet,
  totalGross,
  isNetPayer = false,
  paymentMethod,
}: OrderSummarySectionProps) => {
  const vatAmount = totalNet * VAT_RATE;

  const getProductWidthMm = (p: OrderProduct): number => {
    const match = p.name.match(/(\d{3,4})\s*mm/);
    return match ? parseInt(match[1]) : 1524;
  };

  const getEffectiveQty = (p: OrderProduct) => {
    if (p.priceUnit === 'meter') {
      if (p.rollAssignments?.length) {
        return p.rollAssignments.reduce((sum, a) => sum + a.usageM2, 0);
      }
      if (p.requiredMb) return mbToM2(p.requiredMb, getProductWidthMm(p));
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

          {/* Shipping — always shown as brutto */}
          {shippingCosts.map((cost, i) => (
            <div key={`ship-${i}`} className="flex justify-between">
              <span className="text-muted-foreground">
                {shippingCosts.length === 1 ? 'Wysyłka' : `Wysyłka #${i + 1}`} (brutto)
              </span>
              <span className="tabular-nums">{formatCurrency(cost)}</span>
            </div>
          ))}

          <Separator className="my-1" />

          {/* Totals */}
          {isNetPayer ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Razem netto</span>
                <span className="tabular-nums font-medium">
                  {formatCurrency(totalGross - shippingCosts.reduce((s, c) => s + c, 0))}
                </span>
              </div>
              {shippingCosts.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wysyłka (brutto)</span>
                  <span className="tabular-nums">
                    {formatCurrency(shippingCosts.reduce((s, c) => s + c, 0))}
                  </span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Do zapłaty</span>
                <span className="tabular-nums">
                  {paymentMethod === 'free' ? 'Bezpłatne' : formatCurrency(totalGross)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Razem netto</span>
                <span className="tabular-nums font-medium">{formatCurrency(totalNet)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (23%)</span>
                <span className="tabular-nums">{formatCurrency(vatAmount)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Razem brutto</span>
                <span className="tabular-nums">
                  {paymentMethod === 'free' ? 'Bezpłatne' : formatCurrency(totalGross)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
