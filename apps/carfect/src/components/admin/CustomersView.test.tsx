import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomersView from './CustomersView';

// ---- Supabase mock ----
const mockFrom = vi.fn();

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'or',
    'order',
    'limit',
    'single',
    'insert',
    'update',
    'delete',
    'match',
    'ilike',
  ];
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

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('./CustomerEditDrawer', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="customer-edit-drawer">CustomerEditDrawer</div> : null,
}));

vi.mock('./SendSmsDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="send-sms-dialog">SendSmsDialog</div> : null,
}));

vi.mock('@/hooks/useInstanceFeatures', () => ({
  useInstanceFeatures: () => ({
    features: {},
    loading: false,
    hasFeature: () => false,
    getFeatureParams: () => null,
    refetch: vi.fn(),
  }),
}));

// ---- Sample data ----
const mockCustomer = {
  id: 'cust-1',
  name: 'Jan Kowalski',
  phone: '+48733854184',
  email: 'jan@example.com',
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  phone_verified: true,
  company: null,
  nip: null,
  address: null,
};

const mockVehicle = {
  phone: '+48733854184',
  model: 'BMW X5',
  plate: 'WA12345',
};

const defaultProps = {
  instanceId: 'inst-1',
};

/**
 * Sets up mockFrom to return different data per table name.
 * 'customers' → customersData, 'customer_vehicles' → vehiclesData
 */
const setupMocks = (
  customersData: unknown = [],
  vehiclesData: unknown = [],
  customersError: unknown = null,
  vehiclesError: unknown = null,
) => {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'customers') {
      return createChainMock(customersData, customersError);
    }
    if (table === 'customer_vehicles') {
      return createChainMock(vehiclesData, vehiclesError);
    }
    return createChainMock(null);
  });
};

