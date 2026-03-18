import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useInvoiceForm } from '@shared/invoicing';
import { toast } from 'sonner';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockFunctionsInvoke = vi.fn().mockResolvedValue({
  data: { invoice: { invoice_number: 'FV/1/2026' } },
  error: null,
});

const createChainMock = (resolveData: unknown = null) => {
  const chain: Record<string, unknown> = {};
  ['select', 'eq', 'order', 'limit', 'single', 'maybeSingle', 'insert', 'update', 'delete', 'upsert'].forEach(
    (m) => {
      chain[m] = vi.fn(() => chain);
    },
  );
  chain.then = vi.fn((resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: resolveData, error: null }).then(resolve),
  );
  return chain;
};

const settingsData = {
  active: true,
  default_vat_rate: 23,
  default_payment_days: 14,
  default_document_kind: 'vat',
  default_payment_type: 'transfer',
  default_place: 'Warszawa',
  default_seller_person: 'Jan',
  auto_send_email: false,
};

const mockFrom = vi.fn();
const mockSupabase = {
  from: (...args: unknown[]) => mockFrom(...args),
  functions: { invoke: mockFunctionsInvoke },
};

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const defaultOptions = {
  instanceId: 'inst-1',
  supabaseClient: mockSupabase,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockImplementation((table: string) => {
    if (table === 'invoicing_settings') return createChainMock(settingsData);
    return createChainMock(null);
  });
  mockFunctionsInvoke.mockResolvedValue({
    data: { invoice: { invoice_number: 'FV/1/2026' } },
    error: null,
  });
});

