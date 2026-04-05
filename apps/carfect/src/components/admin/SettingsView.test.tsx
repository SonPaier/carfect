import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsView from './SettingsView';

// ---- Supabase mock ----
const mockFrom = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

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

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/logo.png' } }),
      }),
    },
  },
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('@/hooks/useAppUpdate', () => ({
  useAppUpdate: () => ({ currentVersion: '1.0.0' }),
}));

vi.mock('@/hooks/useCombinedFeatures', () => ({
  useCombinedFeatures: () => ({ hasFeature: () => false }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

vi.mock('./StationsSettings', () => ({
  default: () => <div>StationsSettings</div>,
}));
vi.mock('./WorkingHoursSettings', () => ({
  default: () => <div>WorkingHoursSettings</div>,
}));
vi.mock('./SmsMessageSettings', () => ({
  default: () => <div>SmsMessageSettings</div>,
}));
vi.mock('./ReservationConfirmSettings', () => ({
  ReservationConfirmSettings: () => <div>ReservationConfirmSettings</div>,
}));
vi.mock('./InstanceUsersTab', () => ({
  default: () => <div>InstanceUsersTab</div>,
}));
vi.mock('./halls/HallsListView', () => ({
  default: () => <div>HallsListView</div>,
}));
vi.mock('./TrainingTypesSettings', () => ({
  default: () => <div>TrainingTypesSettings</div>,
}));
vi.mock('@shared/invoicing', () => ({
  IntegrationsSettingsView: () => <div>IntegrationsSettingsView</div>,
}));

// ---- Test setup helpers ----
const INSTANCE_ID = 'inst-test-123';

const defaultInstanceData: Record<string, unknown> = {
  name: 'Test Car Wash',
  short_name: 'TCW',
  invoice_company_name: 'Test Sp. z o.o.',
  nip: '1234567890',
  phone: '+48123456789',
  reservation_phone: '+48987654321',
  email: 'test@example.com',
  address: 'ul. Testowa 1',
  logo_url: '',
  social_facebook: 'https://facebook.com/test',
  social_instagram: 'https://instagram.com/test',
  google_maps_url: 'https://maps.google.com/test',
  website: 'https://test.pl',
  contact_person: 'Jan Kowalski',
  bank_accounts: [],
};

function setupMocks() {
  mockFrom.mockImplementation(() => createChainMock(null, null));
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ error: null });
}

function renderSettingsView(instanceData = defaultInstanceData) {
  return render(
    <SettingsView
      instanceId={INSTANCE_ID}
      instanceData={instanceData}
      onInstanceUpdate={vi.fn()}
      onWorkingHoursUpdate={vi.fn()}
    />,
  );
}

async function clickSave() {
  const saveButton = screen.getByRole('button', { name: /zapisz/i });
  await userEvent.setup().click(saveButton);
}

// ---- Tests ----
describe('SettingsView - company tab validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it('renders the company tab by default', () => {
    renderSettingsView();
    expect(screen.getAllByText('Dane firmy').length).toBeGreaterThan(0);
  });

  it('shows required field name label with asterisk', () => {
    renderSettingsView();
    expect(screen.getByText(/Nazwa myjni/)).toBeInTheDocument();
  });

  describe('NIP validation', () => {
    it('accepts a valid 10-digit NIP', async () => {
      const user = userEvent.setup();
      setupMocks();
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
        return chain;
      });

      renderSettingsView({ ...defaultInstanceData, nip: '1234567890' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      // Should NOT show NIP error
      expect(mockToast.error).not.toHaveBeenCalledWith('NIP musi mieć dokładnie 10 cyfr');
    });

    it('rejects NIP with fewer than 10 digits', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, nip: '12345' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith('NIP musi mieć dokładnie 10 cyfr');
    });

    it('rejects NIP with more than 10 digits', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, nip: '12345678901' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith('NIP musi mieć dokładnie 10 cyfr');
    });

    it('strips spaces and dashes before validating NIP', async () => {
      const user = userEvent.setup();
      setupMocks();
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
        return chain;
      });

      // NIP with spaces and dashes that resolves to 10 digits
      renderSettingsView({ ...defaultInstanceData, nip: '123-456-78-90' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).not.toHaveBeenCalledWith('NIP musi mieć dokładnie 10 cyfr');
    });

    it('allows empty NIP (not required)', async () => {
      const user = userEvent.setup();
      setupMocks();
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
        return chain;
      });

      renderSettingsView({ ...defaultInstanceData, nip: '' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).not.toHaveBeenCalledWith('NIP musi mieć dokładnie 10 cyfr');
    });
  });

  describe('Email validation', () => {
    it('rejects invalid email format', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, email: 'not-an-email' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith('Podaj poprawny adres email');
    });

    it('accepts valid email', async () => {
      const user = userEvent.setup();
      setupMocks();
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
        return chain;
      });

      renderSettingsView({ ...defaultInstanceData, email: 'valid@example.com' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).not.toHaveBeenCalledWith('Podaj poprawny adres email');
    });

    it('allows empty email (not required)', async () => {
      const user = userEvent.setup();
      setupMocks();
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
        return chain;
      });

      renderSettingsView({ ...defaultInstanceData, email: '' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).not.toHaveBeenCalledWith('Podaj poprawny adres email');
    });
  });

  describe('Phone validation', () => {
    it('rejects phone with fewer than 9 digits', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, phone: '1234567' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith('Numer telefonu musi mieć co najmniej 9 cyfr');
    });

    it('accepts phone with 9 or more digits', async () => {
      const user = userEvent.setup();
      setupMocks();
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
        return chain;
      });

      renderSettingsView({ ...defaultInstanceData, phone: '123456789' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).not.toHaveBeenCalledWith(
        'Numer telefonu musi mieć co najmniej 9 cyfr',
      );
    });

    it('rejects reservation_phone with fewer than 9 digits', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, reservation_phone: '12345' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Numer telefonu do rezerwacji musi mieć co najmniej 9 cyfr',
      );
    });

    it('allows empty phone (not required)', async () => {
      const user = userEvent.setup();
      setupMocks();
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
        return chain;
      });

      renderSettingsView({ ...defaultInstanceData, phone: '', reservation_phone: '' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).not.toHaveBeenCalledWith(
        'Numer telefonu musi mieć co najmniej 9 cyfr',
      );
    });
  });

  describe('URL validation', () => {
    it('rejects website URL without http/https prefix', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, website: 'www.example.com' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Strona WWW: adres URL musi zaczynać się od http:// lub https://',
      );
    });

    it('rejects facebook URL without http/https prefix', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, social_facebook: 'facebook.com/test' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Facebook: adres URL musi zaczynać się od http:// lub https://',
      );
    });

    it('rejects instagram URL without http/https prefix', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, social_instagram: 'instagram.com/test' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Instagram: adres URL musi zaczynać się od http:// lub https://',
      );
    });

    it('rejects google_maps_url without http/https prefix', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, google_maps_url: 'maps.google.com/test' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Google Maps: adres URL musi zaczynać się od http:// lub https://',
      );
    });

    it('accepts valid https URL', async () => {
      const user = userEvent.setup();
      setupMocks();
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
        return chain;
      });

      renderSettingsView({ ...defaultInstanceData, website: 'https://valid.pl' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).not.toHaveBeenCalledWith(
        'Strona WWW: adres URL musi zaczynać się od http:// lub https://',
      );
    });

    it('allows empty URL fields (not required)', async () => {
      const user = userEvent.setup();
      setupMocks();
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
        return chain;
      });

      renderSettingsView({
        ...defaultInstanceData,
        website: '',
        social_facebook: '',
        social_instagram: '',
        google_maps_url: '',
      });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).not.toHaveBeenCalledWith(
        expect.stringContaining('adres URL musi zaczynać się od'),
      );
    });
  });

  describe('SMS short name validation', () => {
    it('rejects SMS short name longer than 11 characters', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, short_name: 'TooLongName!' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Skrócona nazwa SMS może mieć maksymalnie 11 znaków',
      );
    });

    it('accepts SMS short name of exactly 11 characters', async () => {
      const user = userEvent.setup();
      setupMocks();
      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
        return chain;
      });

      renderSettingsView({ ...defaultInstanceData, short_name: '12345678901' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).not.toHaveBeenCalledWith(
        'Skrócona nazwa SMS może mieć maksymalnie 11 znaków',
      );
    });

    it('renders the SMS short name input with maxLength=11', () => {
      renderSettingsView();
      const input = screen.getByLabelText(/Skrócona nazwa firmy/i);
      expect(input).toHaveAttribute('maxLength', '11');
    });

    it('shows max 11 characters hint text', () => {
      renderSettingsView();
      expect(screen.getByText('Używana w wiadomościach SMS, max 11 znaków')).toBeInTheDocument();
    });
  });

  describe('Required field validation', () => {
    it('rejects save when company name is empty', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, name: '' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith('Nazwa myjni jest wymagana');
    });

    it('rejects save when company name is only whitespace', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, name: '   ' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockToast.error).toHaveBeenCalledWith('Nazwa myjni jest wymagana');
    });

    it('does not call supabase when required field is missing', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, name: '' });

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      expect(mockFrom).not.toHaveBeenCalledWith('instances');
    });
  });

  describe('Concurrent save guard', () => {
    it('save button shows loading state while saving', async () => {
      let resolveUpdate!: (v: { error: null }) => void;
      const updatePromise = new Promise<{ error: null }>((res) => {
        resolveUpdate = res;
      });

      mockFrom.mockImplementation(() => {
        const chain = createChainMock(null, null);
        (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
        (chain.eq as ReturnType<typeof vi.fn>).mockReturnValue(updatePromise);
        return chain;
      });

      const user = userEvent.setup();
      renderSettingsView();

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      // Should be disabled while saving
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /zapisz/i })).toBeDisabled();
      });

      resolveUpdate({ error: null });
    });
  });
});
