import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerEditDrawer from './CustomerEditDrawer';

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
    'maybeSingle',
    'insert',
    'update',
    'delete',
    'match',
    'ilike',
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

vi.mock('./CustomerRemindersTab', () => ({
  CustomerRemindersTab: () => <div data-testid="reminders-tab">RemindersTab</div>,
}));

vi.mock('./CustomerVehiclesEditor', () => ({
  CustomerVehiclesEditor: ({
    vehicles,
    onChange,
  }: {
    vehicles: { id?: string; model: string; carSize: string }[];
    onChange: (v: unknown[]) => void;
  }) => (
    <div data-testid="vehicles-editor">
      {vehicles.map((v, i) => (
        <button
          key={v.id || `v-${i}`}
          data-testid={`vehicle-chip-${i}`}
          onClick={() => onChange(vehicles.filter((_, idx) => idx !== i))}
        >
          {v.model}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./SendSmsDialog', () => ({
  default: () => <div data-testid="send-sms-dialog" />,
}));

// ---- Sample data ----
const mockCustomer = {
  id: 'cust-1',
  name: 'Jan Kowalski',
  phone: '+48111222333',
  email: 'jan@example.com',
  notes: null,
  company: null,
  nip: null,
};

const defaultProps = {
  customer: mockCustomer,
  instanceId: 'inst-1',
  open: true,
  onClose: vi.fn(),
  onCustomerUpdated: vi.fn(),
  onOpenReservation: vi.fn(),
};

// Helper: set up mockFrom to return empty data for all table queries by default
// except for the table specified by `tableName`, which returns the given data.
const mockTableResponse = (tableName: string, data: unknown = null, error: unknown = null) => {
  mockFrom.mockImplementation((table: string) => {
    if (table === tableName) {
      return createChainMock(data, error);
    }
    return createChainMock(null, null);
  });
};

describe('CustomerEditDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all queries return empty data
    mockFrom.mockImplementation(() => createChainMock(null, null));
  });

  // ---- Test 1: Phone uniqueness validation on edit ----
  describe('phone uniqueness validation on edit', () => {
    it('shows error toast and does not save when new phone already belongs to another customer', async () => {
      const user = userEvent.setup();

      // Queries by table:
      // 1. reservations — visit history fetch
      // 2. unified_services — service names
      // 3. customer_vehicles — fetch vehicles
      // 4. customers (uniqueness check) — returns an existing customer
      // 5. customers (update) — should NOT be called
      mockFrom.mockImplementation((table: string) => {
        if (table === 'customers') {
          // uniqueness check: phone is taken by another customer
          return createChainMock({ id: 'cust-99' }, null);
        }
        return createChainMock(null, null);
      });

      render(<CustomerEditDrawer {...defaultProps} />);

      // Enter edit mode
      const editButton = await screen.findByRole('button', { name: /Edytuj/i });
      await user.click(editButton);

      // Clear the phone field and type a new number
      const phoneInput = screen.getByPlaceholderText(/Telefon/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '+48999888777');

      // Click save
      const saveButton = screen.getByRole('button', { name: /Zapisz/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Klient z tym numerem telefonu już istnieje');
      });

      // The update query for the customer table should NOT have been called
      // (we check that toast.success was never called)
      expect(mockToast.success).not.toHaveBeenCalled();
    });
  });

  // ---- Test 2: Phone change cascades to customer_vehicles ----
  describe('phone change cascades to customer_vehicles', () => {
    it('updates customer_vehicles with new phone when customer phone changes', async () => {
      const user = userEvent.setup();

      // Track calls per table
      const updateChain = createChainMock(null, null);
      const updateSpy = vi.fn(() => updateChain);

      const chainWithUpdate: Record<string, unknown> = {};
      const methods = [
        'select',
        'eq',
        'neq',
        'order',
        'limit',
        'single',
        'maybeSingle',
        'in',
        'delete',
        'insert',
      ];
      methods.forEach((m) => {
        chainWithUpdate[m] = vi.fn(() => chainWithUpdate);
      });
      chainWithUpdate.update = updateSpy;
      chainWithUpdate.then = vi.fn((resolve: (v: unknown) => void) =>
        Promise.resolve({ data: null, error: null }).then(resolve),
      );

      // Capture which table's update was called last
      const vehiclesUpdateChain = createChainMock(null, null);
      const vehiclesUpdateSpy = vi.fn(() => vehiclesUpdateChain);

      mockFrom.mockImplementation((table: string) => {
        if (table === 'customers') {
          // First call: uniqueness check returns null (phone is free)
          // Second call: update the customer
          const c = createChainMock(null, null);
          (c as any).update = vi.fn(() => c);
          return c;
        }
        if (table === 'customer_vehicles') {
          const c = createChainMock([], null);
          (c as any).update = vehiclesUpdateSpy;
          return c;
        }
        return createChainMock(null, null);
      });

      render(<CustomerEditDrawer {...defaultProps} />);

      const editButton = await screen.findByRole('button', { name: /Edytuj/i });
      await user.click(editButton);

      const phoneInput = screen.getByPlaceholderText(/Telefon/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '+48999888777');

      const saveButton = screen.getByRole('button', { name: /Zapisz/i });
      await user.click(saveButton);

      await waitFor(() => {
        // The customer_vehicles table should have been queried for update
        expect(vehiclesUpdateSpy).toHaveBeenCalled();
      });

      // The update should have been called with the new normalized phone
      const updateArg = vehiclesUpdateSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(updateArg).toHaveProperty('phone');
      // Normalized phone for '+48999888777' should contain 9+ digits
      expect(String(updateArg.phone).replace(/\D/g, '').length).toBeGreaterThanOrEqual(9);
    });
  });

  // ---- Test 3: Delete vehicle triggers onCustomerUpdated ----
  describe('delete vehicle chip triggers onCustomerUpdated', () => {
    it('calls onCustomerUpdated after deleting a vehicle with an id', async () => {
      const user = userEvent.setup();
      const onCustomerUpdated = vi.fn();

      // Build a delete chain that is thenable so the await in handleDeleteVehicle resolves
      const deleteChain = createChainMock(null, null);
      const deleteVehiclesSpy = vi.fn(() => deleteChain);

      // customer_vehicles fetch returns one vehicle; delete is also handled
      mockFrom.mockImplementation((table: string) => {
        if (table === 'customer_vehicles') {
          const c = createChainMock([{ id: 'veh-1', model: 'BMW X5', car_size: 'L' }], null);
          (c as any).delete = deleteVehiclesSpy;
          return c;
        }
        return createChainMock(null, null);
      });

      render(<CustomerEditDrawer {...defaultProps} onCustomerUpdated={onCustomerUpdated} />);

      // Wait for vehicles to be loaded and rendered in view mode (info tab)
      await waitFor(() => {
        expect(screen.getByText('BMW X5')).toBeInTheDocument();
      });

      // In view mode the vehicle chip contains a <button> with an X svg icon
      // Find it by looking for a button that is a descendant of the chip container
      // The chip has class containing "rounded-full" on the wrapping div
      const allButtons = screen.getAllByRole('button');
      // The X button inside the vehicle chip is a <button> that has an <svg> child
      // and is inside an element that contains "BMW X5" text
      const vehicleChipXButton = allButtons.find((btn) => {
        return (
          btn.querySelector('svg') !== null && btn.closest('div')?.textContent?.includes('BMW X5')
        );
      });

      expect(vehicleChipXButton).toBeDefined();
      await user.click(vehicleChipXButton!);

      await waitFor(() => {
        expect(onCustomerUpdated).toHaveBeenCalled();
      });
    });
  });

  // ---- Test 4: Visit card click calls onClose and onOpenReservation ----
  describe('visit card click', () => {
    it('calls onClose and onOpenReservation(visitId) when a visit card is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onOpenReservation = vi.fn();

      const mockVisit = {
        id: 'res-42',
        reservation_date: '2026-03-01',
        start_time: '10:00:00',
        vehicle_plate: 'WA 12345',
        price: 350,
        status: 'completed',
        service_ids: [],
        service_items: [],
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return createChainMock([mockVisit], null);
        }
        return createChainMock(null, null);
      });

      render(
        <CustomerEditDrawer
          {...defaultProps}
          onClose={onClose}
          onOpenReservation={onOpenReservation}
        />,
      );

      // Switch to the visits tab (TabsTrigger renders as role="tab")
      const visitsTab = await screen.findByRole('tab', { name: /Historia wizyt/i });
      await user.click(visitsTab);

      // Wait for the visit card to appear
      await waitFor(() => {
        expect(screen.getByText('WA 12345')).toBeInTheDocument();
      });

      // Click the visit card
      const visitCard = screen.getByText('WA 12345').closest('button');
      expect(visitCard).not.toBeNull();
      await user.click(visitCard!);

      expect(onClose).toHaveBeenCalled();
      expect(onOpenReservation).toHaveBeenCalledWith('res-42');
    });

    it('does not call onOpenReservation when handler is not provided', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const mockVisit = {
        id: 'res-99',
        reservation_date: '2026-02-10',
        start_time: '09:00:00',
        vehicle_plate: 'KR 99999',
        price: null,
        status: null,
        service_ids: [],
        service_items: [],
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return createChainMock([mockVisit], null);
        }
        return createChainMock(null, null);
      });

      render(
        <CustomerEditDrawer {...defaultProps} onClose={onClose} onOpenReservation={undefined} />,
      );

      const visitsTab = await screen.findByRole('tab', { name: /Historia wizyt/i });
      await user.click(visitsTab);

      await waitFor(() => {
        expect(screen.getByText('KR 99999')).toBeInTheDocument();
      });

      const visitCard = screen.getByText('KR 99999').closest('button');
      await user.click(visitCard!);

      // onClose should NOT have been called since onOpenReservation is undefined
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ---- Additional: empty visit history ----
  describe('visit history', () => {
    it('shows empty state when there are no visits', async () => {
      const user = userEvent.setup();

      mockFrom.mockImplementation(() => createChainMock([], null));

      render(<CustomerEditDrawer {...defaultProps} />);

      const visitsTab = await screen.findByRole('tab', { name: /Historia wizyt/i });
      await user.click(visitsTab);

      await waitFor(() => {
        expect(screen.getByText(/Brak historii wizyt/i)).toBeInTheDocument();
      });
    });
  });

  // ---- Additional: required field validation ----
  describe('required field validation', () => {
    it('shows required error toast when name or phone is empty on save', async () => {
      const user = userEvent.setup();

      mockFrom.mockImplementation(() => createChainMock(null, null));

      render(<CustomerEditDrawer {...defaultProps} />);

      const editButton = await screen.findByRole('button', { name: /Edytuj/i });
      await user.click(editButton);

      // Clear the name field
      const nameInput = screen.getByPlaceholderText(/Imię i nazwisko/i);
      await user.clear(nameInput);

      const saveButton = screen.getByRole('button', { name: /Zapisz/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Wymagane');
      });
    });
  });
});
