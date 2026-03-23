import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RollScanDrawer from './RollScanDrawer';
import type { RollScanResult } from '../types/rolls';

// ─── Supabase mock ───────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: vi.fn() },
    functions: { invoke: vi.fn() },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-test-id' } }, error: null }),
    },
  },
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// ─── Service mock ────────────────────────────────────────────

vi.mock('../services/rollService', async () => {
  const actual = await vi.importActual('../services/rollService');
  return {
    ...(actual as object),
    createRollsBatch: vi.fn().mockResolvedValue(['id-1']),
  };
});

// ─── useRollScan mock ────────────────────────────────────────

const mockReset = vi.fn();
const mockAbort = vi.fn();
const mockAddFiles = vi.fn();
const mockRemoveResult = vi.fn();

let mockResults: RollScanResult[] = [];
let mockProcessing = false;

vi.mock('../hooks/useRollScan', () => ({
  useRollScan: () => ({
    results: mockResults,
    processing: mockProcessing,
    currentIndex: 0,
    totalCount: mockResults.length,
    confirmedResults: mockResults.filter((r) => r.status === 'confirmed'),
    reviewResults: mockResults.filter((r) => r.status === 'review'),
    errorResults: mockResults.filter((r) => r.status === 'error'),
    addFiles: mockAddFiles,
    updateResult: vi.fn(),
    updateExtractedField: vi.fn(),
    confirmResult: vi.fn(),
    confirmAll: vi.fn(),
    removeResult: mockRemoveResult,
    reset: mockReset,
    abort: mockAbort,
  }),
}));

// ─── Helpers ─────────────────────────────────────────────────

function makeResult(overrides: Partial<RollScanResult> = {}): RollScanResult {
  return {
    tempId: crypto.randomUUID(),
    file: new File([], 'label.jpg', { type: 'image/jpeg' }),
    thumbnailUrl: 'blob:test',
    extractedData: {
      productName: 'Ultrafit Black',
      widthMm: 152,
      lengthM: 25,
      productCode: 'UF-BLK-152',
    },
    confidence: {},
    warnings: [],
    status: 'confirmed',
    ...overrides,
  };
}

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'order',
    'limit',
    'single',
    'insert',
    'update',
    'delete',
    'in',
  ];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  instanceId: 'inst-1',
  onSaved: vi.fn(),
};

// ─── Tests ───────────────────────────────────────────────────

