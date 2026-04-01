import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mock refs ────────────────────────────────────────
// vi.mock factories are hoisted before variable declarations, so we must
// use vi.hoisted() to create refs that are available at hoist time.
const { mockFrom, mockStorageUpload, mockStorageGetPublicUrl, mockFunctionsInvoke } = vi.hoisted(
  () => ({
    mockFrom: vi.fn(),
    mockStorageUpload: vi.fn(),
    mockStorageGetPublicUrl: vi.fn(),
    mockFunctionsInvoke: vi.fn(),
  }),
);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      })),
    },
    functions: { invoke: mockFunctionsInvoke },
  },
}));

vi.mock('@shared/utils', () => ({
  compressImage: vi.fn(async (file: File) => file),
}));

import {
  fetchRolls,
  fetchRollById,
  createRoll,
  updateRoll,
  deleteRoll,
  createRollUsage,
  deleteRollUsagesByOrder,
  fetchRollRemainingMb,
  uploadRollPhoto,
  extractRollData,
  fileToBase64,
} from './rollService';
import { compressImage } from '@shared/utils';

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

const makeDbRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'roll-1',
  instance_id: 'inst-1',
  brand: 'BrandX',
  product_name: 'Wrap Pro',
  description: 'desc',
  product_code: 'WP-100',
  barcode: '123456',
  width_mm: '1524',
  length_m: '50',
  initial_length_m: '50',
  delivery_date: '2025-01-01',
  photo_url: 'https://example.com/photo.jpg',
  status: 'active',
  extraction_confidence: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

