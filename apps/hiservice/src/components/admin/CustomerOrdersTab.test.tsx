import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerOrdersTab from './CustomerOrdersTab';

// ---- Mock data ----
const mockOrders = [
  {
    id: 'order-1',
    title: 'Wymiana filtrów',
    item_date: '2026-04-01',
    end_date: '2026-04-01',
    status: 'confirmed',
    price: 500,
    assigned_employee_ids: [],
  },
];

const mockOrderDetail = {
  id: 'order-1',
  title: 'Wymiana filtrów',
  item_date: '2026-04-01',
  end_date: '2026-04-01',
  start_time: '09:00',
  end_time: '12:00',
  column_id: 'col-1',
  status: 'confirmed',
  admin_notes: null,
  price: 500,
  customer_id: 'cust-1',
  customer_address_id: null,
  assigned_employee_ids: [],
  customer_name: 'Jan Kowalski',
  customer_phone: '+48111222333',
  customer_email: null,
  photo_urls: [],
  checklist_items: [],
};

// ---- Supabase mock ----
const createChain = (resolveData: unknown = []) => {
  const chain: Record<string, any> = {};
  ['select', 'eq', 'in', 'order', 'limit', 'not', 'gte', 'lte', 'neq', 'is', 'or'].forEach(
    (m) => {
      chain[m] = vi.fn(() => chain);
    },
  );
  chain.single = vi.fn(() => Promise.resolve({ data: resolveData, error: null }));
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: resolveData, error: null }));
  chain.then = (resolve: any) => Promise.resolve({ data: resolveData, error: null }).then(resolve);
  return chain;
};

let fromHandler: (table: string) => any;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => fromHandler(args[0]),
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '' }),
}));

// Mock CalendarItemDetailsDrawer to avoid rendering the full 1700-line component
vi.mock('./CalendarItemDetailsDrawer', () => ({
  default: ({ open, item }: { open: boolean; item: any }) =>
    open && item ? <div data-testid="detail-drawer">{item.title}</div> : null,
}));

// ---- Helpers ----
const renderTab = () =>
  render(<CustomerOrdersTab customerId="cust-1" instanceId="inst-1" />);

beforeEach(() => {
  vi.clearAllMocks();

  fromHandler = (table: string) => {
    if (table === 'calendar_items') {
      // First call is list, subsequent call is single item detail
      const chain = createChain(mockOrders);
      chain.single = vi.fn(() =>
        Promise.resolve({ data: mockOrderDetail, error: null }),
      );
      return chain;
    }
    if (table === 'calendar_item_services') {
      return createChain([]);
    }
    if (table === 'calendar_columns') {
      return createChain([{ id: 'col-1', name: 'Kolumna 1' }]);
    }
    if (table === 'employees') {
      return createChain([]);
    }
    return createChain([]);
  };
});

describe('CustomerOrdersTab', () => {
  it('renders order cards after loading', async () => {
    renderTab();

    await waitFor(() => {
      expect(screen.getByText('Wymiana filtrów')).toBeInTheDocument();
    });
  });

  it('shows empty state when no orders', async () => {
    fromHandler = (table: string) => {
      if (table === 'calendar_items') return createChain([]);
      if (table === 'calendar_columns') return createChain([]);
      return createChain([]);
    };

    renderTab();

    await waitFor(() => {
      expect(screen.getByText('Brak zleceń')).toBeInTheDocument();
    });
  });

  it('opens detail drawer when order card is clicked', async () => {
    const user = userEvent.setup();
    renderTab();

    // Wait for card to render
    await waitFor(() => {
      expect(screen.getByText('Wymiana filtrów')).toBeInTheDocument();
    });

    // Click the order card
    await user.click(screen.getByText('Wymiana filtrów'));

    // Detail drawer should open with the item title
    await waitFor(() => {
      expect(screen.getByTestId('detail-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('detail-drawer')).toHaveTextContent('Wymiana filtrów');
    });
  });

  it('renders price on the card when not hidden', async () => {
    renderTab();

    await waitFor(() => {
      expect(screen.getByText('500.00 zł')).toBeInTheDocument();
    });
  });

  it('hides price when hidePrices is true', async () => {
    render(<CustomerOrdersTab customerId="cust-1" instanceId="inst-1" hidePrices />);

    await waitFor(() => {
      expect(screen.getByText('Wymiana filtrów')).toBeInTheDocument();
    });

    expect(screen.queryByText('500.00 zł')).not.toBeInTheDocument();
  });

  it('renders status badge', async () => {
    renderTab();

    await waitFor(() => {
      expect(screen.getByText('Do wykonania')).toBeInTheDocument();
    });
  });
});
