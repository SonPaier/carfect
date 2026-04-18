import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntegrationsView } from './IntegrationsView';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'integrations.sections.invoicing': 'Płatności i fakturowanie',
        'integrations.sections.ppfDistributors': 'Dystrybutorzy i producenci folii PPF',
        'integrations.fakturownia.title': 'Fakturownia',
        'integrations.fakturownia.description': 'Automatyczne wystawianie faktur przez Fakturownia.pl',
        'integrations.ifirma.title': 'iFirma',
        'integrations.ifirma.description': 'Wystawiaj faktury przez iFirma.pl',
        'integrations.ultrafit.title': 'Ultrafit Poland',
        'integrations.ultrafit.description': 'Zamawiasz folie w Ultrafit Poland? Połącz konto i śledź swoje zamówienia.',
        'integrations.ultrafit.descriptionConnected': 'Twoje zamówienia Ultrafit są dostępne w Carfect.',
        'integrations.ultrafit.requestAccess': 'Poproś o dostęp',
        'integrations.ultrafit.contactNumber': 'tel. 666 610 222',
        'integrations.ultrafit.connected': 'Połączono',
        'integrations.ultrafit.goToOrders': 'Przejdź do zamówień',
        'integrations.status.connected': 'Połączono',
        'integrations.status.configure': 'Skonfiguruj',
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// Mock useUltrafitLink
const mockUseUltrafitLink = vi.fn();
vi.mock('@/hooks/useUltrafitLink', () => ({
  useUltrafitLink: (...args: unknown[]) => mockUseUltrafitLink(...args),
}));

// Mock useInvoicingSettings
const mockUseInvoicingSettings = vi.fn();
vi.mock('@shared/invoicing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/invoicing')>();
  return {
    ...actual,
    useInvoicingSettings: (...args: unknown[]) => mockUseInvoicingSettings(...args),
    FakturowniaSettingsView: ({ onBack }: { onBack: () => void }) => (
      <div>
        <span>FakturowniaSettingsView</span>
        <button onClick={onBack}>Wróć</button>
      </div>
    ),
    IfirmaSettingsView: ({ onBack }: { onBack: () => void }) => (
      <div>
        <span>IfirmaSettingsView</span>
        <button onClick={onBack}>Wróć</button>
      </div>
    ),
  };
});

// Mock logo imports
vi.mock('@/assets/integrations/ultrafit-logo.png', () => ({ default: 'ultrafit-logo.png' }));
vi.mock('@/assets/integrations/fakturownia-logo.png', () => ({ default: 'fakturownia-logo.png' }));
vi.mock('@/assets/integrations/ifirma-logo.png', () => ({ default: 'ifirma-logo.png' }));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderView(onNavigateToUltrafit = vi.fn()) {
  return render(
    <IntegrationsView instanceId="inst-1" onNavigateToUltrafit={onNavigateToUltrafit} />,
    { wrapper: createWrapper() },
  );
}

describe('IntegrationsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUltrafitLink.mockReturnValue({ isLinked: false, isLoading: false, externalCustomerId: null });
    mockUseInvoicingSettings.mockReturnValue({ settings: null, isLoading: false });
  });

  it('renders invoicing section header', () => {
    renderView();
    expect(screen.getByText('Płatności i fakturowanie')).toBeInTheDocument();
  });

  it('renders PPF distributors section header', () => {
    renderView();
    expect(screen.getByText('Dystrybutorzy i producenci folii PPF')).toBeInTheDocument();
  });

  it('renders Ultrafit card with "request access" button when not linked', () => {
    mockUseUltrafitLink.mockReturnValue({ isLinked: false, isLoading: false, externalCustomerId: null });
    renderView();
    expect(screen.getByText('Poproś o dostęp')).toBeInTheDocument();
    expect(screen.getByText('tel. 666 610 222')).toBeInTheDocument();
  });

  it('renders Ultrafit card with "go to orders" button when linked', () => {
    mockUseUltrafitLink.mockReturnValue({ isLinked: true, isLoading: false, externalCustomerId: 'ext-uuid' });
    renderView();
    expect(screen.getByText('Przejdź do zamówień')).toBeInTheDocument();
    expect(screen.queryByText('Poproś o dostęp')).not.toBeInTheDocument();
  });

  it('calls onNavigateToUltrafit when "go to orders" button is clicked', async () => {
    const user = userEvent.setup();
    mockUseUltrafitLink.mockReturnValue({ isLinked: true, isLoading: false, externalCustomerId: 'ext-uuid' });
    const onNavigate = vi.fn();
    renderView(onNavigate);

    await user.click(screen.getByText('Przejdź do zamówień'));
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it('shows FakturowniaSettingsView when Fakturownia card is clicked', async () => {
    const user = userEvent.setup();
    renderView();

    const fakturowniaCard = screen.getByRole('button', { name: /fakturownia/i });
    await user.click(fakturowniaCard);

    expect(screen.getByText('FakturowniaSettingsView')).toBeInTheDocument();
  });

  it('returns to list when back button is clicked from FakturowniaSettingsView', async () => {
    const user = userEvent.setup();
    renderView();

    const fakturowniaCard = screen.getByRole('button', { name: /fakturownia/i });
    await user.click(fakturowniaCard);

    expect(screen.getByText('FakturowniaSettingsView')).toBeInTheDocument();

    await user.click(screen.getByText('Wróć'));

    expect(screen.queryByText('FakturowniaSettingsView')).not.toBeInTheDocument();
    expect(screen.getByText('Płatności i fakturowanie')).toBeInTheDocument();
  });
});
