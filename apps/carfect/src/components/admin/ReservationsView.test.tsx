import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReservationsView from './ReservationsView';

// ---- Supabase mock ----
let mockVehicleData: Array<{ plate: string | null; phone: string | null; vin: string }> = [];

const chainable = () => {
  const self: Record<string, unknown> = {};
  self.select = () => self;
  self.eq = () => self;
  self.not = () => self;
  self.in = () => Promise.resolve({ data: [] });
  self.maybeSingle = () => Promise.resolve({ data: null });
  self.single = () => Promise.resolve({ data: null });
  self.then = (resolve: (val: { data: typeof mockVehicleData }) => void) =>
    resolve({ data: mockVehicleData });
  return self;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'customer_vehicles') {
        return chainable();
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null }),
            single: () => Promise.resolve({ data: null }),
          }),
          in: () => Promise.resolve({ data: [] }),
        }),
      };
    },
  },
}));

vi.mock('@shared/invoicing', () => ({
  CreateInvoiceDrawer: () => null,
  useInvoicingSettings: () => ({ settings: null }),
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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/useSessionStorageState', () => ({
  useSessionStorageState: (key: string, initial: unknown) => {
    const [state, setState] = useState(initial);
    return [state, setState];
  },
}));

// ---- Types ----
interface Reservation {
  id: string;
  instance_id: string;
  customer_name: string;
  customer_phone: string;
  vehicle_plate: string;
  reservation_date: string;
  end_date?: string | null;
  start_time: string;
  end_time: string;
  station_id: string;
  status: string;
  confirmation_code: string;
  service?: { name: string; shortcut?: string | null };
  services_data?: Array<{ name: string; shortcut?: string | null }>;
  station?: { name: string; type?: string };
  price: number | null;
  price_netto?: number | null;
  photo_urls?: string[] | null;
  assigned_employee_ids?: string[] | null;
}

// ---- Test data factory ----
const makeReservation = (overrides: Partial<Reservation> = {}): Reservation => ({
  id: crypto.randomUUID(),
  instance_id: 'inst-1',
  customer_name: 'Jan Kowalski',
  customer_phone: '+48733854184',
  vehicle_plate: 'WA 12345',
  reservation_date: '2026-04-05',
  start_time: '10:00',
  end_time: '12:00',
  station_id: 'station-1',
  status: 'confirmed',
  confirmation_code: 'ABC123',
  price: 350,
  ...overrides,
});

// ---- Default props ----
const defaultProps = {
  reservations: [] as Reservation[],
  allServices: [],
  onReservationClick: vi.fn(),
  onConfirmReservation: vi.fn(),
  onRejectReservation: vi.fn(),
};

// ---- Render helper ----
const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderView = (props: Partial<typeof defaultProps> = {}) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ReservationsView {...defaultProps} {...props} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockVehicleData = [];
});

