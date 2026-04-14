import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReservationConfirmSettings } from './ReservationConfirmSettings';

// ---- Supabase mock ----
const mockFrom = vi.fn();

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select', 'eq', 'neq', 'or', 'order', 'limit', 'single', 'maybeSingle',
    'insert', 'update', 'delete', 'match', 'ilike', 'in', 'upsert',
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
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// ---- Toast mock ----
const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

// ---- i18n mock ----
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'pushNotifications.enabled': 'Powiadomienia push włączone',
        'pushNotifications.disabled': 'Powiadomienia push wyłączone',
      };
      return translations[key] ?? key;
    },
  }),
}));

// ---- TanStack Query mock ----
const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  };
});

// ---- Instance settings mock ----
const mockUpdateSetting = vi.fn();
const mockInstanceSettings = {
  assign_employees_to_stations: false,
  assign_employees_to_reservations: false,
  show_reservation_status: false,
};

vi.mock('@/hooks/useInstanceSettings', () => ({
  useInstanceSettings: () => ({
    data: mockInstanceSettings,
    isLoading: false,
  }),
  useUpdateInstanceSettings: () => ({ updateSetting: mockUpdateSetting }),
}));

// ---- Push subscription mock ----
const mockSubscribe = vi.fn().mockResolvedValue({ success: true });
const mockCheckSubscription = vi.fn();
let mockPushState = {
  isSubscribed: false,
  isLoading: false,
  isSupported: true,
};

vi.mock('@/hooks/usePushSubscription', () => ({
  usePushSubscription: () => ({
    isSubscribed: mockPushState.isSubscribed,
    isLoading: mockPushState.isLoading,
    subscribe: mockSubscribe,
    checkSubscription: mockCheckSubscription,
    isSupported: mockPushState.isSupported,
  }),
}));

// ---- Constants ----
const INSTANCE_ID = 'inst-test-123';

const DEFAULT_INSTANCE_DATA = {
  auto_confirm_reservations: true,
  customer_edit_cutoff_hours: 2,
  pricing_mode: 'brutto',
};

// ---- Setup helpers ----
function setupDefaultMocks(instanceData = DEFAULT_INSTANCE_DATA) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'instances') {
      return createChainMock(instanceData, null);
    }
    if (table === 'instance_features') {
      return createChainMock([], null);
    }
    return createChainMock(null, null);
  });
}

function renderComponent() {
  return render(<ReservationConfirmSettings instanceId={INSTANCE_ID} />);
}

