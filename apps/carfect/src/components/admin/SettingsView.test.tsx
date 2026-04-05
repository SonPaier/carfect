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

vi.mock('./StationsSettings', () => ({ default: () => <div>StationsSettings</div> }));
vi.mock('./WorkingHoursSettings', () => ({ default: () => <div>WorkingHoursSettings</div> }));
vi.mock('./SmsMessageSettings', () => ({ default: () => <div>SmsMessageSettings</div> }));
vi.mock('./ReservationConfirmSettings', () => ({ ReservationConfirmSettings: () => <div>ReservationConfirmSettings</div> }));
vi.mock('./InstanceUsersTab', () => ({ default: () => <div>InstanceUsersTab</div> }));
vi.mock('./halls/HallsListView', () => ({ default: () => <div>HallsListView</div> }));
vi.mock('./TrainingTypesSettings', () => ({ default: () => <div>TrainingTypesSettings</div> }));
vi.mock('@shared/invoicing', () => ({ IntegrationsSettingsView: () => <div>IntegrationsSettingsView</div> }));

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

function setupSaveMock() {
  mockFrom.mockImplementation(() => {
    const chain = createChainMock(null, null);
    (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
    (chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
    return chain;
  });
}

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
  const user = userEvent.setup();
  const saveButton = screen.getByRole('button', { name: /zapisz/i });
  await user.click(saveButton);
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
    it('shows inline error for NIP with fewer than 10 digits', async () => {
      renderSettingsView({ ...defaultInstanceData, nip: '12345' });
      await clickSave();
      expect(screen.getByText('NIP musi mieć dokładnie 10 cyfr')).toBeInTheDocument();
    });

    it('shows inline error for NIP with more than 10 digits', async () => {
      renderSettingsView({ ...defaultInstanceData, nip: '12345678901' });
      await clickSave();
      expect(screen.getByText('NIP musi mieć dokładnie 10 cyfr')).toBeInTheDocument();
    });

    it('accepts valid 10-digit NIP without error', async () => {
      setupSaveMock();
      renderSettingsView({ ...defaultInstanceData, nip: '1234567890' });
      await clickSave();
      expect(screen.queryByText('NIP musi mieć dokładnie 10 cyfr')).not.toBeInTheDocument();
    });

    it('strips spaces and dashes before validating NIP', async () => {
      setupSaveMock();
      renderSettingsView({ ...defaultInstanceData, nip: '123-456-78-90' });
      await clickSave();
      expect(screen.queryByText('NIP musi mieć dokładnie 10 cyfr')).not.toBeInTheDocument();
    });

    it('allows empty NIP (not required)', async () => {
      setupSaveMock();
      renderSettingsView({ ...defaultInstanceData, nip: '' });
      await clickSave();
      expect(screen.queryByText('NIP musi mieć dokładnie 10 cyfr')).not.toBeInTheDocument();
    });
  });

  describe('Email validation', () => {
    it('shows inline error for invalid email', async () => {
      renderSettingsView({ ...defaultInstanceData, email: 'not-an-email' });
      await clickSave();
      expect(screen.getByText('Podaj poprawny adres email')).toBeInTheDocument();
    });

    it('accepts valid email without error', async () => {
      setupSaveMock();
      renderSettingsView({ ...defaultInstanceData, email: 'valid@example.com' });
      await clickSave();
      expect(screen.queryByText('Podaj poprawny adres email')).not.toBeInTheDocument();
    });

    it('allows empty email (not required)', async () => {
      setupSaveMock();
      renderSettingsView({ ...defaultInstanceData, email: '' });
      await clickSave();
      expect(screen.queryByText('Podaj poprawny adres email')).not.toBeInTheDocument();
    });
  });

  describe('Phone validation', () => {
    it('shows inline error for phone with fewer than 9 digits', async () => {
      renderSettingsView({ ...defaultInstanceData, phone: '1234567' });
      await clickSave();
      expect(screen.getByText('Numer telefonu musi mieć co najmniej 9 cyfr')).toBeInTheDocument();
    });

    it('accepts phone with 9+ digits without error', async () => {
      setupSaveMock();
      renderSettingsView({ ...defaultInstanceData, phone: '123456789' });
      await clickSave();
      expect(screen.queryByText('Numer telefonu musi mieć co najmniej 9 cyfr')).not.toBeInTheDocument();
    });

    it('shows inline error for reservation phone with fewer than 9 digits', async () => {
      renderSettingsView({ ...defaultInstanceData, reservation_phone: '12345' });
      await clickSave();
      // Both phone errors have same text, check at least one is shown
      const errors = screen.getAllByText('Numer telefonu musi mieć co najmniej 9 cyfr');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('allows empty phone fields (not required)', async () => {
      setupSaveMock();
      renderSettingsView({ ...defaultInstanceData, phone: '', reservation_phone: '' });
      await clickSave();
      expect(screen.queryByText('Numer telefonu musi mieć co najmniej 9 cyfr')).not.toBeInTheDocument();
    });
  });

  describe('URL validation', () => {
    it('shows inline error for website URL without http/https', async () => {
      renderSettingsView({ ...defaultInstanceData, website: 'www.example.com' });
      await clickSave();
      expect(screen.getByText('Adres musi zaczynać się od http:// lub https://')).toBeInTheDocument();
    });

    it('shows inline error for facebook URL without http/https', async () => {
      renderSettingsView({ ...defaultInstanceData, social_facebook: 'facebook.com/test' });
      await clickSave();
      expect(screen.getByText('Adres musi zaczynać się od http:// lub https://')).toBeInTheDocument();
    });

    it('shows inline error for instagram URL without http/https', async () => {
      renderSettingsView({ ...defaultInstanceData, social_instagram: 'instagram.com/test' });
      await clickSave();
      expect(screen.getByText('Adres musi zaczynać się od http:// lub https://')).toBeInTheDocument();
    });

    it('shows inline error for google maps URL without http/https', async () => {
      renderSettingsView({ ...defaultInstanceData, google_maps_url: 'maps.google.com/test' });
      await clickSave();
      expect(screen.getByText('Adres musi zaczynać się od http:// lub https://')).toBeInTheDocument();
    });

    it('accepts valid https URL without error', async () => {
      setupSaveMock();
      renderSettingsView({ ...defaultInstanceData, website: 'https://valid.pl' });
      await clickSave();
      expect(screen.queryByText('Adres musi zaczynać się od http:// lub https://')).not.toBeInTheDocument();
    });

    it('allows empty URL fields (not required)', async () => {
      setupSaveMock();
      renderSettingsView({
        ...defaultInstanceData,
        website: '', social_facebook: '', social_instagram: '', google_maps_url: '',
      });
      await clickSave();
      expect(screen.queryByText('Adres musi zaczynać się od http:// lub https://')).not.toBeInTheDocument();
    });
  });

  describe('SMS short name validation', () => {
    it('shows inline error for SMS name longer than 11 chars', async () => {
      renderSettingsView({ ...defaultInstanceData, short_name: 'TooLongName!' });
      await clickSave();
      expect(screen.getByText('Maksymalnie 11 znaków')).toBeInTheDocument();
    });

    it('accepts SMS name of exactly 11 characters without error', async () => {
      setupSaveMock();
      renderSettingsView({ ...defaultInstanceData, short_name: '12345678901' });
      await clickSave();
      expect(screen.queryByText('Maksymalnie 11 znaków')).not.toBeInTheDocument();
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
    it('shows inline error when company name is empty', async () => {
      renderSettingsView({ ...defaultInstanceData, name: '' });
      await clickSave();
      expect(screen.getByText('Nazwa myjni jest wymagana')).toBeInTheDocument();
    });

    it('shows inline error when company name is only whitespace', async () => {
      renderSettingsView({ ...defaultInstanceData, name: '   ' });
      await clickSave();
      expect(screen.getByText('Nazwa myjni jest wymagana')).toBeInTheDocument();
    });

    it('does not call supabase when validation fails', async () => {
      renderSettingsView({ ...defaultInstanceData, name: '' });
      await clickSave();
      expect(mockFrom).not.toHaveBeenCalledWith('instances');
    });
  });

  describe('Inline error clears on edit', () => {
    it('clears error when user starts typing in field', async () => {
      const user = userEvent.setup();
      renderSettingsView({ ...defaultInstanceData, name: '' });
      await clickSave();
      expect(screen.getByText('Nazwa myjni jest wymagana')).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/Nazwa myjni/i);
      await user.type(nameInput, 'N');

      expect(screen.queryByText('Nazwa myjni jest wymagana')).not.toBeInTheDocument();
    });
  });

  describe('Multiple errors shown at once', () => {
    it('shows all validation errors simultaneously', async () => {
      renderSettingsView({
        ...defaultInstanceData,
        name: '',
        nip: '123',
        email: 'bad',
      });
      await clickSave();

      expect(screen.getByText('Nazwa myjni jest wymagana')).toBeInTheDocument();
      expect(screen.getByText('NIP musi mieć dokładnie 10 cyfr')).toBeInTheDocument();
      expect(screen.getByText('Podaj poprawny adres email')).toBeInTheDocument();
    });
  });

  describe('Error styling', () => {
    it('adds destructive border to invalid field', async () => {
      renderSettingsView({ ...defaultInstanceData, nip: '123' });
      await clickSave();

      const nipInput = screen.getByLabelText(/NIP/i);
      expect(nipInput.className).toContain('border-destructive');
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

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /zapisz/i })).toBeDisabled();
      });

      resolveUpdate({ error: null });
    });
  });
});
