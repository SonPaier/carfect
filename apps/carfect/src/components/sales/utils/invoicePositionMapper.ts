import type { SalesOrderProduct } from '@/data/salesMockData';

export interface InvoicePosition {
  name: string;
  quantity: number;
  unit_price_gross: number;
  vat_rate: number;
  unit: string;
  discount: number;
}

/**
 * Maps a SalesOrderProduct to an invoice position.
 *
 * For 'other' products with meter unit (e.g. Wycinanie formatek), uses
 * requiredMb as the invoice quantity instead of the raw quantity field,
 * because requiredMb reflects the actual material consumed in m2.
 */
export function mapProductToInvoicePosition(
  product: SalesOrderProduct,
  customerDiscount?: number,
): InvoicePosition {
  return {
    name: product.name,
    quantity:
      product.productType === 'other' && product.unit === 'meter' && product.requiredMb != null && product.requiredMb > 0
        ? product.requiredMb
        : product.quantity,
    unit_price_gross: product.priceNet,
    vat_rate: 23,
    unit:
      product.unit === 'meter' ? 'm2' : product.unit === 'piece' ? 'szt.' : product.unit || 'szt.',
    discount: product.discountPercent ?? customerDiscount ?? 0,
  };
}
