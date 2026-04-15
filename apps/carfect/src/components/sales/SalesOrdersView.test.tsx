import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesOrdersView from './SalesOrdersView';

// --- Supabase mock ---
const mockFrom = vi.fn();

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'or',
    'order',
    'range',
    'limit',
    'single',
    'maybeSingle',
    'insert',
    'update',
    'delete',
    'match',
    'ilike',
    'like',
  ];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({
      data: resolveData,
      error: resolveError,
      count: resolveData ? (resolveData as unknown[]).length : 0,
    }).then(resolve),
  );
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    functions: { invoke: vi.fn() },
  },
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// Mock useAuth to return a role with an instance_id
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    roles: [{ role: 'sales', instance_id: 'inst-1', hall_id: null }],
    user: { id: 'user-1' },
    loading: false,
  }),
}));

// Mock child drawers/dialogs to avoid deep dependency tree
vi.mock('./AddSalesOrderDrawer', () => ({
  default: () => null,
}));

vi.mock('@shared/invoicing', () => ({
  CreateInvoiceDrawer: () => null,
}));

// --- Test data ---
const mockOrders = [
  {
    id: 'order-1',
    order_number: '1/03/2026',
    created_at: '2026-03-10T10:00:00.000Z',
    shipped_at: null,
    customer_name: 'Firma ABC Sp. z o.o.',
    customer_id: 'cust-1',
    city: 'Warszawa',
    contact_person: 'Jan Kowalski',
    total_net: 1234.56,
    total_gross: 1518.51,
    currency: 'PLN',
    status: 'nowy',
    tracking_number: null,
    apaczka_tracking_url: null,
    comment: null,
    payment_status: 'unpaid',
    sales_order_items: [
      {
        id: 'item-1',
        name: 'Folia czarna 1524mm',
        quantity: 2,
        price_net: 500,
        price_unit: 'm2',
        vehicle: '',
        sort_order: 1,
      },
    ],
  },
  {
    id: 'order-2',
    order_number: '2/03/2026',
    created_at: '2026-03-11T12:00:00.000Z',
    shipped_at: '2026-03-12T09:00:00.000Z',
    customer_name: 'Auto Detailing XYZ',
    customer_id: 'cust-2',
    city: 'Kraków',
    contact_person: null,
    total_net: 850,
    total_gross: 1045.5,
    currency: 'PLN',
    status: 'wysłany',
    tracking_number: 'TRK123456',
    apaczka_tracking_url: 'https://tracking.example.com/TRK123456',
    comment: 'Pilne zamówienie',
    payment_status: 'unpaid',
    sales_order_items: [],
  },
];

const mockOrdersWithInvoice = [
  {
    ...mockOrders[0],
    id: 'order-inv-1',
  },
];

