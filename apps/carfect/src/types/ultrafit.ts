export interface UltrafitOrderItem {
  name: string;
  quantity: number;
  priceNet: number;
  unit: string;
  vehicle: string | null;
  productType: string | null;
}

export interface UltrafitOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  shippedAt: string | null;
  status: string;
  totalNet: number;
  currency: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  deliveryType: string | null;
  items: UltrafitOrderItem[];
}

export interface UltrafitRoll {
  brand: string;
  productName: string;
  widthMm: number;
  usedMb: number;
  barcode: string;
}

export interface UltrafitOrdersResponse {
  orders: UltrafitOrder[];
  totalCount: number;
}
