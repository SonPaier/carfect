import { format } from 'date-fns';

export interface CalendarItemForInvoice {
  id: string;
  title: string;
  item_date: string;
  end_date?: string | null;
  price: number | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
}

export interface InvoicePosition {
  name: string;
  quantity: number;
  unit_price_gross: number;
  vat_rate: number;
  unit: string;
}

/**
 * Validates that all items have the same customer_id.
 * Returns error message string or null if valid.
 */
export function validateSameCustomer(items: CalendarItemForInvoice[]): string | null {
  const customerIds = [...new Set(items.map((i) => i.customer_id).filter(Boolean))];
  if (customerIds.length > 1) return 'Zaznaczone zlecenia muszą mieć tego samego klienta';
  if (customerIds.length === 0) return 'Zaznaczone zlecenia nie mają przypisanego klienta';
  return null;
}

/**
 * Formats invoice position name: "Title, DD.MM.YYYY" or "Title, DD.MM.YYYY – DD.MM.YYYY"
 */
export function buildPositionName(title: string, itemDate: string, endDate?: string | null): string {
  const startFormatted = format(new Date(itemDate + 'T00:00:00'), 'd.MM.yyyy');
  if (endDate && endDate !== itemDate) {
    const endFormatted = format(new Date(endDate + 'T00:00:00'), 'd.MM.yyyy');
    return `${title}, ${startFormatted} – ${endFormatted}`;
  }
  return `${title}, ${startFormatted}`;
}

/**
 * Builds invoice positions from selected calendar items.
 * One position per item, price = item.price.
 */
export function buildInvoicePositions(items: CalendarItemForInvoice[]): InvoicePosition[] {
  return items.map((item) => ({
    name: buildPositionName(item.title, item.item_date, item.end_date),
    quantity: 1,
    unit_price_gross: item.price || 0,
    vat_rate: 23,
    unit: 'szt.',
  }));
}
