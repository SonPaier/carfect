import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateInvoiceDrawer } from '@shared/invoicing';
import { toast } from 'sonner';

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Supabase mock helpers
const mockFunctionsInvoke = vi.fn();

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'insert',
    'update',
    'delete',
    'upsert',
  ];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

const mockFrom = vi.fn();
const mockSupabaseClient = {
  from: (...args: unknown[]) => mockFrom(...args),
  functions: { invoke: mockFunctionsInvoke },
};

const settingsData = {
  instance_id: 'inst-1',
  provider: 'fakturownia',
  provider_config: {},
  default_vat_rate: 23,
  default_payment_days: 14,
  default_document_kind: 'vat',
  default_currency: 'PLN',
  default_payment_type: 'transfer',
  default_place: '',
  default_seller_person: '',
  auto_send_email: false,
  active: true,
};

const customerData = {
  nip: '1234567890',
  email: 'test@firma.pl',
  company: 'FIRMA TEST',
  billing_city: 'Warszawa',
  billing_postal_code: '00-001',
  billing_street: 'ul. Testowa 1',
};

function setupMocks(overrides: { settingsActive?: boolean } = {}) {
  const activeSettings =
    overrides.settingsActive === false ? { ...settingsData, active: false } : settingsData;

  mockFrom.mockImplementation((table: string) => {
    if (table === 'invoicing_settings') return createChainMock(activeSettings);
    if (table === 'sales_customers') return createChainMock(customerData);
    if (table === 'calendar_items') return createChainMock(null);
    return createChainMock(null);
  });

  mockFunctionsInvoke.mockResolvedValue({
    data: { invoice: { invoice_number: 'FV/1/2026' } },
    error: null,
  });
}

function renderDrawer(props: Record<string, unknown> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    instanceId: 'inst-1',
    salesOrderId: 'order-1',
    customerId: 'cust-1',
    customerName: 'FIRMA TEST',
    customerEmail: 'test@firma.pl',
    customerNip: '1234567890',
    positions: [{ name: 'Crystal XP', quantity: 2, unit_price_gross: 75.65, vat_rate: 23 }],
    supabaseClient: mockSupabaseClient,
    customerTable: 'sales_customers',
  };
  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <CreateInvoiceDrawer {...defaultProps} {...props} />
      </QueryClientProvider>,
    ),
    defaultProps,
  };
}

