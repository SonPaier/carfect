/**
 * Pure business logic for ultrafit-orders edge function.
 * Extracted for testability — no side effects, no Deno.env, no HTTP.
 */

// ========================
// TYPES
// ========================

export interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string;
  created_at: string;
  shipped_at: string | null;
  status: string;
  total_net: number;
  currency: string;
  tracking_number: string | null;
  tracking_url: string | null;
  delivery_type: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
  price_net: number;
  price_unit: string;
  discount_percent: number;
  vehicle: string | null;
  product_type: string | null;
}

export interface UltrafitOrdersRequest {
  page: number;
  pageSize: number;
  search: string;
}

export interface UltrafitOrderItemResponse {
  id: string;
  name: string;
  quantity: number;
  priceNet: number;
  unit: string;
  discountPercent: number;
  vehicle: string | null;
  productType: string | null;
}

export interface UltrafitOrderResponse {
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
  items: UltrafitOrderItemResponse[];
}

// ========================
// FUNCTIONS
// ========================

/**
 * Filters orders where any item's name or vehicle matches search (case insensitive).
 * Empty search returns all orders.
 */
export function filterOrdersBySearch(
  orders: Array<OrderRow & { items: OrderItemRow[] }>,
  search: string,
): Array<OrderRow & { items: OrderItemRow[] }> {
  if (!search || search.trim() === '') {
    return orders;
  }

  const lowerSearch = search.trim().toLowerCase();

  return orders.filter((order) =>
    order.items.some(
      (item) =>
        item.name.toLowerCase().includes(lowerSearch) ||
        (item.vehicle != null && item.vehicle.toLowerCase().includes(lowerSearch)),
    )
  );
}

/**
 * Maps a DB order row (snake_case) to camelCase response shape.
 */
export function mapOrderToResponse(
  order: OrderRow & { items: OrderItemRow[] },
): UltrafitOrderResponse {
  return {
    id: order.id,
    orderNumber: order.order_number,
    createdAt: order.created_at,
    shippedAt: order.shipped_at,
    status: order.status,
    totalNet: order.total_net,
    currency: order.currency,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    deliveryType: order.delivery_type,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      priceNet: item.price_net,
      unit: item.price_unit,
      discountPercent: item.discount_percent,
      vehicle: item.vehicle,
      productType: item.product_type,
    })),
  };
}

/**
 * Paginates an array of items and returns a slice with totalCount.
 * Page is 1-indexed.
 */
export function paginateOrders<T>(
  items: T[],
  page: number,
  pageSize: number,
): { data: T[]; totalCount: number } {
  const totalCount = items.length;
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return { data, totalCount };
}
