import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesCrmSettingsView from './SalesCrmSettingsView';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('./SalesSettingsView', () => ({ default: () => null }));

vi.mock('@shared/invoicing', () => ({
  IntegrationsSettingsView: () => null,
}));

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'neq', 'order', 'limit', 'single', 'insert', 'update', 'delete', 'match'];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

const defaultInstanceData = {
  apaczka_app_id: null,
  apaczka_app_secret: null,
  apaczka_services: [],
  apaczka_sender_address: null,
};

const defaultProps = {
  instanceId: 'inst-1',
  instanceData: defaultInstanceData,
};

describe('SalesCrmSettingsView — Apaczka tab', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(createChainMock(null, null));
  });

  describe('Tab navigation', () => {
    it('renders Apaczka tab button', () => {
      render(<SalesCrmSettingsView {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Apaczka/i })).toBeInTheDocument();
    });

    it('shows Apaczka content after clicking the tab', async () => {
      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      expect(screen.getByRole('button', { name: /Zapisz ustawienia Apaczka/i })).toBeInTheDocument();
    });
  });

  describe('Courier services — empty state', () => {
    it('shows helper text when no services are configured', async () => {
      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      expect(
        screen.getByText(/Brak skonfigurowanych serwisów/i),
      ).toBeInTheDocument();
    });

    it('shows "Pobierz z Apaczka" button for fetching courier services', async () => {
      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      expect(screen.getByRole('button', { name: /Pobierz z Apaczka/i })).toBeInTheDocument();
    });
  });

  describe('Courier services — with existing services', () => {
    it('hides helper text when services are loaded from instanceData', async () => {
      const instanceData = {
        ...defaultInstanceData,
        apaczka_services: [{ name: 'InPost', serviceId: 5 }],
      };
      render(<SalesCrmSettingsView instanceId="inst-1" instanceData={instanceData} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));

      expect(screen.queryByText(/Brak skonfigurowanych serwisów/i)).not.toBeInTheDocument();
    });

    it('shows selected services as badges', async () => {
      const instanceData = {
        ...defaultInstanceData,
        apaczka_services: [
          { name: 'DPD', serviceId: 21 },
          { name: 'DHL', serviceId: 30 },
        ],
      };
      render(<SalesCrmSettingsView instanceId="inst-1" instanceData={instanceData} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));

      expect(screen.getByText(/DPD \(#21\)/)).toBeInTheDocument();
      expect(screen.getByText(/DHL \(#30\)/)).toBeInTheDocument();
    });
  });

  describe('Saving', () => {
    it('calls supabase update with apaczka_services when saving', async () => {
      const updateChain = createChainMock(null, null);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') return updateChain;
        return createChainMock(null, null);
      });

      const instanceData = {
        ...defaultInstanceData,
        apaczka_services: [{ name: 'DPD', serviceId: 21 }],
      };

      render(<SalesCrmSettingsView instanceId="inst-1" instanceData={instanceData} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      await user.click(screen.getByRole('button', { name: /Zapisz ustawienia Apaczka/i }));

      await waitFor(() => {
        expect(updateChain.update).toHaveBeenCalled();
      });

      const payload = (updateChain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload).toHaveProperty('apaczka_services');
      expect(Array.isArray(payload.apaczka_services)).toBe(true);
      expect(payload.apaczka_services[0]).toMatchObject({ name: 'DPD', serviceId: 21 });
    });

    it('calls update on instances table with eq instanceId', async () => {
      const updateChain = createChainMock(null, null);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') return updateChain;
        return createChainMock(null, null);
      });

      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      await user.click(screen.getByRole('button', { name: /Zapisz ustawienia Apaczka/i }));

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('instances');
      });

      expect(updateChain.eq).toHaveBeenCalledWith('id', 'inst-1');
    });

    it('shows success toast after saving', async () => {
      const { toast } = await import('sonner');
      mockFrom.mockReturnValue(createChainMock(null, null));

      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      await user.click(screen.getByRole('button', { name: /Zapisz ustawienia Apaczka/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Ustawienia Apaczka zapisane');
      });
    });

    it('shows error toast when supabase returns an error', async () => {
      const { toast } = await import('sonner');
      const errorChain = createChainMock(null, { message: 'DB error' });
      mockFrom.mockReturnValue(errorChain);

      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      await user.click(screen.getByRole('button', { name: /Zapisz ustawienia Apaczka/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('DB error'));
      });
    });

    it('does not call supabase when instanceId is null', async () => {
      render(<SalesCrmSettingsView instanceId={null} instanceData={defaultInstanceData} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      await user.click(screen.getByRole('button', { name: /Zapisz ustawienia Apaczka/i }));

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('Loading existing services from instanceData', () => {
    it('populates the services list from instanceData', async () => {
      const instanceData = {
        ...defaultInstanceData,
        apaczka_services: [
          { name: 'DPD', serviceId: 10 },
          { name: 'DHL', serviceId: 20 },
        ],
      };

      render(<SalesCrmSettingsView instanceId="inst-1" instanceData={instanceData} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));

      expect(screen.getByText(/DPD \(#10\)/)).toBeInTheDocument();
      expect(screen.getByText(/DHL \(#20\)/)).toBeInTheDocument();
    });

    it('populates App ID and App Secret from instanceData', async () => {
      const instanceData = {
        ...defaultInstanceData,
        apaczka_app_id: 'app_12345',
        apaczka_app_secret: 'secret_xyz',
      };

      render(<SalesCrmSettingsView instanceId="inst-1" instanceData={instanceData} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));

      expect(screen.getByDisplayValue('app_12345')).toBeInTheDocument();
    });

  });

  describe('Sender address fields', () => {
    it('renders sender address section heading', async () => {
      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      expect(screen.getByText('Adres nadawcy')).toBeInTheDocument();
    });

    it('renders Nazwa firmy input', async () => {
      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      expect(screen.getByText('Nazwa firmy')).toBeInTheDocument();
    });

    it('renders Miasto input', async () => {
      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      expect(screen.getByText('Miasto')).toBeInTheDocument();
    });

    it('populates sender address fields from instanceData', async () => {
      const instanceData = {
        ...defaultInstanceData,
        apaczka_sender_address: {
          name: 'Firma Testowa',
          contact_person: 'Jan Kowalski',
          street: 'ul. Testowa 1',
          postal_code: '00-001',
          city: 'Warszawa',
          country_code: 'PL',
          phone: '+48100200300',
          email: 'firma@test.pl',
        },
      };

      render(<SalesCrmSettingsView instanceId="inst-1" instanceData={instanceData} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));

      expect(screen.getByDisplayValue('Firma Testowa')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Warszawa')).toBeInTheDocument();
      expect(screen.getByDisplayValue('firma@test.pl')).toBeInTheDocument();
    });

    it('allows editing the city sender address field', async () => {
      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));

      const cityLabel = screen.getByText('Miasto');
      const cityInput = cityLabel.closest('div')!.querySelector('input') as HTMLInputElement;
      await user.clear(cityInput);
      await user.type(cityInput, 'Gdansk');

      expect(cityInput).toHaveValue('Gdansk');
    });

    it('includes sender address in supabase update payload', async () => {
      const updateChain = createChainMock(null, null);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'instances') return updateChain;
        return createChainMock(null, null);
      });

      render(<SalesCrmSettingsView {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /Apaczka/i }));
      await user.click(screen.getByRole('button', { name: /Zapisz ustawienia Apaczka/i }));

      await waitFor(() => {
        expect(updateChain.update).toHaveBeenCalled();
      });

      const payload = (updateChain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload).toHaveProperty('apaczka_sender_address');
      expect(payload.apaczka_sender_address).toMatchObject({ country_code: 'PL' });
    });
  });
});
