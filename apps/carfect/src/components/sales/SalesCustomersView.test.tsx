import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesCustomersView from './SalesCustomersView';

// ---- Supabase mock ----
const mockFrom = vi.fn();

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'neq', 'order', 'limit', 'single', 'insert', 'update', 'delete', 'match', 'ilike'];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// ---- useAuth mock ----
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    roles: [{ role: 'sales', instance_id: 'inst-1', hall_id: null }],
    user: null,
    session: null,
    username: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    hasRole: vi.fn(),
    hasInstanceRole: vi.fn(),
  }),
}));

// ---- Child drawer mocks (avoid full render complexity) ----
vi.mock('./AddEditSalesCustomerDrawer', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="customer-drawer">CustomerDrawer</div> : null,
}));

vi.mock('./AddSalesOrderDrawer', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="order-drawer">OrderDrawer</div> : null,
}));

// ---- Sample data ----
const mockCustomers = [
  {
    id: 'cust-1',
    name: 'Alfa Sp. z o.o.',
    contact_person: 'Anna Nowak',
    phone: '+48111222333',
    email: 'alfa@example.com',
    default_currency: 'PLN',
    nip: '1234567890',
    company: 'Alfa Sp. z o.o.',
    is_net_payer: true,
    discount_percent: 15,
    sales_notes: null,
    shipping_addressee: null,
    shipping_country_code: 'PL',
    shipping_street: 'ul. Testowa 1',
    shipping_street_line2: null,
    shipping_postal_code: '00-001',
    shipping_city: 'Warszawa',
    billing_street: 'ul. Firmowa 2',
    billing_postal_code: '00-002',
    billing_city: 'Kraków',
    billing_country_code: 'PL',
    billing_street_line2: null,
    shipping_same_as_billing: false,
  },
  {
    id: 'cust-2',
    name: 'Beta S.A.',
    contact_person: null,
    phone: '+48444555666',
    email: null,
    default_currency: 'EUR',
    nip: null,
    company: 'Beta S.A.',
    is_net_payer: false,
    discount_percent: null,
    sales_notes: null,
    shipping_addressee: null,
    shipping_country_code: 'PL',
    shipping_street: null,
    shipping_street_line2: null,
    shipping_postal_code: null,
    shipping_city: 'Gdańsk',
    billing_street: null,
    billing_postal_code: null,
    billing_city: null,
    billing_country_code: 'PL',
    billing_street_line2: null,
    shipping_same_as_billing: false,
  },
];

// Build more than 10 customers to trigger pagination
const manyCustomers = Array.from({ length: 12 }, (_, i) => ({
  ...mockCustomers[0],
  id: `cust-many-${i}`,
  name: `Firma ${String(i + 1).padStart(2, '0')}`,
  phone: `+4800000000${i}`,
  email: `firma${i}@example.com`,
}));

// ---- Helpers ----
const setupMockFrom = (customers: unknown[] = mockCustomers, orders: unknown[] = []) => {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'sales_customers') return createChainMock(customers);
    if (table === 'sales_orders') return createChainMock(orders);
    return createChainMock([]);
  });
};

// ---- Tests ----
describe('SalesCustomersView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockFrom();
  });

  it('renders the customer list table', async () => {
    render(<SalesCustomersView />);
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays customer name and phone', async () => {
    render(<SalesCustomersView />);
    await waitFor(() => {
      expect(screen.getByText('Alfa Sp. z o.o.')).toBeInTheDocument();
    });
    expect(screen.getByText('+48111222333')).toBeInTheDocument();
  });

  it('displays customer email', async () => {
    render(<SalesCustomersView />);
    await waitFor(() => {
      expect(screen.getByText('alfa@example.com')).toBeInTheDocument();
    });
  });

  it('renders a search input', async () => {
    render(<SalesCustomersView />);
    const searchInput = screen.getByPlaceholderText('Szukaj klienta...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders "Dodaj klienta" button', async () => {
    render(<SalesCustomersView />);
    expect(screen.getByRole('button', { name: /Dodaj klienta/i })).toBeInTheDocument();
  });

  it('shows empty state when there are no customers', async () => {
    setupMockFrom([]);
    render(<SalesCustomersView />);
    await waitFor(() => {
      expect(screen.getByText('Brak klientów')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching', () => {
    // Do not await resolution — check the transient loading state
    render(<SalesCustomersView />);
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
  });

  it('renders pagination controls when there are more than 10 customers', async () => {
    setupMockFrom(manyCustomers);
    render(<SalesCustomersView />);
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Następna/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Poprzednia/i })).toBeInTheDocument();
  });

  it('opens customer drawer when clicking a row', async () => {
    const user = userEvent.setup();
    render(<SalesCustomersView />);
    await waitFor(() => {
      expect(screen.getByText('Alfa Sp. z o.o.')).toBeInTheDocument();
    });
    const row = screen.getByText('Alfa Sp. z o.o.').closest('tr')!;
    await user.click(row);
    expect(screen.getByTestId('customer-drawer')).toBeInTheDocument();
  });

  it('renders the actions dropdown with a delete option', async () => {
    const user = userEvent.setup();
    render(<SalesCustomersView />);
    await waitFor(() => {
      expect(screen.getByText('Alfa Sp. z o.o.')).toBeInTheDocument();
    });
    const menuTriggers = screen.getAllByRole('button', { name: '' });
    // The MoreHorizontal button has no text label — click the first one
    await user.click(menuTriggers[0]);
    await waitFor(() => {
      expect(screen.getByText('Usuń')).toBeInTheDocument();
    });
  });

  it('displays discount percent in expanded row', async () => {
    const user = userEvent.setup();
    render(<SalesCustomersView />);
    await waitFor(() => {
      expect(screen.getByText('Alfa Sp. z o.o.')).toBeInTheDocument();
    });
    // Click the expand chevron inside the name cell
    const nameCell = screen.getByText('Alfa Sp. z o.o.').closest('div')!;
    await user.click(nameCell);
    await waitFor(() => {
      expect(screen.getByText('15%')).toBeInTheDocument();
    });
  });

  describe('customer delete — FK error handling (regression H10)', () => {
    it('shows clear message when customer has orders (FK constraint)', async () => {
      const { toast } = await import('sonner');
      const deleteChain = createChainMock(null, { code: '23503', message: 'FK violation' });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'sales_customers') {
          const chain = createChainMock(mockCustomers);
          chain.delete = vi.fn(() => deleteChain);
          return chain;
        }
        if (table === 'sales_orders') return createChainMock([]);
        return createChainMock([]);
      });

      const user = userEvent.setup();
      render(<SalesCustomersView />);

      await waitFor(() => {
        expect(screen.getByText('Alfa Sp. z o.o.')).toBeInTheDocument();
      });

      // Open actions menu
      const moreButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('svg'),
      );
      if (moreButtons.length > 0) {
        await user.click(moreButtons[moreButtons.length - 1]);
        const deleteItem = screen.queryByText('Usuń');
        if (deleteItem) {
          await user.click(deleteItem);
          // Confirm in dialog
          const confirmBtn = screen.queryByText('Usuń', { selector: 'button' });
          if (confirmBtn) await user.click(confirmBtn);
        }
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('powiązane zamówienia'),
        );
      });
    });
  });
});
