export interface SalesOrderProduct {
  name: string;
  quantity: number;
  priceNet: number;
  priceGross: number;
  unit?: string;
  discountPercent?: number;
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
  trackingNumber?: string;
  trackingUrl?: string;
  /** Invoice data if exists */
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceStatus?: string; // 'draft' | 'issued' | 'sent' | 'paid'
  invoicePdfUrl?: string;
  customerDiscount?: number;
}

export const mockSalesOrders: SalesOrder[] = [];
