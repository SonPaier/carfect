import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mock refs ────────────────────────────────────────
const { mockFrom, mockFunctionsInvoke } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFunctionsInvoke: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
    functions: { invoke: mockFunctionsInvoke },
  },
}));

vi.mock('@shared/utils', () => ({
  compressImage: vi.fn(async (file: File) => file),
}));

import { fetchRolls, fetchRollRemainingMb, fetchRollUsages } from './rollService';

// ─── Chain mock factory ───────────────────────────────────────

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'insert',
    'update',
    'delete',
    'upsert',
    'ilike',
    'in',
    'gte',
    'lte',
    'or',
    'not',
  ];
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

// ─── Helpers ──────────────────────────────────────────────────

const makeRollDbRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'roll-1',
  instance_id: 'inst-1',
  brand: 'BrandX',
  product_name: 'Wrap Pro',
  description: 'desc',
  product_code: 'WP-100',
  barcode: '123456',
  width_mm: '1524',
  length_m: '30',
  initial_length_m: '30',
  initial_remaining_mb: null, // null means full roll (falls back to length_m)
  delivery_date: '2025-01-01',
  photo_url: null,
  status: 'active',
  extraction_confidence: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  created_by: null,
  ...overrides,
});

// Set up sequential mockFrom calls.
// fetchRolls always calls: sales_rolls → sales_roll_usages → sales_orders (if order IDs) → profiles (if creator IDs)
// When there are no order IDs and no creator IDs, only 2 chains are needed.
const setupFromSequence = (...chains: ReturnType<typeof createChainMock>[]) => {
  mockFrom.mockReset();
  chains.forEach((chain) => mockFrom.mockReturnValueOnce(chain));
  mockFrom.mockReturnValue(createChainMock([], null));
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Remaining calculation — full roll ───────────────────────

describe('remaining calculation — full roll (initialRemainingMb = lengthM)', () => {
  it('full roll with no usages has remainingMb equal to lengthM', async () => {
    const rollsChain = createChainMock([makeRollDbRow()], null);
    const usagesChain = createChainMock([], null);
    setupFromSequence(rollsChain, usagesChain);

    const [roll] = await fetchRolls('inst-1', 'active');

    expect(roll.remainingMb).toBe(30);
  });

  it('full roll with 10mb used has remainingMb of 20', async () => {
    const rollsChain = createChainMock([makeRollDbRow()], null);
    const usagesChain = createChainMock([{ roll_id: 'roll-1', used_mb: '10', order_id: null }], null);
    setupFromSequence(rollsChain, usagesChain);

    const [roll] = await fetchRolls('inst-1', 'active');

    expect(roll.remainingMb).toBe(20);
  });
});

// ─── Remaining calculation — partial roll ────────────────────

describe('remaining calculation — partial roll (initialRemainingMb < lengthM)', () => {
  it('partial roll with no usages has remainingMb equal to initialRemainingMb', async () => {
    const rollsChain = createChainMock(
      [makeRollDbRow({ initial_remaining_mb: '10' })],
      null,
    );
    const usagesChain = createChainMock([], null);
    setupFromSequence(rollsChain, usagesChain);

    const [roll] = await fetchRolls('inst-1', 'active');

    expect(roll.remainingMb).toBe(10);
  });

  it('partial roll with 3mb used has remainingMb of 7', async () => {
    const rollsChain = createChainMock(
      [makeRollDbRow({ initial_remaining_mb: '10' })],
      null,
    );
    const usagesChain = createChainMock([{ roll_id: 'roll-1', used_mb: '3', order_id: null }], null);
    setupFromSequence(rollsChain, usagesChain);

    const [roll] = await fetchRolls('inst-1', 'active');

    expect(roll.remainingMb).toBe(7);
  });

  it('partial roll with usage equal to initialRemainingMb has remainingMb of 0', async () => {
    const rollsChain = createChainMock(
      [makeRollDbRow({ initial_remaining_mb: '10' })],
      null,
    );
    const usagesChain = createChainMock([{ roll_id: 'roll-1', used_mb: '10', order_id: null }], null);
    setupFromSequence(rollsChain, usagesChain);

    const [roll] = await fetchRolls('inst-1', 'active');

    expect(roll.remainingMb).toBe(0);
  });

  it('partial roll with usage exceeding initialRemainingMb is clamped to 0', async () => {
    const rollsChain = createChainMock(
      [makeRollDbRow({ initial_remaining_mb: '10' })],
      null,
    );
    const usagesChain = createChainMock([{ roll_id: 'roll-1', used_mb: '15', order_id: null }], null);
    setupFromSequence(rollsChain, usagesChain);

    const [roll] = await fetchRolls('inst-1', 'active');

    expect(roll.remainingMb).toBe(0);
  });
});

// ─── currentUsageMb calculation ──────────────────────────────

describe('currentUsageMb calculation', () => {
  it('full roll with 5mb usage has currentUsageMb of 5', async () => {
    // Full roll: initialRemainingMb = lengthM = 30, so pre-used = 0
    const rollsChain = createChainMock([makeRollDbRow()], null);
    const usagesChain = createChainMock([{ roll_id: 'roll-1', used_mb: '5', order_id: null }], null);
    setupFromSequence(rollsChain, usagesChain);

    const [roll] = await fetchRolls('inst-1', 'active');

    // currentUsageMb = (lengthM - initialRemainingMb) + trackedUsageMb = (30 - 30) + 5 = 5
    expect(roll.currentUsageMb).toBe(5);
  });

  it('partial roll with 3mb tracked usage has currentUsageMb reflecting pre-used amount', async () => {
    // initialRemainingMb = 10, lengthM = 30 → pre-used = 20
    // tracked usage = 3mb → currentUsageMb = 20 + 3 = 23
    const rollsChain = createChainMock(
      [makeRollDbRow({ initial_remaining_mb: '10' })],
      null,
    );
    const usagesChain = createChainMock([{ roll_id: 'roll-1', used_mb: '3', order_id: null }], null);
    setupFromSequence(rollsChain, usagesChain);

    const [roll] = await fetchRolls('inst-1', 'active');

    expect(roll.currentUsageMb).toBe(23);
  });
});

// ─── Multiple usages aggregation ─────────────────────────────

describe('multiple usages aggregation', () => {
  it('aggregates 3 usages and computes correct remainingMb', async () => {
    // 3 usages: 2 + 3 + 1 = 6mb total
    // Full roll: initialRemainingMb = lengthM = 30 → remainingMb = 30 - 6 = 24
    const rollsChain = createChainMock([makeRollDbRow()], null);
    const usagesChain = createChainMock(
      [
        { roll_id: 'roll-1', used_mb: '2', order_id: null },
        { roll_id: 'roll-1', used_mb: '3', order_id: null },
        { roll_id: 'roll-1', used_mb: '1', order_id: null },
      ],
      null,
    );
    setupFromSequence(rollsChain, usagesChain);

    const [roll] = await fetchRolls('inst-1', 'active');

    expect(roll.currentUsageMb).toBe(6);
    expect(roll.remainingMb).toBe(24);
  });
});

// ─── fetchRollRemainingMb — correct remaining ─────────────────

describe('fetchRollRemainingMb', () => {
  it('returns correct remaining for a full roll with tracked usages', async () => {
    // Full roll: initial_remaining_mb missing → falls back to length_m = 30
    // usages = 8mb → remainingMb = 30 - 8 = 22
    const rollChain = createChainMock(
      { length_m: '30', width_mm: '1524', initial_remaining_mb: null },
      null,
    );
    const usagesChain = createChainMock([{ used_mb: '8' }], null);
    setupFromSequence(rollChain, usagesChain);

    const result = await fetchRollRemainingMb('roll-1');

    expect(result.remainingMb).toBe(22);
    expect(result.usedMb).toBe(8);
    expect(result.lengthM).toBe(30);
    expect(result.widthMm).toBe(1524);
  });

  it('excludeOrderId parameter excludes that order usages from calculation', async () => {
    // Two usages exist in DB, but the one belonging to excluded order is filtered out by .neq()
    // Since the chain mock applies .neq() but still returns whatever we set,
    // we simulate the DB already having filtered: only 1 usage returned (5mb instead of 5+3=8mb)
    const rollChain = createChainMock(
      { length_m: '30', width_mm: '1524', initial_remaining_mb: null },
      null,
    );
    // Simulate DB filtering: excluded order's usage (3mb) is not in the result
    const usagesChain = createChainMock([{ used_mb: '5' }], null);
    setupFromSequence(rollChain, usagesChain);

    const result = await fetchRollRemainingMb('roll-1', 'order-to-exclude');

    // Verify .neq was called with ('order_id', 'order-to-exclude')
    const neqCalls = (usagesChain.neq as ReturnType<typeof vi.fn>).mock.calls as [string, unknown][];
    expect(neqCalls.some(([field, val]) => field === 'order_id' && val === 'order-to-exclude')).toBe(true);

    // Only 5mb counted, so remaining = 30 - 5 = 25
    expect(result.remainingMb).toBe(25);
    expect(result.usedMb).toBe(5);
  });
});

// ─── mapUsageRow (via fetchRollUsages) ───────────────────────

describe('mapUsageRow — field mapping', () => {
  it('maps source, workerName, and note correctly', async () => {
    const usageRow = {
      id: 'usage-1',
      roll_id: 'roll-1',
      order_id: 'order-1',
      order_item_id: 'item-1',
      used_m2: '4.5',
      used_mb: '3.0',
      source: 'worker',
      worker_name: 'Jan Kowalski',
      note: 'Applied to hood',
      created_at: '2025-03-01T10:00:00Z',
    };
    const usagesChain = createChainMock([usageRow], null);
    setupFromSequence(usagesChain);

    const [usage] = await fetchRollUsages('roll-1');

    expect(usage.source).toBe('worker');
    expect(usage.workerName).toBe('Jan Kowalski');
    expect(usage.note).toBe('Applied to hood');
    expect(usage.orderId).toBe('order-1');
    expect(usage.orderItemId).toBe('item-1');
  });

  it('maps null orderId and orderItemId for manual usages', async () => {
    const usageRow = {
      id: 'usage-2',
      roll_id: 'roll-1',
      order_id: null,
      order_item_id: null,
      used_m2: '2.0',
      used_mb: '1.5',
      source: 'manual',
      worker_name: null,
      note: null,
      created_at: '2025-03-02T10:00:00Z',
    };
    const usagesChain = createChainMock([usageRow], null);
    setupFromSequence(usagesChain);

    const [usage] = await fetchRollUsages('roll-1');

    expect(usage.orderId).toBeNull();
    expect(usage.orderItemId).toBeNull();
    expect(usage.source).toBe('manual');
    expect(usage.workerName).toBeNull();
    expect(usage.note).toBeNull();
  });
});
