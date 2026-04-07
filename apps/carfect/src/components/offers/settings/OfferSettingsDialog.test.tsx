import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { OfferSettingsDialog } from './OfferSettingsDialog';

// ---- Supabase chainable builder ----
const createChain = (singleData: unknown = null) => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn().mockResolvedValue({ data: singleData, error: null });
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => createChain()),
  },
}));

// Mock child components that perform their own Supabase calls
vi.mock('./OfferBrandingSettings', () => ({
  OfferBrandingSettings: vi.fn(() => <div data-testid="branding-settings" />),
}));
vi.mock('./OfferTrustHeaderSettings', () => ({
  OfferTrustHeaderSettings: vi.fn(() => <div data-testid="trust-header-settings" />),
}));
vi.mock('./WidgetSettingsTab', () => ({
  WidgetSettingsTab: () => <div data-testid="widget-settings-tab" />,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const INSTANCE_ID = 'inst-abc';

const defaultInstanceData = {
  offer_default_payment_terms: null,
  offer_default_warranty: null,
  offer_default_service_info: null,
  offer_default_notes: null,
  offer_bank_name: null,
  offer_bank_account_number: null,
  offer_bank_company_name: null,
  offer_discounts_enabled: false,
};

function renderDialog(open = true) {
  return render(
    <I18nextProvider i18n={i18n}>
      <OfferSettingsDialog open={open} onOpenChange={vi.fn()} instanceId={INSTANCE_ID} />
    </I18nextProvider>,
  );
}

describe('OfferSettingsDialog', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() =>
      createChain(defaultInstanceData),
    );
  });

  describe('loading defaults', () => {
    it('renders the three new condition textareas', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() =>
        createChain(defaultInstanceData),
      );

      renderDialog();

      await waitFor(() => {
        expect(screen.getByText('Gwarancja')).toBeInTheDocument();
        expect(screen.getByText('Informacje o serwisie')).toBeInTheDocument();
        expect(screen.getByText('Uwagi')).toBeInTheDocument();
      });
    });

    it('populates warranty textarea with value from instance', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() =>
        createChain({ ...defaultInstanceData, offer_default_warranty: '12 miesięcy gwarancji' }),
      );

      renderDialog();

      await waitFor(() => {
        expect(screen.getByDisplayValue('12 miesięcy gwarancji')).toBeInTheDocument();
      });
    });

    it('populates service_info textarea with value from instance', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() =>
        createChain({ ...defaultInstanceData, offer_default_service_info: 'Serwis autoryzowany' }),
      );

      renderDialog();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Serwis autoryzowany')).toBeInTheDocument();
      });
    });

    it('populates notes textarea with value from instance', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() =>
        createChain({ ...defaultInstanceData, offer_default_notes: 'Oferta ważna 7 dni' }),
      );

      renderDialog();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Oferta ważna 7 dni')).toBeInTheDocument();
      });
    });
  });

  describe('saving', () => {
    it('includes warranty in the update payload', async () => {
      const user = userEvent.setup();
      const { supabase } = await import('@/integrations/supabase/client');

      const mockUpdateFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: defaultInstanceData, error: null }),
        update: mockUpdateFn,
      }));

      renderDialog();

      await waitFor(() => {
        expect(screen.getByText('Gwarancja')).toBeInTheDocument();
      });

      // Find warranty textarea via its label container
      const warrantyLabel = screen.getByText('Gwarancja');
      const container = warrantyLabel.closest('.space-y-2');
      const textarea = container?.querySelector('textarea');
      expect(textarea).not.toBeNull();
      await user.click(textarea!);
      await user.type(textarea!, '24 miesiące');

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalledWith(
          expect.objectContaining({
            offer_default_warranty: '24 miesiące',
          }),
        );
      });
    });

    it('saves null when warranty textarea is empty', async () => {
      const user = userEvent.setup();
      const { supabase } = await import('@/integrations/supabase/client');

      const mockUpdateFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...defaultInstanceData, offer_default_warranty: 'Old value' },
          error: null,
        }),
        update: mockUpdateFn,
      }));

      renderDialog();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Old value')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Old value');
      await user.tripleClick(textarea);
      await user.keyboard('{Backspace}');

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalledWith(
          expect.objectContaining({
            offer_default_warranty: null,
          }),
        );
      });
    });

    it('saves service_info and notes alongside other fields', async () => {
      const user = userEvent.setup();
      const { supabase } = await import('@/integrations/supabase/client');

      const mockUpdateFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: defaultInstanceData, error: null }),
        update: mockUpdateFn,
      }));

      renderDialog();

      await waitFor(() => {
        expect(screen.getByText('Informacje o serwisie')).toBeInTheDocument();
      });

      const serviceInfoLabel = screen.getByText('Informacje o serwisie');
      const serviceContainer = serviceInfoLabel.closest('.space-y-2');
      const serviceTextarea = serviceContainer?.querySelector('textarea');
      await user.click(serviceTextarea!);
      await user.type(serviceTextarea!, 'ASO Toyota');

      const notesLabel = screen.getByText('Uwagi');
      const notesContainer = notesLabel.closest('.space-y-2');
      const notesTextarea = notesContainer?.querySelector('textarea');
      await user.click(notesTextarea!);
      await user.type(notesTextarea!, 'Ważne 14 dni');

      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalledWith(
          expect.objectContaining({
            offer_default_service_info: 'ASO Toyota',
            offer_default_notes: 'Ważne 14 dni',
          }),
        );
      });
    });
  });
});
