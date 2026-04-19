import { assertEquals } from 'jsr:@std/assert';
import { mapRollUsageToResponse } from './helpers.ts';
import type { RollUsageRow, RollRow } from './helpers.ts';

Deno.test('mapRollUsageToResponse - maps all fields correctly', () => {
  const usage: RollUsageRow = {
    id: 'usage-1',
    order_id: 'order-1',
    order_item_id: 'item-1',
    used_mb: 12.5,
  };

  const roll: RollRow = {
    id: 'roll-1',
    brand: 'Ultrafit',
    product_name: 'XP Crystal',
    width_mm: 1524,
    barcode: '8801990000153',
  };

  const result = mapRollUsageToResponse(usage, roll);

  assertEquals(result.brand, 'Ultrafit');
  assertEquals(result.productName, 'XP Crystal');
  assertEquals(result.widthMm, 1524);
  assertEquals(result.usedMb, 12.5);
  assertEquals(result.barcode, '8801990000153');
});

Deno.test('mapRollUsageToResponse - maps used_mb from usage, not roll', () => {
  const usage: RollUsageRow = {
    id: 'usage-2',
    order_id: 'order-2',
    order_item_id: 'item-2',
    used_mb: 7.3,
  };

  const roll: RollRow = {
    id: 'roll-2',
    brand: 'XPEL',
    product_name: 'Ultimate Plus',
    width_mm: 610,
    barcode: '1234567890123',
  };

  const result = mapRollUsageToResponse(usage, roll);

  assertEquals(result.usedMb, 7.3);
  assertEquals(result.brand, 'XPEL');
  assertEquals(result.widthMm, 610);
});

Deno.test('mapRollUsageToResponse - handles zero used_mb', () => {
  const usage: RollUsageRow = {
    id: 'usage-3',
    order_id: 'order-3',
    order_item_id: 'item-3',
    used_mb: 0,
  };

  const roll: RollRow = {
    id: 'roll-3',
    brand: 'SunTek',
    product_name: 'ClearBra',
    width_mm: 914,
    barcode: '9876543210987',
  };

  const result = mapRollUsageToResponse(usage, roll);

  assertEquals(result.usedMb, 0);
  assertEquals(result.productName, 'ClearBra');
});