describe('SalesOrdersView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: sales_orders returns mockOrders, invoices returns empty
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sales_orders') {
        return createChainMock(mockOrders);
      }
      if (table === 'invoices') {
        return createChainMock([]);
      }
      return createChainMock([]);
    });
  });

  it('renders order list table headers', async () => {
    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('Nr')).toBeInTheDocument();
    });

    expect(screen.getByText('Klient')).toBeInTheDocument();
    expect(screen.getByText('Utworzono')).toBeInTheDocument();
    expect(screen.getByText('Wysłano')).toBeInTheDocument();
    expect(screen.getByText('List przewozowy')).toBeInTheDocument();
    expect(screen.getByText('Kwota netto')).toBeInTheDocument();
    expect(screen.getByText('Płatność')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('displays order data — order number and customer name', async () => {
    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('1/03/2026')).toBeInTheDocument();
    });

    expect(screen.getByText('Firma ABC Sp. z o.o.')).toBeInTheDocument();
    expect(screen.getByText('2/03/2026')).toBeInTheDocument();
    expect(screen.getByText('Auto Detailing XYZ')).toBeInTheDocument();
  });

  it('shows "Do opłacenia" badge when payment_status is unpaid', async () => {
    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getAllByText('Do opłacenia').length).toBeGreaterThan(0);
    });

    // Verify badge has the amber border CSS class representing unpaid state
    const badge = screen.getAllByText('Do opłacenia')[0];
    expect(badge.className).toContain('border-amber-500');
  });

  it('shows "Opłacone" badge when payment_status is paid', async () => {
    const paidOrder = { ...mockOrders[0], id: 'order-paid-1', payment_status: 'paid' };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sales_orders') {
        return createChainMock([paidOrder]);
      }
      return createChainMock([]);
    });

    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('Opłacone')).toBeInTheDocument();
    });

    // Verify badge has the emerald background CSS class representing paid state
    const badge = screen.getByText('Opłacone');
    expect(badge.className).toContain('bg-emerald-600');
  });

  it('shows "Opłacona (FV)" badge when invoice status is paid (auto-sync)', async () => {
    // Auto-sync mechanism: SalesOrdersView fetches both sales_orders and invoices.
    // When an invoice linked to an order has status 'paid', the component sets
    // paymentStatus to 'invoice_paid', showing "Opłacona (FV)".
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sales_orders') {
        return createChainMock(mockOrdersWithInvoice);
      }
      if (table === 'invoices') {
        // mockInvoice has status: 'paid' — this triggers the auto-sync override
        return createChainMock([
          {
            id: 'inv-1',
            sales_order_id: 'order-inv-1',
            invoice_number: 'FV/001/03/2026',
            status: 'paid',
            pdf_url: 'https://example.com/fv.pdf',
          },
        ]);
      }
      return createChainMock([]);
    });

    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('Opłacona (FV)')).toBeInTheDocument();
    });

    // Verify that mockFrom was called with 'invoices' (confirming auto-sync fetch ran)
    expect(mockFrom).toHaveBeenCalledWith('invoices');
  });

  it('search input exists and accepts text', async () => {
    const user = userEvent.setup();
    render(<SalesOrdersView />);

    const searchInput = screen.getByPlaceholderText(
      'Szukaj po firmie, mieście, osobie, produkcie...',
    );
    expect(searchInput).toBeInTheDocument();

    await user.type(searchInput, 'ABC');
    expect(searchInput).toHaveValue('ABC');
  });

  it('pagination buttons render when totalCount exceeds page size', async () => {
    // 26 orders (> 25 ITEMS_PER_PAGE) — need to report count: 26
    const manyOrders = Array.from({ length: 26 }, (_, i) => ({
      ...mockOrders[0],
      id: `order-${i}`,
      order_number: `${i + 1}/03/2026`,
    }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sales_orders') {
        // Override count in the chain to simulate 26 total
        const chain: Record<string, unknown> = {};
        const methods = ['select', 'eq', 'or', 'order', 'range', 'in', 'like'];
        methods.forEach((method) => {
          chain[method] = vi.fn(() => chain);
        });
        chain.then = vi.fn((resolve: (v: unknown) => void) =>
          Promise.resolve({ data: manyOrders, error: null, count: 26 }).then(resolve),
        );
        return chain;
      }
      if (table === 'invoices') return createChainMock([]);
      return createChainMock([]);
    });

    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    mockFrom.mockImplementation(() => createChainMock([]));

    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('Brak zamówień')).toBeInTheDocument();
    });
    expect(screen.getByText('Utwórz pierwsze zamówienie dla klienta')).toBeInTheDocument();
  });

  it('"Dodaj zamówienie" button renders', async () => {
    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dodaj zamówienie/i })).toBeInTheDocument();
    });
  });

  it('context menu has "Wystaw FV" option', async () => {
    const user = userEvent.setup();
    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('1/03/2026')).toBeInTheDocument();
    });

    // Open the MoreHorizontal dropdown for the first order
    const moreButtons = screen.getAllByRole('button', { name: '' });
    // Find button with MoreHorizontal icon (the action menu button)
    const actionButtons = moreButtons.filter((btn) => btn.querySelector('svg'));
    const moreBtn = actionButtons[actionButtons.length - 1] ?? actionButtons[0];
    await user.click(moreBtn);

    await waitFor(() => {
      expect(screen.getByText('Wystaw FV')).toBeInTheDocument();
    });
  });

  it('context menu has delete option "Usuń"', async () => {
    const user = userEvent.setup();
    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('1/03/2026')).toBeInTheDocument();
    });

    const moreButtons = screen.getAllByRole('button', { name: '' });
    const actionButtons = moreButtons.filter((btn) => btn.querySelector('svg'));
    const moreBtn = actionButtons[actionButtons.length - 1] ?? actionButtons[0];
    await user.click(moreBtn);

    await waitFor(() => {
      expect(screen.getByText('Usuń')).toBeInTheDocument();
    });
  });

  it('currency formatting shows PLN as zł', async () => {
    render(<SalesOrdersView />);

    await waitFor(() => {
      // 1234.56 formatted as Polish locale with zł suffix
      expect(screen.getByText(/1\s*234,56\s*zł/)).toBeInTheDocument();
    });
  });

  it('date formatting uses dd.MM.yyyy', async () => {
    render(<SalesOrdersView />);

    await waitFor(() => {
      // created_at: 2026-03-10 → 10.03.2026
      expect(screen.getByText('10.03.2026')).toBeInTheDocument();
    });
  });

  it('shows order status badge "Nowy" for new orders', async () => {
    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('Nowy')).toBeInTheDocument();
    });
  });

  it('shows order status badge "Wysłany" for shipped orders', async () => {
    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('Wysłany')).toBeInTheDocument();
    });
  });

  describe('status change — clearing Apaczka data (regression H4+H5)', () => {
    it('sends null for Apaczka fields when changeStatus sets non-wysłany status', async () => {
      let updatePayload: Record<string, unknown> = {};
      mockFrom.mockImplementation((table: string) => {
        if (table === 'sales_orders') {
          const chain = createChainMock(mockOrders);
          chain.update = vi.fn((payload: Record<string, unknown>) => {
            updatePayload = payload;
            return chain;
          });
          return chain;
        }
        return createChainMock([]);
      });

      const user = userEvent.setup();
      render(<SalesOrdersView />);

      await waitFor(() => {
        expect(screen.getByText('Wysłany')).toBeInTheDocument();
      });

      // Click the status badge to open dropdown
      const wysłanyBadge = screen.getByText('Wysłany');
      await user.click(wysłanyBadge);

      // Find the "Nowy" option in the dropdown menu
      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);
      });

      const nowyMenuItem = screen
        .getAllByRole('menuitem')
        .find((el) => el.textContent?.includes('Nowy'));
      if (nowyMenuItem) {
        await user.click(nowyMenuItem);

        await waitFor(() => {
          expect(updatePayload).not.toBeNull();
        });

        expect(updatePayload.status).toBe('nowy');
        expect(updatePayload.apaczka_order_id).toBeNull();
        expect(updatePayload.tracking_number).toBeNull();
        expect(updatePayload.apaczka_tracking_url).toBeNull();
        expect(updatePayload.shipped_at).toBeNull();
      }
    });
  });

  describe('payment status', () => {
    it('changePaymentStatus sends correct payload and updates badge', async () => {
      let updatePayload: Record<string, unknown> = {};
      mockFrom.mockImplementation((table: string) => {
        if (table === 'sales_orders') {
          const chain = createChainMock([mockOrders[0]]);
          chain.update = vi.fn((payload: Record<string, unknown>) => {
            updatePayload = payload;
            return chain;
          });
          return chain;
        }
        return createChainMock([]);
      });

      const user = userEvent.setup();
      render(<SalesOrdersView />);

      await waitFor(() => {
        expect(screen.getByText('Do opłacenia')).toBeInTheDocument();
      });

      // Assert initial badge state is "Do opłacenia" before any interaction
      expect(screen.getAllByText('Do opłacenia')[0]).toBeInTheDocument();

      // Click "Do opłacenia" badge to open dropdown
      const doOplaceniaBadge = screen.getByText('Do opłacenia');
      await user.click(doOplaceniaBadge);

      // Find and click "Opłacone" menuitem
      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);
      });

      const oplaconeMenuItem = screen
        .getAllByRole('menuitem')
        .find((el) => el.textContent?.includes('Opłacone'));
      expect(oplaconeMenuItem).toBeDefined();
      if (oplaconeMenuItem) {
        await user.click(oplaconeMenuItem);

        await waitFor(() => {
          expect(updatePayload).not.toBeNull();
        });

        expect(updatePayload.payment_status).toBe('paid');

        await waitFor(() => {
          expect(screen.getByText('Opłacone')).toBeInTheDocument();
        });
      }
    });

    it('changing order status does not open order details drawer', async () => {
      let updatePayload: Record<string, unknown> | null = null;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'sales_orders') {
          const chain = createChainMock([mockOrders[0]]);
          chain.update = vi.fn((payload: Record<string, unknown>) => {
            updatePayload = payload;
            return chain;
          });
          return chain;
        }
        return createChainMock([]);
      });

      const user = userEvent.setup();
      render(<SalesOrdersView />);

      await waitFor(() => {
        expect(screen.getByText('Nowy')).toBeInTheDocument();
      });

      // Click "Do opłacenia" payment status badge to open its dropdown
      const doOplaceniaBadge = screen.getByText('Do opłacenia');
      await user.click(doOplaceniaBadge);

      // Find "Opłacone" option in the dropdown
      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);
      });

      const oplaconeMenuItem = screen
        .getAllByRole('menuitem')
        .find((el) => el.textContent?.includes('Opłacone'));
      expect(oplaconeMenuItem).toBeDefined();
      if (oplaconeMenuItem) {
        await user.click(oplaconeMenuItem);

        await waitFor(() => {
          expect(updatePayload).not.toBeNull();
        });

        // Verify handler executed correctly — status set to 'paid'
        expect(updatePayload.payment_status).toBe('paid');
      }

      // AddSalesOrderDrawer is mocked as null — clicking a badge's dropdown item
      // must NOT trigger row-click handler (stopPropagation), so no dialog opens
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
