import { assertEquals } from 'jsr:@std/assert';
import {
  filterOrdersBySearch,
  mapOrderToResponse,
  paginateOrders,
  type OrderRow,
  type OrderItemRow,
} from './helpers.ts';

// ========================
// TEST FIXTURES
// ========================

function makeItem(overrides: Partial<OrderItemRow> = {}): OrderItemRow {
  return {
    id: 'item-1',
    order_id: 'order-1',
    name: 'XPEL Ultimate Plus',
    quantity: 2,
    price_net: 150.0,
    unit: 'mb',
    vehicle: 'BMW 3 Series',
    product_type: 'roll',
    ...overrides,
  };
}

function makeOrder(
  overrides: Partial<OrderRow & { items: OrderItemRow[] }> = {},
): OrderRow & { items: OrderItemRow[] } {
  return {
    id: 'order-1',
    order_number: 'UF/2026/001',
    customer_id: 'cust-1',
    created_at: '2026-01-15T10:00:00Z',
    shipped_at: '2026-01-16T08:00:00Z',
    status: 'shipped',
    total_net: 300.0,
    currency: 'PLN',
    tracking_number: 'TRK123456',
    tracking_url: 'https://tracking.example.com/TRK123456',
    delivery_type: 'courier',
    items: [makeItem()],
    ...overrides,
  };
}

// ========================
// filterOrdersBySearch
// ========================

Deno.test('UFO-001: filterOrdersBySearch - empty search returns all orders', () => {
  const orders = [makeOrder({ id: 'order-1' }), makeOrder({ id: 'order-2' })];

  assertEquals(filterOrdersBySearch(orders, '').length, 2);
  assertEquals(filterOrdersBySearch(orders, '   ').length, 2);
});

Deno.test('UFO-002: filterOrdersBySearch - filters by item name (case insensitive)', () => {
  const orders = [
    makeOrder({ id: 'order-1', items: [makeItem({ name: 'XPEL Ultimate Plus' })] }),
    makeOrder({ id: 'order-2', items: [makeItem({ name: 'SunTek CIR' })] }),
  ];

  const result = filterOrdersBySearch(orders, 'xpel');
  assertEquals(result.length, 1);
  assertEquals(result[0].id, 'order-1');
});

Deno.test('UFO-003: filterOrdersBySearch - filters by vehicle (case insensitive)', () => {
  const orders = [
    makeOrder({ id: 'order-1', items: [makeItem({ vehicle: 'BMW 3 Series' })] }),
    makeOrder({ id: 'order-2', items: [makeItem({ vehicle: 'Audi A4' })] }),
  ];

  const result = filterOrdersBySearch(orders, 'bmw');
  assertEquals(result.length, 1);
  assertEquals(result[0].id, 'order-1');
});

Deno.test('UFO-004: filterOrdersBySearch - null vehicle does not throw', () => {
  const orders = [
    makeOrder({ id: 'order-1', items: [makeItem({ vehicle: null })] }),
  ];

  const result = filterOrdersBySearch(orders, 'bmw');
  assertEquals(result.length, 0);
});

Deno.test('UFO-005: filterOrdersBySearch - matches partial name', () => {
  const orders = [
    makeOrder({ id: 'order-1', items: [makeItem({ name: 'XPEL Ultimate Plus 152cm' })] }),
  ];

  const result = filterOrdersBySearch(orders, 'ultimate');
  assertEquals(result.length, 1);
});

Deno.test('UFO-006: filterOrdersBySearch - no match returns empty array', () => {
  const orders = [makeOrder({ items: [makeItem({ name: 'XPEL', vehicle: 'BMW' })] })];

  const result = filterOrdersBySearch(orders, 'audi');
  assertEquals(result.length, 0);
});

// ========================
// mapOrderToResponse
// ========================

Deno.test('UFO-007: mapOrderToResponse - maps snake_case to camelCase', () => {
  const order = makeOrder();
  const result = mapOrderToResponse(order);

  assertEquals(result.id, 'order-1');
  assertEquals(result.orderNumber, 'UF/2026/001');
  assertEquals(result.createdAt, '2026-01-15T10:00:00Z');
  assertEquals(result.shippedAt, '2026-01-16T08:00:00Z');
  assertEquals(result.status, 'shipped');
  assertEquals(result.totalNet, 300.0);
  assertEquals(result.currency, 'PLN');
  assertEquals(result.trackingNumber, 'TRK123456');
  assertEquals(result.trackingUrl, 'https://tracking.example.com/TRK123456');
  assertEquals(result.deliveryType, 'courier');
});

Deno.test('UFO-008: mapOrderToResponse - maps items to camelCase', () => {
  const order = makeOrder();
  const result = mapOrderToResponse(order);

  assertEquals(result.items.length, 1);
  assertEquals(result.items[0].id, 'item-1');
  assertEquals(result.items[0].name, 'XPEL Ultimate Plus');
  assertEquals(result.items[0].priceNet, 150.0);
  assertEquals(result.items[0].productType, 'roll');
  assertEquals(result.items[0].vehicle, 'BMW 3 Series');
});

Deno.test('UFO-009: mapOrderToResponse - handles null optional fields', () => {
  const order = makeOrder({
    shipped_at: null,
    tracking_number: null,
    tracking_url: null,
    delivery_type: null,
    items: [makeItem({ vehicle: null, product_type: null })],
  });
  const result = mapOrderToResponse(order);

  assertEquals(result.shippedAt, null);
  assertEquals(result.trackingNumber, null);
  assertEquals(result.trackingUrl, null);
  assertEquals(result.deliveryType, null);
  assertEquals(result.items[0].vehicle, null);
  assertEquals(result.items[0].productType, null);
});

// ========================
// paginateOrders
// ========================

Deno.test('UFO-010: paginateOrders - page 1 returns first N items', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const result = paginateOrders(items, 1, 3);

  assertEquals(result.totalCount, 10);
  assertEquals(result.data, [1, 2, 3]);
});

Deno.test('UFO-011: paginateOrders - page 2 returns correct slice', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const result = paginateOrders(items, 2, 3);

  assertEquals(result.totalCount, 10);
  assertEquals(result.data, [4, 5, 6]);
});

Deno.test('UFO-012: paginateOrders - last page may be smaller than pageSize', () => {
  const items = [1, 2, 3, 4, 5];
  const result = paginateOrders(items, 2, 3);

  assertEquals(result.totalCount, 5);
  assertEquals(result.data, [4, 5]);
});

Deno.test('UFO-013: paginateOrders - page beyond range returns empty data', () => {
  const items = [1, 2, 3];
  const result = paginateOrders(items, 5, 3);

  assertEquals(result.totalCount, 3);
  assertEquals(result.data, []);
});

Deno.test('UFO-014: paginateOrders - empty array returns empty data with zero totalCount', () => {
  const result = paginateOrders([], 1, 25);

  assertEquals(result.totalCount, 0);
  assertEquals(result.data, []);
});
