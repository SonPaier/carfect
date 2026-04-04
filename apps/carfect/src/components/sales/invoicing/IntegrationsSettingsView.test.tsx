import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntegrationsSettingsView } from '@shared/invoicing';

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'insert',
    'update',
    'delete',
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

function buildSupabaseClient(resolveData: unknown = null) {
  return {
    from: vi.fn(() => createChainMock(resolveData)),
  };
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    user: userEvent.setup(),
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

describe('IntegrationsSettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Fakturownia card when providers includes fakturownia', async () => {
    const supabaseClient = buildSupabaseClient(null);

    renderWithProviders(
      <IntegrationsSettingsView
        instanceId="inst-1"
        supabaseClient={supabaseClient}
        providers={['fakturownia']}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Fakturownia')).toBeInTheDocument();
    });
  });

  it('does not show iFirma when providers=["fakturownia"]', async () => {
    const supabaseClient = buildSupabaseClient(null);

    renderWithProviders(
      <IntegrationsSettingsView
        instanceId="inst-1"
        supabaseClient={supabaseClient}
        providers={['fakturownia']}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Fakturownia')).toBeInTheDocument();
    });
    expect(screen.queryByText('iFirma')).not.toBeInTheDocument();
  });

  it('shows both providers when no providers prop is passed', async () => {
    const supabaseClient = buildSupabaseClient(null);

    renderWithProviders(
      <IntegrationsSettingsView instanceId="inst-1" supabaseClient={supabaseClient} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Fakturownia')).toBeInTheDocument();
    });
    expect(screen.getByText('iFirma')).toBeInTheDocument();
  });

  it('shows config form and common settings when Fakturownia is toggled on', async () => {
    const supabaseClient = buildSupabaseClient(null);

    const { user } = renderWithProviders(
      <IntegrationsSettingsView
        instanceId="inst-1"
        supabaseClient={supabaseClient}
        providers={['fakturownia']}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Fakturownia')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(screen.getByText('Domena konta')).toBeInTheDocument();
    expect(screen.getByText('Token API')).toBeInTheDocument();
    expect(screen.getByText('Testuj polaczenie')).toBeInTheDocument();
    expect(screen.getByText('Ustawienia fakturowania')).toBeInTheDocument();
    expect(screen.getByText('Domyslna stawka VAT')).toBeInTheDocument();
    expect(screen.getByText(/Termin platnosci/)).toBeInTheDocument();
  });

  it('hides config form when Fakturownia is toggled off after being on', async () => {
    const supabaseClient = buildSupabaseClient(null);

    const { user } = renderWithProviders(
      <IntegrationsSettingsView
        instanceId="inst-1"
        supabaseClient={supabaseClient}
        providers={['fakturownia']}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Fakturownia')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch');
    // Toggle on
    await user.click(toggle);
    expect(screen.getByText('Domena konta')).toBeInTheDocument();

    // Toggle off
    await user.click(toggle);
    expect(screen.queryByText('Domena konta')).not.toBeInTheDocument();
  });

  it('saves settings by calling upsert on invoicing_settings table', async () => {
    const upsertChain = createChainMock(null, null);
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'invoicing_settings') return upsertChain;
        return createChainMock(null);
      }),
    };

    const { user } = renderWithProviders(
      <IntegrationsSettingsView
        instanceId="inst-1"
        supabaseClient={supabaseClient}
        providers={['fakturownia']}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Fakturownia')).toBeInTheDocument();
    });

    // Enable fakturownia
    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    // Click save
    await user.click(screen.getByText('Zapisz'));

    await waitFor(() => {
      expect(supabaseClient.from).toHaveBeenCalledWith('invoicing_settings');
      expect(upsertChain.upsert).toHaveBeenCalled();
    });

    const upsertPayload = (upsertChain.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(upsertPayload.instance_id).toBe('inst-1');
    expect(upsertPayload.provider).toBe('fakturownia');
    expect(upsertPayload.active).toBe(true);
  });

  it('saves with active=false and provider=null when no provider is toggled', async () => {
    const upsertChain = createChainMock(null, null);
    const supabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'invoicing_settings') return upsertChain;
        return createChainMock(null);
      }),
    };

    const { user } = renderWithProviders(
      <IntegrationsSettingsView
        instanceId="inst-1"
        supabaseClient={supabaseClient}
        providers={['fakturownia']}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Fakturownia')).toBeInTheDocument();
    });

    // Save without toggling any provider
    await user.click(screen.getByText('Zapisz'));

    await waitFor(() => {
      expect(upsertChain.upsert).toHaveBeenCalled();
    });

    const upsertPayload = (upsertChain.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(upsertPayload.active).toBe(false);
    expect(upsertPayload.provider).toBeNull();
  });

  it('loads existing settings and pre-activates fakturownia toggle', async () => {
    const settingsData = {
      instance_id: 'inst-1',
      provider: 'fakturownia',
      provider_config: { domain: 'mojafirma', api_token: 'secret123' },
      default_vat_rate: 8,
      default_payment_days: 30,
      default_document_kind: 'vat',
      default_currency: 'PLN',
      default_payment_type: 'transfer',
      default_place: 'Gdansk',
      default_seller_person: 'Anna',
      auto_send_email: true,
      active: true,
    };

    const chain = createChainMock(settingsData);
    const supabaseClient = { from: vi.fn(() => chain) };

    renderWithProviders(
      <IntegrationsSettingsView
        instanceId="inst-1"
        supabaseClient={supabaseClient}
        providers={['fakturownia']}
      />,
    );

    // Config form should appear automatically since active=true and provider=fakturownia
    await waitFor(
      () => {
        expect(screen.getByText('Domena konta')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Domain input should be pre-filled
    const domainInput = screen.getByPlaceholderText('twojafirma');
    expect(domainInput).toHaveValue('mojafirma');
  });

  it('loads existing settings and populates payment days input', async () => {
    const settingsData = {
      instance_id: 'inst-1',
      provider: 'fakturownia',
      provider_config: { domain: 'firma', api_token: 'tok' },
      default_vat_rate: 23,
      default_payment_days: 7,
      default_document_kind: 'vat',
      default_currency: 'PLN',
      default_payment_type: 'transfer',
      default_place: '',
      default_seller_person: '',
      auto_send_email: false,
      active: true,
    };

    const chain = createChainMock(settingsData);
    const supabaseClient = { from: vi.fn(() => chain) };

    renderWithProviders(
      <IntegrationsSettingsView
        instanceId="inst-1"
        supabaseClient={supabaseClient}
        providers={['fakturownia']}
      />,
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Termin platnosci/)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    const paymentDaysInput = screen.getByDisplayValue('7');
    expect(paymentDaysInput).toBeInTheDocument();
  });
});
