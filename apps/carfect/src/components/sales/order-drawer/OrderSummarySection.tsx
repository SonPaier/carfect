import { useTranslation } from 'react-i18next';
import { Label } from '@shared/ui';
import { Separator } from '@shared/ui';
import { InvoiceSummaryTable, type SummaryLine } from '@shared/invoicing';
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
  /** Uber delivery costs in brutto (user-entered) */
  uberCosts?: number[];
  totalNet: number;
  totalGross: number;
  isNetPayer?: boolean;
  paymentMethod?: 'cod' | 'transfer' | 'free' | 'cash' | 'card';
}

const VAT_RATE_PERCENT = Math.round(VAT_RATE * 100);

const getProductWidthMm = (p: OrderProduct): number => {
  const match = p.name.match(/(\d{3,4})\s*mm/);
  return match ? parseInt(match[1]) : 1524;
};

const getEffectiveQty = (p: OrderProduct): number => {
  if (p.priceUnit === 'meter') {
    if (p.rollAssignments?.length) {
      return p.rollAssignments.reduce((sum, a) => sum + a.usageM2, 0);
    }
    if (p.requiredMb) return mbToM2(p.requiredMb, getProductWidthMm(p));
  }
  return p.quantity;
};

const getUnitLabel = (p: OrderProduct): string => {
  if (p.priceUnit === 'piece') return 'szt.';
  if (p.priceUnit === 'meter') return 'm²';
  return p.priceUnit || 'szt.';
};

export const OrderSummarySection = ({
  products,
  customerDiscount,
  shippingCosts = [],
  uberCosts = [],
  paymentMethod,
}: OrderSummarySectionProps) => {
  const { t } = useTranslation();

  const lines: SummaryLine[] = products.map((p) => {
    const discount = p.discountPercent ?? (p.excludeFromDiscount ? 0 : (customerDiscount ?? 0));
    return {
      name: p.name,
      unit: getUnitLabel(p),
      quantity: getEffectiveQty(p),
      pricePerUnitNet: p.priceNet,
      discountPercent: discount,
      vatRate: VAT_RATE_PERCENT,
    };
  });

  const shippingBruttoTotal = shippingCosts.reduce((s, c) => s + c, 0);
  const uberBruttoTotal = uberCosts.reduce((s, c) => s + c, 0);

  const extraLines = [];
  if (shippingBruttoTotal > 0) {
    extraLines.push({
      label:
        shippingCosts.length === 1
          ? t('sales.orderSummary.shipping')
          : t('sales.orderSummary.shippingMultiple', { count: shippingCosts.length }),
      netValue: shippingBruttoTotal / (1 + VAT_RATE),
      vatRate: VAT_RATE_PERCENT,
    });
  }
  if (uberBruttoTotal > 0) {
    extraLines.push({
      label:
        uberCosts.length === 1
          ? t('sales.orderSummary.uber')
          : t('sales.orderSummary.uberMultiple', { count: uberCosts.length }),
      netValue: uberBruttoTotal / (1 + VAT_RATE),
      vatRate: VAT_RATE_PERCENT,
    });
  }

  const toPayLabel = paymentMethod === 'free' ? t('sales.orderSummary.free') : undefined;

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <Label>{t('sales.orderSummary.title')}</Label>
        <InvoiceSummaryTable lines={lines} extraLines={extraLines} toPayLabel={toPayLabel} />
      </div>
    </>
  );
};