describe('ReservationsView', () => {
  describe('table headers', () => {
    it('renders all expected column headers', () => {
      renderView({ reservations: [makeReservation()] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Klient')).toBeInTheDocument();
      expect(within(table).getByText('Pojazd')).toBeInTheDocument();
      expect(within(table).getByText('Usługi')).toBeInTheDocument();
      expect(within(table).getByText('Data realizacji')).toBeInTheDocument();
      expect(within(table).getByText('Cena brutto / netto')).toBeInTheDocument();
      expect(within(table).getByText('Status')).toBeInTheDocument();
    });
  });

  describe('reservation data rendering', () => {
    it('renders customer name in the table row', () => {
      const reservation = makeReservation({ customer_name: 'Anna Nowak' });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Anna Nowak')).toBeInTheDocument();
    });

    it('renders formatted phone number', () => {
      const reservation = makeReservation({ customer_phone: '+48733854184' });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      // formatPhoneDisplay formats PL numbers like "733 854 184"
      expect(within(table).getByText('733 854 184')).toBeInTheDocument();
    });

    it('renders vehicle plate', () => {
      const reservation = makeReservation({ vehicle_plate: 'KR 99999' });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('KR 99999')).toBeInTheDocument();
    });

    it('renders price with two decimal places and zł suffix', () => {
      const reservation = makeReservation({ price: 350 });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('350.00 zł')).toBeInTheDocument();
    });

    it('renders dash when price is null', () => {
      const reservation = makeReservation({ price: null });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      // The price cell uses "—" for null price
      const cells = within(table).getAllByText('—');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('displays fractional price with two decimal places', () => {
      const reservation = makeReservation({ price: 299.99 });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('299.99 zł')).toBeInTheDocument();
    });

    it('shows netto price below brutto when price_netto is present', () => {
      const reservation = makeReservation({ price: 300, price_netto: 243.9 });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('300.00 zł')).toBeInTheDocument();
      expect(within(table).getByText('243.90 zł netto')).toBeInTheDocument();
    });

    it('does not show netto line when price_netto is null', () => {
      const reservation = makeReservation({ price: 300 });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('300.00 zł')).toBeInTheDocument();
      expect(within(table).queryByText(/zł netto/)).not.toBeInTheDocument();
    });
  });

  describe('status badge', () => {
    it('renders "Potwierdzona" label for confirmed status', () => {
      const reservation = makeReservation({ status: 'confirmed' });
      renderView({ reservations: [reservation] });

      // Both desktop table and mobile card render the badge — use getAllByText
      const badges = screen.getAllByText('Potwierdzona');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('renders "Oczekuje" label for pending status', () => {
      const reservation = makeReservation({ status: 'pending' });
      renderView({ reservations: [reservation] });

      const badges = screen.getAllByText('Oczekuje');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('renders "Anulowana" label for cancelled status', () => {
      const reservation = makeReservation({ status: 'cancelled' });
      renderView({ reservations: [reservation] });

      const badges = screen.getAllByText('Anulowana');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('renders "Zakończona" label for completed status', () => {
      const reservation = makeReservation({ status: 'completed' });
      renderView({ reservations: [reservation] });

      const badges = screen.getAllByText('Zakończona');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('row click', () => {
    it('calls onReservationClick with the reservation when row is clicked', async () => {
      const user = userEvent.setup();
      const reservation = makeReservation({ customer_name: 'Klik Test' });
      const onReservationClick = vi.fn();

      renderView({ reservations: [reservation], onReservationClick });

      const table = screen.getByRole('table');
      const row = within(table).getByText('Klik Test').closest('tr');
      await user.click(row!);

      expect(onReservationClick).toHaveBeenCalledWith(reservation);
    });
  });

  describe('pagination', () => {
    it('shows correct range text for paginated results', () => {
      const reservations = Array.from({ length: 30 }, (_, i) =>
        makeReservation({ id: `id-${i}`, customer_name: `Klient ${i}` }),
      );
      renderView({ reservations });

      // PaginationFooter renders "1–25 z 30 rezerwacji"
      expect(screen.getByText(/1.+25.+z.+30.+rezerwacji/)).toBeInTheDocument();
    });

    it('shows "1–X z X rezerwacji" when all fit on one page', () => {
      const reservations = Array.from({ length: 3 }, (_, i) =>
        makeReservation({ id: `id-${i}`, customer_name: `Klient ${i}` }),
      );
      renderView({ reservations });

      expect(screen.getByText(/1.+3.+z.+3.+rezerwacji/)).toBeInTheDocument();
    });
  });

  describe('multi-day reservation', () => {
    it('shows two date lines for multi-day reservation', () => {
      const reservation = makeReservation({
        reservation_date: '2026-04-05',
        end_date: '2026-04-07',
      });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('05.04.2026, 10:00')).toBeInTheDocument();
      expect(within(table).getByText('07.04.2026, 12:00')).toBeInTheDocument();
    });

    it('shows one date line for single-day reservation', () => {
      const reservation = makeReservation({
        reservation_date: '2026-04-05',
        end_date: null,
      });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      // Only one date line — end date should not appear separately
      const dateElements = within(table).queryAllByText('05.04.2026, 10:00');
      expect(dateElements).toHaveLength(1);
      // And no second date line for the same date
      expect(within(table).queryAllByText('05.04.2026, 12:00')).toHaveLength(0);
    });
  });

  describe('services rendering', () => {
    it('shows just the service name when there is one service', () => {
      const reservation = makeReservation({
        services_data: [{ name: 'Mycie zewnętrzne' }],
      });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Mycie zewnętrzne')).toBeInTheDocument();
    });

    it('shows first service name and "+N" count when there are multiple services', () => {
      const reservation = makeReservation({
        services_data: [
          { name: 'Mycie zewnętrzne' },
          { name: 'Mycie wewnętrzne' },
          { name: 'Polerowanie' },
        ],
      });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Mycie zewnętrzne')).toBeInTheDocument();
      expect(within(table).getByText(', +2')).toBeInTheDocument();
    });

    it('shows first service from legacy service field when services_data is absent', () => {
      const reservation = makeReservation({
        service: { name: 'Detailing' },
        services_data: undefined,
      });
      renderView({ reservations: [reservation] });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Detailing')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty state when no reservations', () => {
      renderView({ reservations: [] });

      // EmptyState renders the title key via t()
      expect(screen.getByText('reservations.noReservations')).toBeInTheDocument();
    });

    it('does not render the table when no reservations', () => {
      renderView({ reservations: [] });

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('search filter', () => {
    it('filters reservations by customer name after debounce', async () => {
      const user = userEvent.setup();
      const reservations = [
        makeReservation({ id: 'r1', customer_name: 'Jan Kowalski' }),
        makeReservation({ id: 'r2', customer_name: 'Anna Nowak' }),
      ];
      renderView({ reservations });

      const searchInput = screen.getByRole('textbox');
      await user.type(searchInput, 'Anna');

      // Wait for debounce (300ms)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Anna Nowak')).toBeInTheDocument();
      expect(within(table).queryByText('Jan Kowalski')).not.toBeInTheDocument();
    });

    it('filters reservations by VIN from customer_vehicles (matched by plate)', async () => {
      const user = userEvent.setup();
      mockVehicleData = [{ plate: 'WA 12345', phone: '+48600111333', vin: 'WVWZZZ3CZWE123456' }];
      const reservations = [
        makeReservation({
          id: 'r1',
          vehicle_plate: 'WA 12345',
          customer_phone: '+48600111333',
          customer_name: 'Jan Kowalski',
        }),
        makeReservation({
          id: 'r2',
          vehicle_plate: 'KR 99999',
          customer_phone: '+48500000000',
          customer_name: 'Anna Nowak',
        }),
      ];
      renderView({ reservations });

      const searchInput = screen.getByRole('textbox');
      await user.type(searchInput, 'WVWZZZ');

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Jan Kowalski')).toBeInTheDocument();
      expect(within(table).queryByText('Anna Nowak')).not.toBeInTheDocument();
    });

    it('filters reservations by VIN matched via customer phone (no plate on vehicle)', async () => {
      const user = userEvent.setup();
      mockVehicleData = [{ plate: null, phone: '+48600111222', vin: '4Y1SL65848Z411439' }];
      const reservations = [
        makeReservation({
          id: 'r1',
          customer_phone: '+48600111222',
          customer_name: 'Jan Kowalski',
        }),
        makeReservation({ id: 'r2', customer_phone: '+48500000000', customer_name: 'Anna Nowak' }),
      ];
      renderView({ reservations });

      const searchInput = screen.getByRole('textbox');
      await user.type(searchInput, '4Y1SL658');

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      const table = screen.getByRole('table');
      expect(within(table).getByText('Jan Kowalski')).toBeInTheDocument();
      expect(within(table).queryByText('Anna Nowak')).not.toBeInTheDocument();
    });

    it('shows empty state when search matches nothing', async () => {
      const user = userEvent.setup();
      const reservations = [makeReservation({ customer_name: 'Jan Kowalski' })];
      renderView({ reservations });

      const searchInput = screen.getByRole('textbox');
      await user.type(searchInput, 'zzznotfound');

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });
});