describe('CreateInvoiceDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  describe('Form rendering', () => {
    it('renders drawer header', () => {
      renderDrawer();
      expect(screen.getAllByText('Wystaw fakture').length).toBeGreaterThanOrEqual(1);
    });

    it('renders buyer name pre-filled from customerName prop', async () => {
      renderDrawer();
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Nazwa nabywcy *');
        expect(nameInput).toHaveValue('FIRMA TEST');
      });
    });

    it('renders buyer email pre-filled from customerEmail prop', async () => {
      renderDrawer();
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Email');
        expect(emailInput).toHaveValue('test@firma.pl');
      });
    });

    it('renders buyer NIP pre-filled from customerNip prop', async () => {
      renderDrawer();
      await waitFor(() => {
        const nipInput = screen.getByPlaceholderText('0000000000');
        expect(nipInput).toHaveValue('1234567890');
      });
    });

    it('renders positions passed as props', async () => {
      renderDrawer();
      await waitFor(() => {
        const positionInput = screen.getByDisplayValue('Crystal XP');
        expect(positionInput).toBeInTheDocument();
      });
    });

    it('renders document type select', () => {
      renderDrawer();
      expect(screen.getByText('Typ dokumentu')).toBeInTheDocument();
    });

    it('renders Nabywca section', () => {
      renderDrawer();
      expect(screen.getByText('Nabywca')).toBeInTheDocument();
    });

    it('renders Pozycje section', () => {
      renderDrawer();
      expect(screen.getByText('Pozycje')).toBeInTheDocument();
    });

    it('renders Anuluj and Wystaw fakture buttons', () => {
      renderDrawer();
      expect(screen.getByRole('button', { name: 'Anuluj' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Wystaw fakture' })).toBeInTheDocument();
    });
  });

  describe('Submit button state', () => {
    it('submit button is enabled when settings active', async () => {
      renderDrawer();
      await waitFor(() => {
        const submitBtn = screen.getByRole('button', { name: 'Wystaw fakture' });
        expect(submitBtn).not.toBeDisabled();
      });
    });

    it('submit button is disabled when settings not active', async () => {
      setupMocks({ settingsActive: false });
      renderDrawer();
      await waitFor(() => {
        const submitBtn = screen.getByRole('button', { name: 'Wystaw fakture' });
        expect(submitBtn).toBeDisabled();
      });
    });

    it('shows configuration warning when settings not active', async () => {
      setupMocks({ settingsActive: false });
      renderDrawer();
      await waitFor(() => {
        expect(screen.getByText(/Skonfiguruj integracje fakturowania/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation errors', () => {
    it('shows error toast when buyer name is empty', async () => {
      const { user } = renderDrawer();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Nazwa nabywcy *')).toBeInTheDocument();
      });

      // Clear buyer name
      const nameInput = screen.getByPlaceholderText('Nazwa nabywcy *');
      await user.clear(nameInput);

      const submitBtn = screen.getByRole('button', { name: 'Wystaw fakture' });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Podaj nazwe nabywcy');
      });
    });

    it('shows error toast when position name is empty', async () => {
      const { user } = renderDrawer({
        positions: [{ name: '', quantity: 1, unit_price_gross: 100, vat_rate: 23 }],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Wystaw fakture' })).not.toBeDisabled();
      });

      const submitBtn = screen.getByRole('button', { name: 'Wystaw fakture' });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Uzupelnij nazwy pozycji');
      });
    });
  });

  describe('Successful submission', () => {
    it('calls functions.invoke with action create_invoice', async () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();
      const { user } = renderDrawer({ onSuccess, onClose });

      // Wait for settings to load so button is enabled
      await waitFor(() => {
        const submitBtn = screen.getByRole('button', { name: 'Wystaw fakture' });
        expect(submitBtn).not.toBeDisabled();
      });

      const submitBtn = screen.getByRole('button', { name: 'Wystaw fakture' });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockFunctionsInvoke).toHaveBeenCalledWith(
          'invoicing-api',
          expect.objectContaining({
            body: expect.objectContaining({
              action: 'create_invoice',
              instanceId: 'inst-1',
              salesOrderId: 'order-1',
            }),
          }),
        );
      });
    });

    it('calls onSuccess after successful submit', async () => {
      const onSuccess = vi.fn();
      const { user } = renderDrawer({ onSuccess });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Wystaw fakture' })).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: 'Wystaw fakture' }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('calls onClose after successful submit', async () => {
      const onClose = vi.fn();
      const { user } = renderDrawer({ onClose });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Wystaw fakture' })).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: 'Wystaw fakture' }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows success toast with invoice number after submit', async () => {
      const { user } = renderDrawer();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Wystaw fakture' })).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: 'Wystaw fakture' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Faktura FV/1/2026 wystawiona');
      });
    });

    it('updates sales_customers after successful submit when NIP provided', async () => {
      const { user } = renderDrawer();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Wystaw fakture' })).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: 'Wystaw fakture' }));

      await waitFor(() => {
        // The from('sales_customers').update(...).eq(...) chain was called
        const updateCalls = mockFrom.mock.calls.filter((c) => c[0] === 'sales_customers');
        expect(updateCalls.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Anuluj button', () => {
    it('calls onClose when Anuluj is clicked', async () => {
      const onClose = vi.fn();
      const { user } = renderDrawer({ onClose });

      await user.click(screen.getByRole('button', { name: 'Anuluj' }));

      expect(onClose).toHaveBeenCalled();
    });
  });
});