// Sequences calls to mockFrom: first call returns chain1, second chain2, etc.
const setupFromSequence = (...chains: ReturnType<typeof createChainMock>[]) => {
  mockFrom.mockReset();
  chains.forEach((chain) => mockFrom.mockReturnValueOnce(chain));
  mockFrom.mockReturnValue(createChainMock([], null));
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── fetchRolls ───────────────────────────────────────────────

describe('fetchRolls', () => {
  it('active tab — calls .eq("status", "active")', async () => {
    const rollsChain = createChainMock([makeDbRow()], null);
    const usagesChain = createChainMock([], null);
    setupFromSequence(rollsChain, usagesChain);

    await fetchRolls('inst-1', 'active');

    const eqCalls = (rollsChain.eq as ReturnType<typeof vi.fn>).mock.calls as [string, unknown][];
    expect(eqCalls.some(([f, v]) => f === 'status' && v === 'active')).toBe(true);
  });

  it('sold tab — does NOT call .eq("status", "active")', async () => {
    const rollsChain = createChainMock([makeDbRow()], null);
    const usagesChain = createChainMock([], null);
    setupFromSequence(rollsChain, usagesChain);

    await fetchRolls('inst-1', 'sold');

    const eqCalls = (rollsChain.eq as ReturnType<typeof vi.fn>).mock.calls as [string, unknown][];
    expect(eqCalls.some(([f, v]) => f === 'status' && v === 'active')).toBe(false);
  });

  it('returns empty array when no data rows returned', async () => {
    const rollsChain = createChainMock([], null);
    setupFromSequence(rollsChain);

    const result = await fetchRolls('inst-1', 'active');

    expect(result).toEqual([]);
  });

  it('maps DB snake_case rows to camelCase SalesRoll objects', async () => {
    const row = makeDbRow();
    const rollsChain = createChainMock([row], null);
    const usagesChain = createChainMock([], null);
    setupFromSequence(rollsChain, usagesChain);

    const result = await fetchRolls('inst-1', 'active');

    expect(result[0].instanceId).toBe('inst-1');
    expect(result[0].productName).toBe('Wrap Pro');
    expect(result[0].widthMm).toBe(1524);
    expect(result[0].lengthM).toBe(50);
    expect(result[0].initialLengthM).toBe(50);
    expect(result[0].createdAt).toBe('2025-01-01T00:00:00Z');
  });

  it('throws on Supabase error', async () => {
    const rollsChain = createChainMock(null, { message: 'DB error' });
    setupFromSequence(rollsChain);

    await expect(fetchRolls('inst-1', 'active')).rejects.toThrow('DB error');
  });
});

// ─── fetchRollById ────────────────────────────────────────────

describe('fetchRollById', () => {
  it('returns a mapped roll with computed usage fields', async () => {
    const row = makeDbRow();
    const rollChain = createChainMock(row, null);
    const usagesChain = createChainMock([{ used_mb: '10' }], null);
    setupFromSequence(rollChain, usagesChain);

    const result = await fetchRollById('roll-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('roll-1');
    expect(result!.currentUsageMb).toBe(10);
    expect(result!.remainingMb).toBe(40); // 50 - 10
    expect(result!.remainingM2).toBeCloseTo(40 * (1524 / 1000), 5);
  });

  it('returns null when roll not found', async () => {
    const rollChain = createChainMock(null, { message: 'Not found' });
    setupFromSequence(rollChain);

    const result = await fetchRollById('nonexistent');

    expect(result).toBeNull();
  });
});

// ─── createRoll ───────────────────────────────────────────────

describe('createRoll', () => {
  it('inserts a row and returns the new roll id', async () => {
    const insertChain = createChainMock({ id: 'new-roll-id' }, null);
    setupFromSequence(insertChain);

    const id = await createRoll({
      instanceId: 'inst-1',
      brand: 'BrandX',
      productName: 'Wrap Pro',
      widthMm: 1524,
      lengthM: 50,
    });

    expect(id).toBe('new-roll-id');
    expect((insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({
      instance_id: 'inst-1',
      brand: 'BrandX',
      product_name: 'Wrap Pro',
      width_mm: 1524,
      length_m: 50,
      initial_length_m: 50,
    });
  });
});

// ─── updateRoll ───────────────────────────────────────────────

describe('updateRoll', () => {
  it('calls update with correctly mapped snake_case fields', async () => {
    const updateChain = createChainMock(null, null);
    setupFromSequence(updateChain);

    await updateRoll('roll-1', { brand: 'NewBrand', widthMm: 2000, lengthM: 30 });

    const updatePayload = (updateChain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updatePayload.brand).toBe('NewBrand');
    expect(updatePayload.width_mm).toBe(2000);
    expect(updatePayload.length_m).toBe(30);
    expect(updatePayload.updated_at).toBeDefined();

    const eqCalls = (updateChain.eq as ReturnType<typeof vi.fn>).mock.calls as [string, unknown][];
    expect(eqCalls.some(([f, v]) => f === 'id' && v === 'roll-1')).toBe(true);
  });
});

// ─── deleteRoll ───────────────────────────────────────────────

describe('deleteRoll', () => {
  it('hard-deletes the roll from DB when it has no usages', async () => {
    // First call: check usages (none found) → sales_roll_usages
    const usagesCheckChain = createChainMock([], null);
    // Second call: delete the roll → sales_rolls
    const deleteChain = createChainMock(null, null);
    setupFromSequence(usagesCheckChain, deleteChain);

    await deleteRoll('roll-1');

    expect(deleteChain.delete as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    const eqCalls = (deleteChain.eq as ReturnType<typeof vi.fn>).mock.calls as [string, unknown][];
    expect(eqCalls.some(([f, v]) => f === 'id' && v === 'roll-1')).toBe(true);
  });

  it('throws when roll has existing usages', async () => {
    const usagesCheckChain = createChainMock([{ id: 'usage-1' }], null);
    setupFromSequence(usagesCheckChain);

    await expect(deleteRoll('roll-1')).rejects.toThrow(
      'Nie można usunąć rolki, która ma przypisane zużycie',
    );
  });
});

// ─── createRollUsage ──────────────────────────────────────────

describe('createRollUsage', () => {
  it('inserts a usage record and returns the new id', async () => {
    const insertChain = createChainMock({ id: 'usage-new' }, null);
    setupFromSequence(insertChain);

    const id = await createRollUsage({
      rollId: 'roll-1',
      orderId: 'order-1',
      orderItemId: 'item-1',
      usedM2: 5.5,
      usedMb: 3.6,
    });

    expect(id).toBe('usage-new');
    expect((insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({
      roll_id: 'roll-1',
      order_id: 'order-1',
      order_item_id: 'item-1',
      used_m2: 5.5,
      used_mb: 3.6,
    });
  });
});

// ─── deleteRollUsagesByOrder ───────────────────────────────────

describe('deleteRollUsagesByOrder', () => {
  it('deletes usages filtered by order_id', async () => {
    const deleteChain = createChainMock(null, null);
    setupFromSequence(deleteChain);

    await deleteRollUsagesByOrder('order-99');

    const eqCalls = (deleteChain.eq as ReturnType<typeof vi.fn>).mock.calls as [string, unknown][];
    expect(eqCalls.some(([f, v]) => f === 'order_id' && v === 'order-99')).toBe(true);
    expect(deleteChain.delete as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });
});

// ─── fetchRollRemainingMb ──────────────────────────────────────

describe('fetchRollRemainingMb', () => {
  it('returns correct remaining value based on usages', async () => {
    const rollChain = createChainMock({ length_m: '50', width_mm: '1524' }, null);
    const usagesChain = createChainMock([{ used_mb: '15' }, { used_mb: '10' }], null);
    setupFromSequence(rollChain, usagesChain);

    const result = await fetchRollRemainingMb('roll-1');

    expect(result.lengthM).toBe(50);
    expect(result.widthMm).toBe(1524);
    expect(result.usedMb).toBe(25);
    expect(result.remainingMb).toBe(25); // 50 - 25
  });

  it('remaining never goes below 0 even if usages exceed length', async () => {
    const rollChain = createChainMock({ length_m: '10', width_mm: '1000' }, null);
    const usagesChain = createChainMock([{ used_mb: '20' }], null);
    setupFromSequence(rollChain, usagesChain);

    const result = await fetchRollRemainingMb('roll-1');

    expect(result.remainingMb).toBe(0);
  });
});

// ─── mapDbRow (via fetchRollById) ─────────────────────────────

describe('mapDbRow — snake_case to camelCase conversion', () => {
  it('converts all snake_case fields to correct camelCase properties', async () => {
    const row = makeDbRow({
      product_code: 'CODE-42',
      barcode: 'BC-99',
      delivery_date: '2025-06-01',
      photo_url: 'https://cdn.example.com/img.jpg',
      extraction_confidence: { brand: 0.9 },
    });
    const rollChain = createChainMock(row, null);
    const usagesChain = createChainMock([], null);
    setupFromSequence(rollChain, usagesChain);

    const result = await fetchRollById('roll-1');

    expect(result!.productCode).toBe('CODE-42');
    expect(result!.barcode).toBe('BC-99');
    expect(result!.deliveryDate).toBe('2025-06-01');
    expect(result!.photoUrl).toBe('https://cdn.example.com/img.jpg');
    expect(result!.extractionConfidence).toEqual({ brand: 0.9 });
  });
});

// ─── extractRollData ──────────────────────────────────────────

describe('extractRollData', () => {
  it('passes instanceId to the edge function body', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        brand: 'Ultrafit',
        productName: 'Crystal XP',
        description: '',
        productCode: 'CXP-001',
        barcode: '',
        widthMm: 1524,
        lengthM: 15,
        confidence: {},
        warnings: [],
      },
      error: null,
    });

    await extractRollData('base64data', 'image/jpeg', 'inst-42');

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('extract-roll-data', {
      body: {
        imageBase64: 'base64data',
        mediaType: 'image/jpeg',
        instanceId: 'inst-42',
      },
    });
  });

  it('returns extracted data from the edge function', async () => {
    const extractedData = {
      brand: 'Ultrafit',
      productName: 'Crystal XP',
      description: 'Paint Protection Film',
      productCode: 'CXP-001',
      barcode: '1234567890123',
      widthMm: 1524,
      lengthM: 15,
      confidence: { productName: 0.95 },
      warnings: [],
    };
    mockFunctionsInvoke.mockResolvedValue({ data: extractedData, error: null });

    const result = await extractRollData('base64data', 'image/jpeg', 'inst-1');

    expect(result.productName).toBe('Crystal XP');
    expect(result.brand).toBe('Ultrafit');
    expect(result.widthMm).toBe(1524);
  });

  it('throws when edge function returns an error', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Function timeout' },
    });

    await expect(extractRollData('base64', 'image/jpeg', 'inst-1')).rejects.toThrow(
      'Function timeout',
    );
  });

  it('throws when response data contains an error field', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { error: 'Nie udało się odczytać danych z etykiety' },
      error: null,
    });

    await expect(extractRollData('base64', 'image/jpeg', 'inst-1')).rejects.toThrow(
      'Nie udało się odczytać danych z etykiety',
    );
  });
});