describe('RollScanDrawer — handleSave validation', () => {
  const user = userEvent.setup();

  beforeEach(async () => {
    vi.clearAllMocks();
    mockResults = [];
    mockProcessing = false;
    mockFrom.mockReturnValue(createChainMock([], null));
  });

  describe('Required fields validation', () => {
    it('shows toast.error when a roll is missing productName', async () => {
      mockResults = [
        makeResult({
          extractedData: { widthMm: 152, lengthM: 25 }, // no productName
        }),
      ];
      const { toast } = await import('sonner');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('nie ma wymaganych danych'));
    });

    it('shows toast.error when a roll is missing widthMm', async () => {
      mockResults = [
        makeResult({
          extractedData: { productName: 'Test Roll', lengthM: 25 }, // no widthMm
        }),
      ];
      const { toast } = await import('sonner');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('nie ma wymaganych danych'));
    });

    it('shows toast.error when a roll is missing lengthM', async () => {
      mockResults = [
        makeResult({
          extractedData: { productName: 'Test Roll', widthMm: 152 }, // no lengthM
        }),
      ];
      const { toast } = await import('sonner');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('nie ma wymaganych danych'));
    });

    it('does not call createRollsBatch when required fields are missing', async () => {
      mockResults = [
        makeResult({
          extractedData: { productName: 'Test Roll' }, // missing widthMm and lengthM
        }),
      ];
      const { createRollsBatch } = await import('../services/rollService');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      expect(createRollsBatch).not.toHaveBeenCalled();
    });
  });

  describe('Within-batch duplicate productCode check', () => {
    it('shows toast.error for duplicate codes in the same batch', async () => {
      mockResults = [
        makeResult({
          extractedData: {
            productName: 'Roll A',
            widthMm: 152,
            lengthM: 25,
            productCode: 'DUPE-001',
          },
        }),
        makeResult({
          extractedData: {
            productName: 'Roll B',
            widthMm: 152,
            lengthM: 25,
            productCode: 'DUPE-001',
          },
        }),
      ];
      const { toast } = await import('sonner');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('DUPE-001'));
    });

    it('does not call createRollsBatch when batch has duplicate codes', async () => {
      mockResults = [
        makeResult({
          extractedData: { productName: 'Roll A', widthMm: 152, lengthM: 25, productCode: 'DUP' },
        }),
        makeResult({
          extractedData: { productName: 'Roll B', widthMm: 100, lengthM: 50, productCode: 'DUP' },
        }),
      ];
      const { createRollsBatch } = await import('../services/rollService');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      expect(createRollsBatch).not.toHaveBeenCalled();
    });

    it('allows unique codes in batch without triggering duplicate error', async () => {
      const dbChain = createChainMock([], null); // no existing codes in DB
      mockFrom.mockReturnValue(dbChain);

      mockResults = [
        makeResult({
          extractedData: {
            productName: 'Roll A',
            widthMm: 152,
            lengthM: 25,
            productCode: 'CODE-001',
          },
        }),
        makeResult({
          extractedData: {
            productName: 'Roll B',
            widthMm: 100,
            lengthM: 50,
            productCode: 'CODE-002',
          },
        }),
      ];
      const { createRollsBatch } = await import('../services/rollService');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createRollsBatch).toHaveBeenCalled();
      });
    });
  });

  describe('Database duplicate check', () => {
    it('shows toast.error for codes already in DB with status=active', async () => {
      const dbChain = createChainMock([{ product_code: 'EXIST-001' }], null);
      mockFrom.mockReturnValue(dbChain);

      mockResults = [
        makeResult({
          extractedData: {
            productName: 'Roll A',
            widthMm: 152,
            lengthM: 25,
            productCode: 'EXIST-001',
          },
        }),
      ];
      const { toast } = await import('sonner');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('EXIST-001'));
      });
    });

    it('does not call createRollsBatch when codes already exist in DB', async () => {
      const dbChain = createChainMock([{ product_code: 'EXIST-002' }], null);
      mockFrom.mockReturnValue(dbChain);

      mockResults = [
        makeResult({
          extractedData: {
            productName: 'Roll X',
            widthMm: 152,
            lengthM: 25,
            productCode: 'EXIST-002',
          },
        }),
      ];
      const { createRollsBatch } = await import('../services/rollService');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createRollsBatch).not.toHaveBeenCalled();
      });
    });

    it('REGRESSION: archived rolls (status!=active) do NOT block saving', async () => {
      // DB returns empty for status='active' query — archived rolls are filtered out at DB level
      const dbChain = createChainMock([], null);
      mockFrom.mockReturnValue(dbChain);

      mockResults = [
        makeResult({
          extractedData: {
            productName: 'Roll Archived',
            widthMm: 152,
            lengthM: 25,
            productCode: 'ARCH-001',
          },
        }),
      ];
      const { createRollsBatch } = await import('../services/rollService');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createRollsBatch).toHaveBeenCalled();
      });
    });

    it('DB query includes status=active filter', async () => {
      const dbChain = createChainMock([], null);
      mockFrom.mockReturnValue(dbChain);

      mockResults = [
        makeResult({
          extractedData: { productName: 'Roll', widthMm: 152, lengthM: 25, productCode: 'CODE-X' },
        }),
      ];

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(dbChain.eq).toHaveBeenCalledWith('status', 'active');
      });
    });
  });

  describe('Successful save', () => {
    it('calls createRollsBatch with all savable rolls', async () => {
      const dbChain = createChainMock([], null);
      mockFrom.mockReturnValue(dbChain);

      mockResults = [
        makeResult({
          extractedData: {
            productName: 'Roll A',
            widthMm: 152,
            lengthM: 25,
            productCode: 'OK-001',
          },
        }),
        makeResult({
          extractedData: {
            productName: 'Roll B',
            widthMm: 100,
            lengthM: 50,
            productCode: 'OK-002',
          },
          status: 'review',
        }),
      ];
      const { createRollsBatch } = await import('../services/rollService');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createRollsBatch).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ productName: 'Roll A' }),
            expect.objectContaining({ productName: 'Roll B' }),
          ]),
        );
      });
    });

    it('shows toast.success after saving', async () => {
      const dbChain = createChainMock([], null);
      mockFrom.mockReturnValue(dbChain);

      mockResults = [
        makeResult({ extractedData: { productName: 'Roll A', widthMm: 152, lengthM: 25 } }),
      ];
      const { toast } = await import('sonner');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('calls onSaved callback after successful save', async () => {
      const dbChain = createChainMock([], null);
      mockFrom.mockReturnValue(dbChain);

      mockResults = [
        makeResult({ extractedData: { productName: 'Roll A', widthMm: 152, lengthM: 25 } }),
      ];
      const onSaved = vi.fn();

      render(<RollScanDrawer {...defaultProps} onSaved={onSaved} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(onSaved).toHaveBeenCalled();
      });
    });

    it('skips DB check when no rolls have product codes', async () => {
      mockResults = [
        makeResult({
          extractedData: {
            productName: 'Roll A',
            widthMm: 152,
            lengthM: 25,
            productCode: undefined,
          },
        }),
      ];
      const { createRollsBatch } = await import('../services/rollService');

      render(<RollScanDrawer {...defaultProps} />);

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createRollsBatch).toHaveBeenCalled();
      });

      // supabase.from should NOT have been called for DB duplicate check
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
