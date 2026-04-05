import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import HallCard, { type Hall } from './HallCard';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const defaultHall: Hall = {
  id: 'hall-1',
  instance_id: 'inst-1',
  name: 'Warsztat Główny',
  slug: 'warsztat-glowny',
  station_ids: ['station-1', 'station-2'],
  visible_fields: {
    customer_name: true,
    customer_phone: true,
    vehicle_plate: true,
    services: true,
    admin_notes: false,
    price: false,
  },
  allowed_actions: {
    add_services: true,
    change_time: false,
    change_station: false,
    edit_reservation: false,
    delete_reservation: false,
  },
  sort_order: 1,
  active: true,
};

const defaultStations = [
  { id: 'station-1', name: 'Stanowisko A' },
  { id: 'station-2', name: 'Stanowisko B' },
  { id: 'station-3', name: 'Stanowisko C' },
];

const createDefaultProps = () => ({
  hall: defaultHall,
  hallNumber: 1,
  instanceSlug: 'armcar',
  stations: defaultStations,
  assignedUsername: undefined as string | undefined,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
});

const renderCard = (overrides: Partial<ReturnType<typeof createDefaultProps>> = {}) => {
  const props = { ...createDefaultProps(), ...overrides };
  return {
    ...render(
      <TestWrapper>
        <HallCard {...props} />
      </TestWrapper>
    ),
    props,
  };
};

