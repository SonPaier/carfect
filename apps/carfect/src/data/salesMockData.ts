export interface SalesOrderProduct {
  name: string;
  quantity: number;
  priceNet: number;
  priceGross: number;
  unit?: string;
  discountPercent?: number;
  requiredMb?: number;
  productType?: 'roll' | 'other';
}

export interface SalesOrderPackage {
  shippingMethod: string;
  shippingCost?: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  createdAt: string; // ISO date
  shippedAt?: string; // ISO date
  customerName: string;
  customerId?: string;
  city?: string;
  contactPerson?: string;
  totalNet: number;
  totalGross: number;
  currency: 'PLN' | 'EUR';
  products: SalesOrderProduct[];
  packages?: SalesOrderPackage[];
  comment?: string;
  status: 'nowy' | 'wysłany' | 'anulowany';
  paymentStatus:
    | 'unpaid'
    | 'paid'
    | 'collective'
    | 'collective_paid'
    | 'invoice_unpaid'
    | 'invoice_paid';
  trackingNumber?: string;
  trackingUrl?: string;
  apaczkaOrderId?: string;
  /** Invoice data if exists */
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceStatus?: string; // 'draft' | 'issued' | 'sent' | 'paid'
  invoicePdfUrl?: string;
  customerDiscount?: number;
  paymentMethod?: string;
  deliveryType?: 'shipping' | 'pickup' | 'uber';
}

export const mockSalesOrders: SalesOrder[] = [];