describe('useInvoiceForm', () => {
  describe('Initialization', () => {
    it('sets buyerName, buyerEmail, buyerTaxNo from props when open=true', async () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            customerName: 'Firma ABC',
            customerEmail: 'abc@firma.pl',
            customerNip: '1234567890',
          }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.buyerName).toBe('Firma ABC');
        expect(result.current.buyerEmail).toBe('abc@firma.pl');
        expect(result.current.buyerTaxNo).toBe('1234567890');
      });
    });

    it('does not set buyer fields when open=false', () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(false, {
            ...defaultOptions,
            customerName: 'Firma ABC',
            customerEmail: 'abc@firma.pl',
            customerNip: '1234567890',
          }),
        { wrapper },
      );

      expect(result.current.buyerName).toBe('');
      expect(result.current.buyerEmail).toBe('');
      expect(result.current.buyerTaxNo).toBe('');
    });
  });

  describe('Positions from props', () => {
    it('uses initialPositions when provided instead of default', async () => {
      const initialPositions = [
        { name: 'Mycie', quantity: 3, unit_price_gross: 50, vat_rate: 8 },
      ];

      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            positions: initialPositions,
          }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.positions).toHaveLength(1);
        expect(result.current.positions[0].name).toBe('Mycie');
        expect(result.current.positions[0].vat_rate).toBe(8);
      });
    });
  });

  describe('Price calculation - netto mode (default)', () => {
    it('calculates totals correctly for single position in netto mode', async () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            customerName: 'Firma Test',
            positions: [{ name: 'Test', quantity: 2, unit_price_gross: 100, vat_rate: 23 }],
          }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.totalNetto).toBe(200);
        expect(result.current.totalVat).toBeCloseTo(46, 5);
        expect(result.current.totalGross).toBeCloseTo(246, 5);
      });
    });
  });

  describe('Price calculation - brutto mode', () => {
    it('calculates totals correctly when priceMode is brutto', async () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            customerName: 'Firma Test',
            positions: [{ name: 'Test', quantity: 2, unit_price_gross: 100, vat_rate: 23 }],
          }),
        { wrapper },
      );

      act(() => {
        result.current.setPriceMode('brutto');
      });

      await waitFor(() => {
        expect(result.current.totalNetto).toBeCloseTo(162.6, 1);
        expect(result.current.totalVat).toBeCloseTo(37.4, 1);
        expect(result.current.totalGross).toBeCloseTo(200, 5);
      });
    });
  });

  describe('VAT exempt (vat_rate=-1) in netto mode', () => {
    it('treats exempt positions as netto=brutto', async () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            customerName: 'Firma Test',
            positions: [{ name: 'Zwolniona', quantity: 1, unit_price_gross: 100, vat_rate: -1 }],
          }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.totalNetto).toBe(100);
        expect(result.current.totalVat).toBe(0);
        expect(result.current.totalGross).toBe(100);
      });
    });
  });

  describe('Mixed VAT rates', () => {
    it('aggregates totals across different VAT rates', async () => {
      // 23%: netto=100 → brutto=123, vat=23
      // 8%: netto=100 → brutto=108, vat=8
      // total: netto=200, vat=31, gross=231
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            positions: [
              { name: 'A', quantity: 1, unit_price_gross: 100, vat_rate: 23 },
              { name: 'B', quantity: 1, unit_price_gross: 100, vat_rate: 8 },
            ],
          }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.totalNetto).toBe(200);
        expect(result.current.totalVat).toBeCloseTo(31, 5);
        expect(result.current.totalGross).toBeCloseTo(231, 5);
      });
    });
  });

  describe('Payment date', () => {
    it('calculates paymentTo as issueDate + paymentDays', async () => {
      const { result } = renderHook(() => useInvoiceForm(true, defaultOptions), { wrapper });

      // Set a known issueDate and paymentDays
      act(() => {
        result.current.setIssueDate('2026-03-01');
        result.current.setPaymentDays(14);
      });

      await waitFor(() => {
        expect(result.current.paymentTo).toBe('2026-03-15');
      });
    });
  });

  describe('addPosition', () => {
    it('adds a new position with defaults', async () => {
      const { result } = renderHook(() => useInvoiceForm(true, defaultOptions), { wrapper });

      const initialCount = result.current.positions.length;

      act(() => {
        result.current.addPosition();
      });

      await waitFor(() => {
        expect(result.current.positions).toHaveLength(initialCount + 1);
        const newPos = result.current.positions[result.current.positions.length - 1];
        expect(newPos.name).toBe('');
        expect(newPos.quantity).toBe(1);
        expect(newPos.unit_price_gross).toBe(0);
      });
    });
  });

  describe('removePosition', () => {
    it('removes position by index', async () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            positions: [
              { name: 'A', quantity: 1, unit_price_gross: 10, vat_rate: 23 },
              { name: 'B', quantity: 1, unit_price_gross: 20, vat_rate: 23 },
            ],
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.positions).toHaveLength(2));

      act(() => {
        result.current.removePosition(0);
      });

      await waitFor(() => {
        expect(result.current.positions).toHaveLength(1);
        expect(result.current.positions[0].name).toBe('B');
      });
    });

    it('cannot remove the last position', async () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            positions: [{ name: 'Only', quantity: 1, unit_price_gross: 10, vat_rate: 23 }],
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.positions).toHaveLength(1));

      act(() => {
        result.current.removePosition(0);
      });

      expect(result.current.positions).toHaveLength(1);
    });
  });

  describe('updatePosition', () => {
    it('updates a field on a position by index', async () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            positions: [{ name: 'Original', quantity: 1, unit_price_gross: 10, vat_rate: 23 }],
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.positions[0].name).toBe('Original'));

      act(() => {
        result.current.updatePosition(0, 'name', 'Updated');
      });

      expect(result.current.positions[0].name).toBe('Updated');
    });
  });

  describe('Validation', () => {
    it('shows toast.error when buyerName is empty', async () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            customerName: '',
            positions: [{ name: 'Service', quantity: 1, unit_price_gross: 100, vat_rate: 23 }],
          }),
        { wrapper },
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(toast.error).toHaveBeenCalledWith('Podaj nazwe nabywcy');
      expect(mockFunctionsInvoke).not.toHaveBeenCalled();
    });

    it('shows toast.error when a position name is empty', async () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            customerName: 'Firma',
            positions: [{ name: '', quantity: 1, unit_price_gross: 100, vat_rate: 23 }],
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.buyerName).toBe('Firma'));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(toast.error).toHaveBeenCalledWith('Uzupelnij nazwy pozycji');
      expect(mockFunctionsInvoke).not.toHaveBeenCalled();
    });
  });

  describe('Submit - netto to gross conversion', () => {
    it('converts netto positions to gross before sending to API', async () => {
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            customerName: 'Firma',
            positions: [{ name: 'Service', quantity: 1, unit_price_gross: 100, vat_rate: 23 }],
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.buyerName).toBe('Firma'));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockFunctionsInvoke).toHaveBeenCalledWith(
        'invoicing-api',
        expect.objectContaining({
          body: expect.objectContaining({
            invoiceData: expect.objectContaining({
              positions: expect.arrayContaining([
                expect.objectContaining({ unit_price_gross: 123 }),
              ]),
            }),
          }),
        }),
      );
    });

    it('REGRESSION: does not convert exempt (vat_rate=-1) positions in netto mode', async () => {
      // Bug: exempt positions were being multiplied by (1 + -1/100) = 0.99
      // Fix: vat_rate=-1 positions are passed through unchanged
      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            customerName: 'Firma',
            positions: [{ name: 'Exempt', quantity: 1, unit_price_gross: 100, vat_rate: -1 }],
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.buyerName).toBe('Firma'));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockFunctionsInvoke).toHaveBeenCalledWith(
        'invoicing-api',
        expect.objectContaining({
          body: expect.objectContaining({
            invoiceData: expect.objectContaining({
              positions: expect.arrayContaining([
                expect.objectContaining({ unit_price_gross: 100, vat_rate: -1 }),
              ]),
            }),
          }),
        }),
      );
    });
  });

  describe('Submit - calls functions.invoke', () => {
    it('calls functions.invoke with correct action, instanceId, and invoiceData', async () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();

      const { result } = renderHook(
        () =>
          useInvoiceForm(true, {
            ...defaultOptions,
            instanceId: 'inst-test',
            salesOrderId: 'order-42',
            customerName: 'Firma Test',
            positions: [{ name: 'Service', quantity: 1, unit_price_gross: 50, vat_rate: 23 }],
            onSuccess,
            onClose,
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.buyerName).toBe('Firma Test'));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockFunctionsInvoke).toHaveBeenCalledWith(
        'invoicing-api',
        expect.objectContaining({
          body: expect.objectContaining({
            action: 'create_invoice',
            instanceId: 'inst-test',
            salesOrderId: 'order-42',
          }),
        }),
      );

      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
