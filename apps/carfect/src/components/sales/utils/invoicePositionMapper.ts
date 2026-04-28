import type { SalesOrderProduct } from '@/data/salesMockData';
import { VAT_RATE } from '../constants';
import { mbToM2 } from '../types/rolls';

export interface InvoicePosition {
  name: string;
  quantity: number;
  unit_price_gross: number;
  vat_rate: number;
  unit: string;
  discount: number;
}

function extractWidthMm(name: string): number | null {
  const m = name.match(/(\d{3,4})\s*mm/);
  return m ? parseInt(m[1]) : null;
}

function resolveQuantity(product: MappableProduct, rawUnit: string | undefined): number {
  if (rawUnit !== 'meter') return product.quantity;

  // 'other' meter products (e.g. Wycinanie formatek): requiredMb is already the
  // billed quantity in m, no width conversion.
  if (product.productType === 'other') {
    return product.requiredMb && product.requiredMb > 0 ? product.requiredMb : product.quantity;
  }

  // 'roll' meter products: invoice is billed in m², so convert from
  // assignments (preferred) or requiredMb. Raw quantity is always 1 for
  // freshly-added roll items and would misreport on the invoice.
  if (product.productType === 'roll') {
    const rollAssignments = product.rollAssignments;
    if (rollAssignments && rollAssignments.length > 0) {
      return rollAssignments.reduce((sum, a) => sum + (a.usageM2 || 0), 0);
    }
    if (product.requiredMb && product.requiredMb > 0) {
      const widthMm = extractWidthMm(product.name);
      if (widthMm == null) {
        throw new Error(
          `Brak szerokości w nazwie produktu "${product.name}". Wymagany format: "... 1524mm" lub przypisz rolki.`,
        );
      }
      return mbToM2(product.requiredMb, widthMm);
    }
  }

  // Legacy / undefined productType: keep original behavior (raw quantity).
  return product.quantity;
}

/**
 * Convert a brutto (gross) shipping/Uber cost into an invoice position line item.
 * Used for both Apaczka shipping (auto-fetched brutto) and Uber (user-entered brutto).
 */
export function bruttoCostToInvoicePosition(bruttoAmount: number, name: string): InvoicePosition {
  return {
    name,
    quantity: 1,
    unit_price_gross: Math.round((bruttoAmount / (1 + VAT_RATE)) * 100) / 100,
    vat_rate: Math.round(VAT_RATE * 100),
    unit: 'szt.',
    discount: 0,
  };
}

/**
 * Accepts both SalesOrderProduct (uses `unit`) and the order-drawer's OrderProduct
 * (uses `priceUnit`) — they share most fields but differ on the unit field name.
 * In-edit OrderProducts also carry rollAssignments, which determine effective qty.
 */
type MappableProduct = Omit<SalesOrderProduct, 'unit'> & {
  unit?: string;
  priceUnit?: string;
  rollAssignments?: { usageM2: number; widthMm?: number }[];
};

/**
 * Maps a product to an invoice position.
 *
 * Effective quantity for meter-based products: roll assignments (preferred) or
 * requiredMb converted to m². Raw `quantity` (defaults to 1) would otherwise
 * misreport new roll items on the invoice.
 */
export function mapProductToInvoicePosition(
  product: MappableProduct,
  customerDiscount?: number,
): InvoicePosition {
  const rawUnit = product.unit ?? product.priceUnit;
  return {
    name: product.name,
    quantity: resolveQuantity(product, rawUnit),
    unit_price_gross: product.priceNet,
    vat_rate: 23,
    unit: rawUnit === 'meter' ? 'm2' : rawUnit === 'piece' ? 'szt.' : rawUnit || 'szt.',
    discount: product.discountPercent ?? customerDiscount ?? 0,
  };
}
