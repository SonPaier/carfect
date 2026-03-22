import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmbedLeadForm from './EmbedLeadForm';

// ---- Supabase mock ----
const mockFunctionsInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
      ),
    })),
  },
}));

// Mock CarModelsProvider / CarSearchAutocomplete to avoid car model DB calls
vi.mock('@/contexts/CarModelsContext', () => ({
  CarModelsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCarModels: () => ({
    carModels: [],
    isLoading: false,
    error: null,
    searchModels: () => [],
    getModelByName: () => undefined,
    getModelsByBrand: () => [],
    getBrands: () => [],
    refetch: async () => {},
  }),
}));

vi.mock('@/components/ui/car-search-autocomplete', () => ({
  CarSearchAutocomplete: ({
    onChange,
    error,
  }: {
    value: string;
    onChange: (v: { type: 'custom'; label: string }) => void;
    error?: boolean;
  }) => (
    <input
      data-testid="car-search"
      aria-invalid={error}
      placeholder="Wyszukaj pojazd"
      onChange={(e) => onChange({ type: 'custom', label: e.target.value })}
    />
  ),
}));

// ---- Sample config ----
const mockConfig = {
  branding: {
    bg_color: '#f8fafc',
    section_bg_color: '#fff',
    section_text_color: '#1e293b',
    primary_color: '#2563eb',
    logo_url: null,
  },
  instance_info: {
    name: 'Test Studio',
    short_name: 'Test',
    address: null,
    nip: null,
    contact_person: null,
    phone: null,
  },
  templates: [
    {
      id: 'tpl-1',
      name: 'Ceramika',
      short_name: 'CER',
      description: 'Test',
      price_from: 1500,
      available_durations: [12, 24],
    },
  ],
  extras: [],
};

describe('EmbedLeadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially while fetching config', () => {
    // Never resolve — keep it pending
    mockFunctionsInvoke.mockReturnValue(new Promise(() => {}));

    render(<EmbedLeadForm />);

    // The Loader2 spinner is rendered inside a centered container
    const container = document.querySelector('.min-h-screen');
    expect(container).toBeInTheDocument();
    // lucide-react renders an svg; check via class on the wrapper
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when config fetch fails', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: new Error('Network failure') });

    render(<EmbedLeadForm />);

    await waitFor(() => {
      expect(screen.getByText('Wystąpił błąd. Spróbuj ponownie.')).toBeInTheDocument();
    });
  });

  it('renders form with template name after config loads successfully', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: mockConfig, error: null });

    render(<EmbedLeadForm />);

    await waitFor(() => {
      expect(screen.getByText('Ceramika')).toBeInTheDocument();
    });

    // Customer section heading
    expect(screen.getByText('Twoje dane')).toBeInTheDocument();
    // Vehicle section heading
    expect(screen.getByText('Pojazd')).toBeInTheDocument();
    // Package section heading
    expect(screen.getByText('Wybierz pakiety')).toBeInTheDocument();
    // Submit button
    expect(screen.getByRole('button', { name: 'Wyślij zapytanie' })).toBeInTheDocument();
  });

  it('shows validation errors when submitting without required fields', async () => {
    const user = userEvent.setup();
    mockFunctionsInvoke.mockResolvedValue({ data: mockConfig, error: null });

    render(<EmbedLeadForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Wyślij zapytanie' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Wyślij zapytanie' }));

    await waitFor(() => {
      expect(screen.getByText('Podaj imię i nazwisko')).toBeInTheDocument();
      expect(screen.getByText('Podaj adres email')).toBeInTheDocument();
      expect(screen.getByText('Zgoda jest wymagana do wysłania zapytania')).toBeInTheDocument();
    });
  });

  // Note: email format validation is tested server-side in validation_test.ts
  // jsdom + type="email" doesn't reliably update React state for invalid values

  it('submits form successfully and shows success state', async () => {
    const user = userEvent.setup();

    // First call = get-embed-config, second = submit-lead
    mockFunctionsInvoke
      .mockResolvedValueOnce({ data: mockConfig, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    render(<EmbedLeadForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Wyślij zapytanie' })).toBeInTheDocument();
    });

    // Fill required customer fields
    // Labels come from i18n keys: common.name → "Imię", common.email → "E-mail", common.phone → "Telefon"
    await user.type(screen.getByLabelText(/^Imię/i), 'Jan Kowalski');
    await user.type(screen.getByLabelText(/^E-mail/i), 'jan@example.com');
    await user.type(screen.getByLabelText(/^Telefon/i), '123456789');

    // Fill vehicle model via stubbed autocomplete
    await user.type(screen.getByTestId('car-search'), 'BMW X5');

    // Fill paint color
    await user.type(screen.getByLabelText(/Kolor lakieru/i), 'Czarny');

    // Select paint finish
    await user.click(screen.getByRole('button', { name: 'Połysk' }));

    // Select a template
    await user.click(screen.getByRole('button', { name: /Ceramika/ }));

    // Accept GDPR
    await user.click(screen.getByRole('checkbox'));

    await user.click(screen.getByRole('button', { name: 'Wyślij zapytanie' }));

    await waitFor(() => {
      expect(screen.getByText('Dziękujemy!')).toBeInTheDocument();
    });

    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      'submit-lead',
      expect.objectContaining({
        body: expect.objectContaining({
          customer_data: expect.objectContaining({
            name: 'Jan Kowalski',
            email: 'jan@example.com',
            gdpr_accepted: true,
          }),
        }),
      }),
    );
  });
});