// ─── uploadRollPhoto ──────────────────────────────────────────

describe('uploadRollPhoto', () => {
  it('calls storage upload and returns public URL', async () => {
    mockStorageUpload.mockResolvedValue({ error: null });
    mockStorageGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/roll-photos/inst-1/uuid.jpg' },
    });

    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const url = await uploadRollPhoto(file, 'inst-1');

    expect(mockStorageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^inst-1\/.+\.jpg$/),
      expect.anything(),
      expect.objectContaining({ contentType: 'image/jpeg' }),
    );
    expect(url).toBe('https://storage.example.com/roll-photos/inst-1/uuid.jpg');
  });

  it('throws when storage upload returns an error', async () => {
    mockStorageUpload.mockResolvedValue({ error: { message: 'Storage quota exceeded' } });

    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

    await expect(uploadRollPhoto(file, 'inst-1')).rejects.toThrow('Storage quota exceeded');
  });
});

// ─── fileToBase64 — HEIC conversion ─────────────────────────

describe('fileToBase64', () => {
  it('calls compressImage to convert the file before reading as base64', async () => {
    const file = new File(['fake-heic-data'], 'photo.heic', { type: 'image/heic' });

    const base64 = await fileToBase64(file);

    expect(compressImage).toHaveBeenCalledWith(file, 2048, 0.9);
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(0);
  });

  it('returns valid base64 without data URI prefix', async () => {
    const file = new File(['test-content'], 'photo.jpg', { type: 'image/jpeg' });

    const base64 = await fileToBase64(file);

    // Should not contain "data:" prefix
    expect(base64).not.toContain('data:');
    expect(base64).not.toContain('base64,');
  });
});