describe('CustomersView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('vehicle matching by normalized E.164 phone', () => {
    it('displays vehicle model for a customer whose phone matches vehicle phone in E.164 format', async () => {
      setupMocks([mockCustomer], [mockVehicle]);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('BMW X5')).toBeInTheDocument();
      });

      expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    });

    it('matches vehicle to customer when both phones are identical E.164 strings (+48733854184)', async () => {
      const customer = { ...mockCustomer, phone: '+48733854184' };
      const vehicle = { phone: '+48733854184', model: 'Toyota Corolla', plate: 'PO99999' };

      setupMocks([customer], [vehicle]);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Toyota Corolla')).toBeInTheDocument();
      });
    });

    it('does not display vehicles for a customer when phone does not match any vehicle', async () => {
      const customer = { ...mockCustomer, phone: '+48700000000' };
      // vehicle has a different phone
      const vehicle = { phone: '+48111111111', model: 'Audi A4', plate: 'KR00001' };

      setupMocks([customer], [vehicle]);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      });

      expect(screen.queryByText('Audi A4')).not.toBeInTheDocument();
    });

    it('shows vehicles for the correct customer when multiple customers share the view', async () => {
      const customer1 = {
        ...mockCustomer,
        id: 'cust-1',
        name: 'Anna Nowak',
        phone: '+48733854184',
      };
      const customer2 = {
        id: 'cust-2',
        name: 'Piotr Wiśniewski',
        phone: '+48600100200',
        email: null,
        notes: null,
        created_at: '2026-01-02T00:00:00Z',
        phone_verified: null,
        company: null,
        nip: null,
        address: null,
      };
      const vehicle1 = { phone: '+48733854184', model: 'BMW X5', plate: 'WA12345' };
      const vehicle2 = { phone: '+48600100200', model: 'Ford Focus', plate: 'GD55555' };

      setupMocks([customer1, customer2], [vehicle1, vehicle2]);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('BMW X5')).toBeInTheDocument();
      });

      expect(screen.getByText('Ford Focus')).toBeInTheDocument();
    });
  });

  describe('customer list rendering', () => {
    it('renders customer names in the list', async () => {
      setupMocks([mockCustomer], [mockVehicle]);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      });
    });

    it('renders multiple customers', async () => {
      const customer2 = {
        id: 'cust-2',
        name: 'Maria Zielinska',
        phone: '+48500600700',
        email: null,
        notes: null,
        created_at: '2026-02-01T00:00:00Z',
        phone_verified: null,
        company: null,
        nip: null,
        address: null,
      };

      setupMocks([mockCustomer, customer2], []);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        expect(screen.getByText('Maria Zielinska')).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state message when no customers exist', async () => {
      setupMocks([], []);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Brak klientów')).toBeInTheDocument();
      });
    });

    it('does not show empty state when customers exist', async () => {
      setupMocks([mockCustomer], [mockVehicle]);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      });

      expect(screen.queryByText('Brak klientów')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator while fetching', () => {
      // Never resolves during this check
      mockFrom.mockImplementation(() => {
        const chain: Record<string, unknown> = {};
        const methods = ['select', 'eq', 'order'];
        methods.forEach((m) => {
          chain[m] = vi.fn(() => chain);
        });
        chain.then = vi.fn(() => new Promise(() => {}));
        return chain;
      });

      render(<CustomersView {...defaultProps} />);

      expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
    });
  });

  describe('search filtering', () => {
    it('filters customers by name when search query is entered', async () => {
      const user = userEvent.setup();
      const customer2 = {
        id: 'cust-2',
        name: 'Maria Zielinska',
        phone: '+48500600700',
        email: null,
        notes: null,
        created_at: '2026-02-01T00:00:00Z',
        phone_verified: null,
        company: null,
        nip: null,
        address: null,
      };

      setupMocks([mockCustomer, customer2], []);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/Szukaj/), 'Maria');

      await waitFor(() => {
        expect(screen.getByText('Maria Zielinska')).toBeInTheDocument();
        expect(screen.queryByText('Jan Kowalski')).not.toBeInTheDocument();
      });
    });

    it('filters customers by vehicle model', async () => {
      const user = userEvent.setup();
      const customer2 = {
        id: 'cust-2',
        name: 'Maria Zielinska',
        phone: '+48500600700',
        email: null,
        notes: null,
        created_at: '2026-02-01T00:00:00Z',
        phone_verified: null,
        company: null,
        nip: null,
        address: null,
      };
      const vehicle2 = { phone: '+48500600700', model: 'Audi A4', plate: 'KR11111' };

      setupMocks([mockCustomer, customer2], [mockVehicle, vehicle2]);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/Szukaj/), 'Audi');

      await waitFor(() => {
        expect(screen.getByText('Maria Zielinska')).toBeInTheDocument();
        expect(screen.queryByText('Jan Kowalski')).not.toBeInTheDocument();
      });
    });

    it('filters customers by vehicle VIN', async () => {
      const user = userEvent.setup();
      const customer2 = {
        id: 'cust-2',
        name: 'Robert OMD',
        phone: '+48604138302',
        email: null,
        notes: null,
        created_at: '2026-02-01T00:00:00Z',
        phone_verified: null,
        company: null,
        nip: null,
        address: null,
      };
      const vehicleWithVin = { phone: '+48604138302', model: 'Audi A7', plate: null, vin: '4Y1SL65848Z411439' };

      setupMocks([mockCustomer, customer2], [mockVehicle, vehicleWithVin]);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/Szukaj/), '4Y1SL658');

      await waitFor(() => {
        expect(screen.getByText('Robert OMD')).toBeInTheDocument();
        expect(screen.queryByText('Jan Kowalski')).not.toBeInTheDocument();
      });
    });

    it('shows no results state when search matches no customers', async () => {
      const user = userEvent.setup();

      setupMocks([mockCustomer], [mockVehicle]);

      render(<CustomersView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/Szukaj/), 'xyznonexistent');

      await waitFor(() => {
        expect(screen.getByText('Brak wyników')).toBeInTheDocument();
      });
    });
  });

  describe('does not fetch when instanceId is null', () => {
    it('does not call supabase when instanceId is null', () => {
      render(<CustomersView instanceId={null} />);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