describe('HallCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Hall name and URL
  // ============================================
  describe('hall name and URL display', () => {
    it('renders hall name', () => {
      renderCard();
      expect(screen.getByText('Warsztat Główny')).toBeInTheDocument();
    });

    it('renders the full hall URL with instanceSlug and hallNumber', () => {
      renderCard({ hallNumber: 3, instanceSlug: 'armcar' });
      expect(
        screen.getByText('https://armcar.admin.carfect.pl/halls/3')
      ).toBeInTheDocument();
    });

    it('URL changes with different hallNumber', () => {
      renderCard({ hallNumber: 7, instanceSlug: 'testshop' });
      expect(
        screen.getByText('https://testshop.admin.carfect.pl/halls/7')
      ).toBeInTheDocument();
    });
  });

  // ============================================
  // Assigned user display
  // ============================================
  describe('assigned user display', () => {
    it('shows username badge when assignedUsername is provided', () => {
      renderCard({ assignedUsername: 'jan.kowalski' });
      expect(screen.getByText('jan.kowalski')).toBeInTheDocument();
    });

    it('shows hint text when no user is assigned', () => {
      renderCard({ assignedUsername: undefined });
      expect(
        screen.getByText('Przypisz użytkownika w zakładce Użytkownicy, wybierając rolę Kalendarz')
      ).toBeInTheDocument();
    });

    it('does not show hint text when user is assigned', () => {
      renderCard({ assignedUsername: 'jan.kowalski' });
      expect(
        screen.queryByText('Przypisz użytkownika w zakładce Użytkownicy, wybierając rolę Kalendarz')
      ).not.toBeInTheDocument();
    });
  });

  // ============================================
  // Visible fields display
  // ============================================
  describe('visible fields display', () => {
    it('shows field names for enabled visible fields', () => {
      renderCard({
        hall: {
          ...defaultHall,
          visible_fields: {
            customer_name: true,
            customer_phone: true,
            vehicle_plate: false,
            services: false,
            admin_notes: false,
            price: false,
          },
        },
      });
      expect(screen.getByText('Imię klienta')).toBeInTheDocument();
      expect(screen.getByText('Telefon klienta')).toBeInTheDocument();
    });

    it('filters out vehicle_plate from visible fields badges', () => {
      renderCard({
        hall: {
          ...defaultHall,
          visible_fields: {
            customer_name: false,
            customer_phone: false,
            vehicle_plate: true,
            services: false,
            admin_notes: false,
            price: false,
          },
        },
      });
      expect(screen.queryByText('Pojazd')).not.toBeInTheDocument();
    });

    it('filters out services from visible fields badges', () => {
      renderCard({
        hall: {
          ...defaultHall,
          visible_fields: {
            customer_name: false,
            customer_phone: false,
            vehicle_plate: false,
            services: true,
            admin_notes: false,
            price: false,
          },
        },
      });
      expect(screen.queryByText('Usługi')).not.toBeInTheDocument();
    });

    it('shows "no fields selected" message when all known visible fields are disabled or filtered', () => {
      renderCard({
        hall: {
          ...defaultHall,
          visible_fields: {
            customer_name: false,
            customer_phone: false,
            vehicle_plate: true, // filtered out
            services: true,       // filtered out
            admin_notes: false,
            price: false,
          },
        },
      });
      expect(screen.getByText('Brak wybranych pól')).toBeInTheDocument();
    });

    it('shows price field when enabled', () => {
      renderCard({
        hall: {
          ...defaultHall,
          visible_fields: {
            customer_name: false,
            customer_phone: false,
            vehicle_plate: false,
            services: false,
            admin_notes: false,
            price: true,
          },
        },
      });
      expect(screen.getByText('Cena')).toBeInTheDocument();
    });

    it('shows admin_notes field when enabled', () => {
      renderCard({
        hall: {
          ...defaultHall,
          visible_fields: {
            customer_name: false,
            customer_phone: false,
            vehicle_plate: false,
            services: false,
            admin_notes: true,
            price: false,
          },
        },
      });
      expect(screen.getByText('Notatki wewnętrzne')).toBeInTheDocument();
    });
  });

  // ============================================
  // Allowed actions display
  // ============================================
  describe('allowed actions display', () => {
    it('shows add_services badge when add_services is true', () => {
      renderCard({
        hall: {
          ...defaultHall,
          allowed_actions: {
            add_services: true,
            change_time: false,
            change_station: false,
            edit_reservation: false,
            delete_reservation: false,
          },
        },
      });
      expect(screen.getByText('Dodawanie usług')).toBeInTheDocument();
    });

    it('filters out legacy action keys — only add_services is a known key', () => {
      // change_time, change_station etc. are legacy and should NOT appear
      renderCard({
        hall: {
          ...defaultHall,
          allowed_actions: {
            add_services: false,
            change_time: true,    // legacy — must not appear
            change_station: true, // legacy — must not appear
            edit_reservation: true,    // legacy — must not appear
            delete_reservation: true,  // legacy — must not appear
          },
        },
      });
      expect(screen.getByText('Brak dozwolonych akcji')).toBeInTheDocument();
    });

    it('shows "no actions selected" when add_services is disabled', () => {
      renderCard({
        hall: {
          ...defaultHall,
          allowed_actions: {
            add_services: false,
            change_time: false,
            change_station: false,
            edit_reservation: false,
            delete_reservation: false,
          },
        },
      });
      expect(screen.getByText('Brak dozwolonych akcji')).toBeInTheDocument();
    });
  });

  // ============================================
  // Station names display
  // ============================================
  describe('station names display', () => {
    it('shows station names for station_ids that match provided stations', () => {
      renderCard();
      expect(screen.getByText('Stanowisko A')).toBeInTheDocument();
      expect(screen.getByText('Stanowisko B')).toBeInTheDocument();
    });

    it('does not show station not in station_ids', () => {
      renderCard();
      expect(screen.queryByText('Stanowisko C')).not.toBeInTheDocument();
    });

    it('shows "no stations selected" when station_ids is empty', () => {
      renderCard({
        hall: { ...defaultHall, station_ids: [] },
      });
      expect(screen.getByText('Brak wybranych stanowisk')).toBeInTheDocument();
    });

    it('shows "no stations selected" when no stations match station_ids', () => {
      renderCard({
        hall: { ...defaultHall, station_ids: ['nonexistent-id'] },
        stations: defaultStations,
      });
      expect(screen.getByText('Brak wybranych stanowisk')).toBeInTheDocument();
    });
  });

  // ============================================
  // Edit and delete callbacks
  // ============================================
  describe('edit and delete callbacks', () => {
    it('calls onEdit with the hall when edit menu item is clicked', async () => {
      const user = userEvent.setup();
      const { props } = renderCard();

      const menuTrigger = document.querySelector('button[aria-haspopup="menu"]') as HTMLElement;
      await user.click(menuTrigger);

      await waitFor(() => {
        expect(screen.getByText('Edytuj')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edytuj'));
      expect(props.onEdit).toHaveBeenCalledTimes(1);
      expect(props.onEdit).toHaveBeenCalledWith(defaultHall);
    });

    it('opens delete confirmation dialog when delete menu item is clicked', async () => {
      const user = userEvent.setup();
      renderCard();

      const menuTrigger = document.querySelector('button[aria-haspopup="menu"]') as HTMLElement;
      await user.click(menuTrigger);

      await waitFor(() => {
        expect(screen.getByText('Usuń')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Usuń'));

      await waitFor(() => {
        expect(screen.getByText('Usuń kalendarz')).toBeInTheDocument();
      });
    });

    it('calls onDelete with hall id when delete is confirmed', async () => {
      const user = userEvent.setup();
      const { props } = renderCard();

      const menuTrigger = document.querySelector('button[aria-haspopup="menu"]') as HTMLElement;
      await user.click(menuTrigger);

      await waitFor(() => {
        expect(screen.getByText('Usuń')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Usuń'));

      await waitFor(() => {
        expect(screen.getByText('Usuń kalendarz')).toBeInTheDocument();
      });

      // There are now two "Usuń" elements — confirm button is the last one
      const allDeleteButtons = screen.getAllByText('Usuń');
      await user.click(allDeleteButtons[allDeleteButtons.length - 1]);

      expect(props.onDelete).toHaveBeenCalledTimes(1);
      expect(props.onDelete).toHaveBeenCalledWith('hall-1');
    });

    it('does not call onDelete when delete is cancelled', async () => {
      const user = userEvent.setup();
      const { props } = renderCard();

      const menuTrigger = document.querySelector('button[aria-haspopup="menu"]') as HTMLElement;
      await user.click(menuTrigger);

      await waitFor(() => {
        expect(screen.getByText('Usuń')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Usuń'));

      await waitFor(() => {
        expect(screen.getByText('Usuń kalendarz')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Anuluj'));

      expect(props.onDelete).not.toHaveBeenCalled();
    });
  });
});
