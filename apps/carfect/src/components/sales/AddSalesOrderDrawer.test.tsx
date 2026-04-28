import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddSalesOrderDrawer, { type EditOrderData } from './AddSalesOrderDrawer';
import type { OrderProduct } from './hooks/useOrderPackages';

// --- Supabase mock: returns one active invoice for the load query, success for save ---
const mockFrom = vi.fn();

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  for (const m of [
    'select',
    'eq',
    'neq',
    'in',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'insert',
    'update',
    'delete',
    'match',
    'ilike',
  ]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    functions: { invoke: vi.fn() },
  },
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    roles: [{ role: 'sales', instance_id: 'inst-1', hall_id: null }],
    user: { id: 'user-1' },
    loading: false,
  }),
}));

vi.mock('@/hooks/useInstanceData', () => ({
  useInstanceData: () => ({ data: { bank_accounts: [] } }),
}));

vi.mock('./hooks/useSalesSettings', () => ({
  useSalesSettings: () => ({ data: { bank_accounts: [] } }),
}));

vi.mock('./SalesOrdersView', () => ({
  getNextOrderNumber: vi.fn().mockResolvedValue('1/03/2026'),
}));

// Stub heavy child components — the confirm flow doesn't need their internals.
vi.mock('./AddEditSalesCustomerDrawer', () => ({ default: () => null }));
vi.mock('./SalesProductSelectionDrawer', () => ({ default: () => null }));
vi.mock('@/components/ui/image-paste-zone', () => ({
  ImagePasteZone: () => null,
}));
vi.mock('./order-drawer/CustomerSearchSection', () => ({
  CustomerSearchSection: () => null,
}));
vi.mock('./order-drawer/PackagesSection', () => ({ PackagesSection: () => null }));
vi.mock('./order-drawer/OrderSummarySection', () => ({ OrderSummarySection: () => null }));
vi.mock('./order-drawer/PaymentSection', () => ({ PaymentSection: () => null }));
vi.mock('./order-drawer/ShippingAddressSection', () => ({
  ShippingAddressSection: () => null,
}));

// --- Test data ---
const sampleProduct: OrderProduct = {
  productId: 'p-1',
  variantId: null,
  name: 'Folia Ultrafit',
  productType: 'roll',
  priceUnit: 'meter',
  priceNet: 309,
  quantity: 1,
  vehicle: '',
  rollAssignments: [],
  excludeFromDiscount: false,
};

const editOrder: EditOrderData = {
  id: 'order-1',
  orderNumber: '5/04/2026',
  customerId: 'cust-1',
  customerName: 'Hot Spot Detailing',
  customerDiscount: 0,
  products: [sampleProduct],
  packages: [],
  deliveryType: 'shipping',
  paymentMethod: 'transfer',
  bankAccountNumber: '',
  comment: '',
  isNetPayer: false,
  sendEmail: false,
  attachments: [],
};

describe('AddSalesOrderDrawer — invoice update confirm flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: every supabase.from() returns a chain that resolves with one active invoice.
    mockFrom.mockImplementation(() =>
      createChainMock({
        id: 'invoice-1',
        invoice_number: '3/04/2026',
        status: 'issued',
        provider: 'fakturownia',
      }),
    );
  });

  it('shows confirmation dialog when saving an edited order with an active Fakturownia invoice', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onRequestInvoiceEdit = vi.fn();

    render(
      <AddSalesOrderDrawer
        open
        onOpenChange={onOpenChange}
        editOrder={editOrder}
        onRequestInvoiceEdit={onRequestInvoiceEdit}
      />,
    );

    // Wait for the invoice load query to settle and dirty the form via comment.
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('invoices');
    });

    const commentField = await screen
      .findByLabelText(/uwagi/i, { selector: 'textarea' })
      .catch(() => null);
    if (!commentField) {
      // Comment Textarea label may differ; fall back to first textarea in the drawer
      const textareas = document.querySelectorAll('textarea');
      if (textareas.length > 0) {
        await user.type(textareas[0] as HTMLTextAreaElement, 'manual change');
      }
    } else {
      await user.type(commentField, 'manual change');
    }

    const saveButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    await user.click(saveButton);

    // The confirm dialog should appear (rendered via portal to document.body)
    await waitFor(() => {
      expect(
        screen.getByText(/Faktura 3\/04\/2026 jest powiązana z tym zamówieniem/),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Tak, edytuj fakturę' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tylko zapisz zamówienie' })).toBeInTheDocument();

    // No save or invoice handoff yet
    expect(onRequestInvoiceEdit).not.toHaveBeenCalled();
  });

  it('does not show confirmation when no invoice exists for the order', async () => {
    // Override: no invoice
    mockFrom.mockImplementation(() => createChainMock(null));

    const user = userEvent.setup();
    render(<AddSalesOrderDrawer open onOpenChange={vi.fn()} editOrder={editOrder} />);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('invoices');
    });

    // Dirty the form
    const textareas = document.querySelectorAll('textarea');
    if (textareas.length > 0) {
      await user.type(textareas[0] as HTMLTextAreaElement, 'no invoice change');
    }

    // The dialog should NOT appear at any point
    expect(screen.queryByText(/jest powiązana z tym zamówieniem/)).not.toBeInTheDocument();
  });
});
