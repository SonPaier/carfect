export interface SalesOrderProduct {
  name: string;
  quantity: number;
  priceNet: number;
  priceGross: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  createdAt: string; // ISO date
  shippedAt?: string; // ISO date
  customerName: string;
  city?: string;
  contactPerson?: string;
  totalNet: number;
  totalGross: number;
  currency: 'PLN' | 'EUR';
  products: SalesOrderProduct[];
  comment?: string;
  status: 'nowy' | 'wysłany';
  trackingNumber?: string;
  trackingUrl?: string;
}

export const mockSalesOrders: SalesOrder[] = [];