// ---- Tests ----
describe('ReservationConfirmSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPushState = {
      isSubscribed: false,
      isLoading: false,
      isSupported: true,
    };
    mockInstanceSettings.assign_employees_to_stations = false;
    mockInstanceSettings.assign_employees_to_reservations = false;
  });

  // ----------------------------------------------------------------
  // 1. Rendering / Loading
  // ----------------------------------------------------------------
  describe('Loading state', () => {
    it('shows loading indicator initially when instanceId is provided', () => {
      // Prevent async resolution so loading stays visible
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        // Override then to never resolve
        chain.then = vi.fn(() => new Promise(() => {}));
        return chain;
      });

      renderComponent();

      expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
    });
  });

  describe('Rendering after load', () => {
    it('renders pricing mode section after loading', async () => {
      setupDefaultMocks();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Domyślny tryb cen')).toBeInTheDocument();
      });
    });

    it('renders brutto and netto radio buttons', async () => {
      setupDefaultMocks();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText('Brutto')).toBeInTheDocument();
        expect(screen.getByLabelText('Netto')).toBeInTheDocument();
      });
    });

    it('renders auto-confirm toggle', async () => {
      setupDefaultMocks();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Automatyczne potwierdzanie rezerwacji')).toBeInTheDocument();
      });
    });

    it('renders cutoff hours input with current value', async () => {
      setupDefaultMocks({ ...DEFAULT_INSTANCE_DATA, customer_edit_cutoff_hours: 5 });
      renderComponent();

      await waitFor(() => {
        const input = screen.getByLabelText('Limit edycji rezerwacji przez klienta') as HTMLInputElement;
        expect(input.value).toBe('5');
      });
    });

    it('renders employee assignment toggles', async () => {
      setupDefaultMocks();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Przypisanie pracowników do stanowisk')).toBeInTheDocument();
        expect(screen.getByText('Przypisanie pracowników do rezerwacji')).toBeInTheDocument();
      });
    });

    it('renders push notification section when push is supported', async () => {
      setupDefaultMocks();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Powiadomienia push na tym urządzeniu')).toBeInTheDocument();
      });
    });

    it('renders VIN feature toggle', async () => {
      setupDefaultMocks();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Numer VIN pojazdu')).toBeInTheDocument();
      });
    });

    it('renders protocol services feature toggle', async () => {
      setupDefaultMocks();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Usługi i kwoty na protokole')).toBeInTheDocument();
      });
    });
  });

  // ----------------------------------------------------------------
  // 2. Pricing mode
  // ----------------------------------------------------------------
  describe('Pricing mode', () => {
    it('selects brutto radio button when pricing_mode is brutto', async () => {
      setupDefaultMocks({ ...DEFAULT_INSTANCE_DATA, pricing_mode: 'brutto' });
      renderComponent();

      await waitFor(() => {
        const bruttoRadio = screen.getByLabelText('Brutto') as HTMLInputElement;
        expect(bruttoRadio).toBeChecked();
      });
    });

    it('selects netto radio button when pricing_mode is netto', async () => {
      setupDefaultMocks({ ...DEFAULT_INSTANCE_DATA, pricing_mode: 'netto' });
      renderComponent();

      await waitFor(() => {
        const nettoRadio = screen.getByLabelText('Netto') as HTMLInputElement;
        expect(nettoRadio).toBeChecked();
      });
    });

    it('calls supabase update when pricing mode is changed to netto', async () => {
      const user = userEvent.setup();
      const updateMock = vi.fn().mockReturnValue(createChainMock(null, null));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(DEFAULT_INSTANCE_DATA, null);
          (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(updateMock());
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => screen.getByLabelText('Netto'));

      await user.click(screen.getByLabelText('Netto'));

      await waitFor(() => {
        expect(updateMock).toHaveBeenCalled();
      });
    });

    it('shows success toast after pricing mode change to netto', async () => {
      const user = userEvent.setup();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(DEFAULT_INSTANCE_DATA, null);
          (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(
            createChainMock(null, null),
          );
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => screen.getByLabelText('Netto'));
      await user.click(screen.getByLabelText('Netto'));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Tryb cen netto');
      });
    });

    it('shows success toast after pricing mode change to brutto', async () => {
      const user = userEvent.setup();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(
            { ...DEFAULT_INSTANCE_DATA, pricing_mode: 'netto' },
            null,
          );
          (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(
            createChainMock(null, null),
          );
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => screen.getByLabelText('Brutto'));
      await user.click(screen.getByLabelText('Brutto'));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Tryb cen brutto');
      });
    });

    it('shows error toast and reverts pricing mode on supabase error', async () => {
      const user = userEvent.setup();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(DEFAULT_INSTANCE_DATA, null);
          (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(
            createChainMock(null, { message: 'DB error' }),
          );
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => screen.getByLabelText('Netto'));
      await user.click(screen.getByLabelText('Netto'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Błąd podczas zapisywania ustawień');
      });

      // Pricing mode should revert back to brutto
      await waitFor(() => {
        const bruttoRadio = screen.getByLabelText('Brutto') as HTMLInputElement;
        expect(bruttoRadio).toBeChecked();
      });
    });
  });

  // ----------------------------------------------------------------
  // 3. Auto-confirm toggle
  // ----------------------------------------------------------------
  describe('Auto-confirm toggle', () => {
    it('toggle calls supabase update when switched', async () => {
      const user = userEvent.setup();
      const updateMock = vi.fn().mockReturnValue(createChainMock(null, null));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(
            { ...DEFAULT_INSTANCE_DATA, auto_confirm_reservations: true },
            null,
          );
          (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(updateMock());
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => screen.getByRole('switch', { name: /automatyczne potwierdzanie/i }));

      await user.click(screen.getByRole('switch', { name: /automatyczne potwierdzanie/i }));

      await waitFor(() => {
        expect(updateMock).toHaveBeenCalled();
      });
    });

    it('shows success toast when auto-confirm is disabled', async () => {
      const user = userEvent.setup();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(
            { ...DEFAULT_INSTANCE_DATA, auto_confirm_reservations: true },
            null,
          );
          (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(
            createChainMock(null, null),
          );
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => screen.getByRole('switch', { name: /automatyczne potwierdzanie/i }));

      // Switch is currently ON (auto_confirm = true), clicking will turn it OFF
      await user.click(screen.getByRole('switch', { name: /automatyczne potwierdzanie/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Auto-potwierdzanie wyłączone');
      });
    });

    it('shows success toast when auto-confirm is enabled', async () => {
      const user = userEvent.setup();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(
            { ...DEFAULT_INSTANCE_DATA, auto_confirm_reservations: false },
            null,
          );
          (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(
            createChainMock(null, null),
          );
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => screen.getByRole('switch', { name: /automatyczne potwierdzanie/i }));

      // Switch is OFF, clicking will enable it
      await user.click(screen.getByRole('switch', { name: /automatyczne potwierdzanie/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Auto-potwierdzanie włączone');
      });
    });

    it('reverts auto-confirm state on supabase error', async () => {
      const user = userEvent.setup();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(
            { ...DEFAULT_INSTANCE_DATA, auto_confirm_reservations: true },
            null,
          );
          (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(
            createChainMock(null, { message: 'DB error' }),
          );
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      const switchEl = await waitFor(() =>
        screen.getByRole('switch', { name: /automatyczne potwierdzanie/i }),
      );

      // Switch is ON, toggle it OFF
      await user.click(switchEl);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Błąd podczas zapisywania ustawień');
      });

      // State should revert — switch should be checked again
      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /automatyczne potwierdzanie/i })).toBeChecked();
      });
    });
  });

  // ----------------------------------------------------------------
  // 4. Cutoff hours
  // ----------------------------------------------------------------
  describe('Cutoff hours input', () => {
    it('renders number input with the loaded cutoff hours value', async () => {
      setupDefaultMocks({ ...DEFAULT_INSTANCE_DATA, customer_edit_cutoff_hours: 3 });
      renderComponent();

      await waitFor(() => {
        const input = screen.getByLabelText('Limit edycji rezerwacji przez klienta') as HTMLInputElement;
        expect(input.value).toBe('3');
      });
    });

    it('updates input value when user types (local state only, no DB save on change)', async () => {
      const user = userEvent.setup();

      // Track update calls per table
      const updateMock = vi.fn().mockReturnValue(createChainMock(null, null));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(DEFAULT_INSTANCE_DATA, null);
          (chain.update as ReturnType<typeof vi.fn>).mockImplementation(updateMock);
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      const input = await waitFor(() =>
        screen.getByLabelText('Limit edycji rezerwacji przez klienta'),
      ) as HTMLInputElement;

      // Clear and type new value without blurring
      await user.clear(input);
      await user.type(input, '8');

      // Input value is updated locally
      expect(input.value).toBe('8');

      // DB update should NOT have been called yet (only fires on blur)
      // NOTE: Current implementation saves on onBlur, not onChange.
      // Typing alone does not trigger supabase.from('instances').update()
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('saves cutoff hours to DB on blur', async () => {
      const user = userEvent.setup();

      const updateMock = vi.fn().mockReturnValue(createChainMock(null, null));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(DEFAULT_INSTANCE_DATA, null);
          (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(updateMock());
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      const input = await waitFor(() =>
        screen.getByLabelText('Limit edycji rezerwacji przez klienta'),
      );

      await user.clear(input);
      await user.type(input, '6');
      await user.tab(); // blur the input

      await waitFor(() => {
        expect(updateMock).toHaveBeenCalled();
      });
    });

    it('shows success toast after saving cutoff hours', async () => {
      const user = userEvent.setup();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          const chain = createChainMock(DEFAULT_INSTANCE_DATA, null);
          (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(
            createChainMock(null, null),
          );
          return chain;
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      const input = await waitFor(() =>
        screen.getByLabelText('Limit edycji rezerwacji przez klienta'),
      );

      await user.clear(input);
      await user.type(input, '4');
      await user.tab();

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Ustawienia zapisane');
      });
    });
  });

  // ----------------------------------------------------------------
  // 5. Employee assignment toggles
  // ----------------------------------------------------------------
  describe('Employee assignment toggles', () => {
    it('calls updateSetting when assign-to-stations switch is toggled', async () => {
      const user = userEvent.setup();
      setupDefaultMocks();
      mockUpdateSetting.mockResolvedValue(undefined);

      renderComponent();

      await waitFor(() =>
        screen.getByRole('switch', { name: /przypisanie pracowników do stanowisk/i }),
      );

      await user.click(
        screen.getByRole('switch', { name: /przypisanie pracowników do stanowisk/i }),
      );

      await waitFor(() => {
        expect(mockUpdateSetting).toHaveBeenCalledWith('assign_employees_to_stations', true);
      });
    });

    it('calls updateSetting when assign-to-reservations switch is toggled', async () => {
      const user = userEvent.setup();
      setupDefaultMocks();
      mockUpdateSetting.mockResolvedValue(undefined);

      renderComponent();

      await waitFor(() =>
        screen.getByRole('switch', { name: /przypisanie pracowników do rezerwacji/i }),
      );

      await user.click(
        screen.getByRole('switch', { name: /przypisanie pracowników do rezerwacji/i }),
      );

      await waitFor(() => {
        expect(mockUpdateSetting).toHaveBeenCalledWith('assign_employees_to_reservations', true);
      });
    });

    it('shows success toast when employee setting is saved', async () => {
      const user = userEvent.setup();
      setupDefaultMocks();
      mockUpdateSetting.mockResolvedValue(undefined);

      renderComponent();

      await waitFor(() =>
        screen.getByRole('switch', { name: /przypisanie pracowników do stanowisk/i }),
      );

      await user.click(
        screen.getByRole('switch', { name: /przypisanie pracowników do stanowisk/i }),
      );

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Ustawienia zapisane');
      });
    });

    it('shows error toast when employee setting save fails', async () => {
      const user = userEvent.setup();
      setupDefaultMocks();
      mockUpdateSetting.mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() =>
        screen.getByRole('switch', { name: /przypisanie pracowników do stanowisk/i }),
      );

      await user.click(
        screen.getByRole('switch', { name: /przypisanie pracowników do stanowisk/i }),
      );

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Błąd podczas zapisywania ustawień');
      });
    });
  });

  // ----------------------------------------------------------------
  // 6. Feature toggles (VIN, protocol services)
  // ----------------------------------------------------------------
  describe('Feature toggles', () => {
    it('loads VIN feature state from instance_features table', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          return createChainMock(DEFAULT_INSTANCE_DATA, null);
        }
        if (table === 'instance_features') {
          return createChainMock(
            [
              { feature_key: 'vehicle_vin', enabled: true },
              { feature_key: 'protocol_services', enabled: false },
            ],
            null,
          );
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => {
        // VIN switch should reflect loaded state
        const vinSwitches = screen.getAllByRole('switch');
        // Find by nearby label
        const vinLabel = screen.getByText('Numer VIN pojazdu');
        const vinSwitch = vinLabel
          .closest('div[class]')
          ?.parentElement?.querySelector('button[role="switch"]');
        expect(vinSwitch).toBeTruthy();
      });
    });

    it('calls supabase upsert on instance_features when VIN toggle is clicked', async () => {
      const user = userEvent.setup();
      const upsertMock = vi.fn().mockReturnValue(createChainMock(null, null));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          return createChainMock(DEFAULT_INSTANCE_DATA, null);
        }
        if (table === 'instance_features') {
          const chain = createChainMock([], null);
          (chain.upsert as ReturnType<typeof vi.fn>).mockReturnValue(upsertMock());
          return chain;
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => screen.getByText('Numer VIN pojazdu'));

      // Find VIN switch — it's the second-to-last switch (before protocol services)
      const allSwitches = screen.getAllByRole('switch');
      // Order: auto-confirm, assign-stations, assign-reservations, push, vin, protocol
      const vinSwitch = allSwitches[allSwitches.length - 2];

      await user.click(vinSwitch);

      await waitFor(() => {
        expect(upsertMock).toHaveBeenCalled();
      });
    });

    it('calls supabase upsert on instance_features when protocol services toggle is clicked', async () => {
      const user = userEvent.setup();
      const upsertMock = vi.fn().mockReturnValue(createChainMock(null, null));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          return createChainMock(DEFAULT_INSTANCE_DATA, null);
        }
        if (table === 'instance_features') {
          const chain = createChainMock([], null);
          (chain.upsert as ReturnType<typeof vi.fn>).mockReturnValue(upsertMock());
          return chain;
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => screen.getByText('Usługi i kwoty na protokole'));

      const allSwitches = screen.getAllByRole('switch');
      const protocolSwitch = allSwitches[allSwitches.length - 1];

      await user.click(protocolSwitch);

      await waitFor(() => {
        expect(upsertMock).toHaveBeenCalled();
      });
    });

    it('invalidates instance_features query after upsert', async () => {
      const user = userEvent.setup();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          return createChainMock(DEFAULT_INSTANCE_DATA, null);
        }
        if (table === 'instance_features') {
          const chain = createChainMock([], null);
          (chain.upsert as ReturnType<typeof vi.fn>).mockReturnValue(
            createChainMock(null, null),
          );
          return chain;
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => screen.getByText('Numer VIN pojazdu'));

      const allSwitches = screen.getAllByRole('switch');
      const vinSwitch = allSwitches[allSwitches.length - 2];
      await user.click(vinSwitch);

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: ['instance_features'] }),
        );
      });
    });
  });

  // ----------------------------------------------------------------
  // 7. Push notifications
  // ----------------------------------------------------------------
  describe('Push notifications', () => {
    it('shows unsupported message when push is not supported', async () => {
      mockPushState = { isSubscribed: false, isLoading: false, isSupported: false };
      setupDefaultMocks();

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Powiadomienia push nie są wspierane')).toBeInTheDocument();
      });
    });

    it('does not show push subscribe switch when not supported', async () => {
      mockPushState = { isSubscribed: false, isLoading: false, isSupported: false };
      setupDefaultMocks();

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Powiadomienia push na tym urządzeniu')).not.toBeInTheDocument();
      });
    });

    it('shows push subscribe switch when push is supported', async () => {
      mockPushState = { isSubscribed: false, isLoading: false, isSupported: true };
      setupDefaultMocks();

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Powiadomienia push na tym urządzeniu')).toBeInTheDocument();
      });
    });

    it('shows iPhone/Android instructions when push is not supported', async () => {
      mockPushState = { isSubscribed: false, isLoading: false, isSupported: false };
      setupDefaultMocks();

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/iPhone/)).toBeInTheDocument();
        expect(screen.getByText(/Android/)).toBeInTheDocument();
      });
    });

    it('calls subscribe when push switch is toggled on', async () => {
      const user = userEvent.setup();
      mockPushState = { isSubscribed: false, isLoading: false, isSupported: true };
      mockSubscribe.mockResolvedValue({ success: true });
      setupDefaultMocks();

      renderComponent();

      await waitFor(() => screen.getByText('Powiadomienia push na tym urządzeniu'));

      // Push switch is the 5th switch (index 4): auto-confirm(0), stations(1), reservations(2), status(3), push(4)
      const allSwitches = screen.getAllByRole('switch');
      const pushSwitch = allSwitches[4];

      await user.click(pushSwitch);

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });
    });

    it('shows success toast after successful push subscription', async () => {
      const user = userEvent.setup();
      mockPushState = { isSubscribed: false, isLoading: false, isSupported: true };
      mockSubscribe.mockResolvedValue({ success: true });
      setupDefaultMocks();

      renderComponent();

      await waitFor(() => screen.getByText('Powiadomienia push na tym urządzeniu'));

      const allSwitches = screen.getAllByRole('switch');
      const pushSwitch = allSwitches[4];
      await user.click(pushSwitch);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Powiadomienia push włączone');
      });
    });

    it('shows error toast when push subscription fails with error message', async () => {
      const user = userEvent.setup();
      mockPushState = { isSubscribed: false, isLoading: false, isSupported: true };
      mockSubscribe.mockResolvedValue({ success: false, error: 'Permission denied' });
      setupDefaultMocks();

      renderComponent();

      await waitFor(() => screen.getByText('Powiadomienia push na tym urządzeniu'));

      const allSwitches = screen.getAllByRole('switch');
      const pushSwitch = allSwitches[4];
      await user.click(pushSwitch);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Permission denied');
      });
    });
  });

  // ----------------------------------------------------------------
  // 8. Edge cases
  // ----------------------------------------------------------------
  describe('Edge cases', () => {
    it('does not fetch settings when instanceId is null', () => {
      render(<ReservationConfirmSettings instanceId={null} />);

      // With null instanceId the loading effect returns early, loading remains true
      expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('defaults to brutto pricing mode when pricing_mode is not set', async () => {
      setupDefaultMocks({ ...DEFAULT_INSTANCE_DATA, pricing_mode: '' });
      renderComponent();

      await waitFor(() => {
        const bruttoRadio = screen.getByLabelText('Brutto') as HTMLInputElement;
        expect(bruttoRadio).toBeChecked();
      });
    });

    it('defaults cutoff hours to 1 when customer_edit_cutoff_hours is null', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') {
          return createChainMock(
            { auto_confirm_reservations: true, customer_edit_cutoff_hours: null, pricing_mode: 'brutto' },
            null,
          );
        }
        if (table === 'instance_features') {
          return createChainMock([], null);
        }
        return createChainMock(null, null);
      });

      renderComponent();

      await waitFor(() => {
        const input = screen.getByLabelText('Limit edycji rezerwacji przez klienta') as HTMLInputElement;
        expect(input.value).toBe('1');
      });
    });
  });
});
