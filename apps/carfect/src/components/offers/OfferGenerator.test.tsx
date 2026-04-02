import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { OfferGenerator } from './OfferGenerator';
import { defaultCustomerData, defaultVehicleData } from '@/hooks/useOfferTypes';
import type { OfferState } from '@/hooks/useOffer';

// Mock supabase
vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Create a mutable offer state that the mock hook exposes
let mockOfferState: OfferState;
const mockSaveOffer = vi.fn().mockResolvedValue('saved-id');
const mockLoadOffer = vi.fn().mockResolvedValue(undefined);
const mockUpdateCustomerData = vi.fn();
const mockUpdateVehicleData = vi.fn();
const mockUpdateSelectedScopes = vi.fn();
const mockUpdateOffer = vi.fn();

vi.mock('@/hooks/useOffer', () => ({
  useOffer: () => ({
    offer: mockOfferState,
    loading: false,
    saving: false,
    updateCustomerData: mockUpdateCustomerData,
    updateVehicleData: mockUpdateVehicleData,
    updateSelectedScopes: mockUpdateSelectedScopes,
    generateOptionsFromScopes: vi.fn(),
    addOption: vi.fn(),
    updateOption: vi.fn(),
    removeOption: vi.fn(),
    duplicateOption: vi.fn(),
    addItemToOption: vi.fn(),
    updateItemInOption: vi.fn(),
    removeItemFromOption: vi.fn(),
    addAddition: vi.fn(),
    updateAddition: vi.fn(),
    removeAddition: vi.fn(),
    updateOffer: mockUpdateOffer,
    calculateOptionTotal: vi.fn().mockReturnValue(0),
    calculateAdditionsTotal: vi.fn().mockReturnValue(0),
    calculateTotalNet: vi.fn().mockReturnValue(0),
    calculateTotalGross: vi.fn().mockReturnValue(0),
    saveOffer: mockSaveOffer,
    loadOffer: mockLoadOffer,
    resetOffer: vi.fn(),
  }),
}));

// Mock heavy child components
vi.mock('./CustomerDataStep', () => ({
  CustomerDataStep: ({ validationErrors }: { validationErrors: Record<string, string> }) => (
    <div data-testid="customer-step">
      {Object.entries(validationErrors || {}).map(([key, msg]) => (
        <span key={key} data-testid={`error-${key}`}>
          {msg}
        </span>
      ))}
    </div>
  ),
}));

vi.mock('./ScopesStep', () => ({
  ScopesStep: () => <div data-testid="scopes-step">Scopes</div>,
}));

vi.mock('./SummaryStepV2', () => ({
  SummaryStepV2: () => <div data-testid="summary-step">Summary</div>,
}));

vi.mock('./ProductsSummaryStepV2', () => ({
  ProductsSummaryStepV2: () => <div data-testid="products-summary-step">ProductsSummary</div>,
}));

vi.mock('./OfferPreviewDialog', () => ({
  OfferPreviewDialog: () => null,
}));

vi.mock('@/components/admin/SendOfferEmailDialog', () => ({
  SendOfferEmailDialog: () => null,
}));

const INSTANCE_ID = 'test-instance-id';

function renderGenerator(props: Partial<React.ComponentProps<typeof OfferGenerator>> = {}) {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <OfferGenerator instanceId={INSTANCE_ID} {...props} />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('OfferGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOfferState = {
      instanceId: INSTANCE_ID,
      customerData: defaultCustomerData,
      vehicleData: defaultVehicleData,
      selectedScopeIds: [],
      options: [],
      additions: [],
      vatRate: 23,
      hideUnitPrices: false,
      status: 'draft',
    };
  });

  describe('step navigation', () => {
    it('starts on step 1 (customer data)', () => {
      renderGenerator();
      expect(screen.getByTestId('customer-step')).toBeInTheDocument();
    });

    it('does not advance from step 1 without required fields', async () => {
      const user = userEvent.setup();
      renderGenerator();

      const nextButton = screen.getByRole('button', { name: /dalej/i });
      await user.click(nextButton);

      // Should show validation errors and stay on step 1
      expect(screen.getByTestId('customer-step')).toBeInTheDocument();
      expect(screen.getByTestId('error-name')).toBeInTheDocument();
      expect(screen.getByTestId('error-email')).toBeInTheDocument();
      expect(screen.getByTestId('error-brandModel')).toBeInTheDocument();
    });

    it('advances to step 2 when required fields are filled', async () => {
      const user = userEvent.setup();

      // Fill required fields
      mockOfferState = {
        ...mockOfferState,
        customerData: { ...defaultCustomerData, name: 'Jan', email: 'jan@test.pl' },
        vehicleData: { ...defaultVehicleData, brandModel: 'BMW M3' },
      };

      renderGenerator();

      const nextButton = screen.getByRole('button', { name: /dalej/i });
      await user.click(nextButton);

      // Should now be on step 2
      await waitFor(() => {
        expect(screen.getByTestId('scopes-step')).toBeInTheDocument();
      });
    });
  });

  describe('auto-save', () => {
    it('triggers auto-save when navigating forward', async () => {
      const user = userEvent.setup();

      mockOfferState = {
        ...mockOfferState,
        customerData: { ...defaultCustomerData, name: 'Jan', email: 'jan@test.pl' },
        vehicleData: { ...defaultVehicleData, brandModel: 'BMW M3' },
      };

      renderGenerator();

      const nextButton = screen.getByRole('button', { name: /dalej/i });
      await user.click(nextButton);

      // saveOffer should be called with silent=true (auto-save)
      await waitFor(() => {
        expect(mockSaveOffer).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('load offer', () => {
    it('loads existing offer when offerId is provided', async () => {
      renderGenerator({ offerId: 'existing-id' });

      await waitFor(() => {
        expect(mockLoadOffer).toHaveBeenCalledWith('existing-id', false);
      });
    });

    it('loads offer as duplicate when duplicateFromId is provided', async () => {
      renderGenerator({ duplicateFromId: 'source-id' });

      await waitFor(() => {
        expect(mockLoadOffer).toHaveBeenCalledWith('source-id', true);
      });
    });
  });

  describe('step 2 validation', () => {
    it('does not advance from step 2 without selected scopes', async () => {
      const user = userEvent.setup();

      mockOfferState = {
        ...mockOfferState,
        customerData: { ...mockOfferState.customerData, name: 'Jan', email: 'jan@test.pl' },
        vehicleData: { ...mockOfferState.vehicleData, brandModel: 'BMW M3' },
        selectedScopeIds: [],
      };

      renderGenerator();

      // Go to step 2
      const nextButton = screen.getByRole('button', { name: /dalej/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('scopes-step')).toBeInTheDocument();
      });

      // Try to advance to step 3 without scopes
      const nextButton2 = screen.getByRole('button', { name: /dalej/i });
      await user.click(nextButton2);

      // Should still be on step 2
      expect(screen.getByTestId('scopes-step')).toBeInTheDocument();
      expect(screen.queryByTestId('summary-step')).not.toBeInTheDocument();
    });

    it('advances from step 2 with selected scopes', async () => {
      const user = userEvent.setup();

      mockOfferState = {
        ...mockOfferState,
        customerData: { ...mockOfferState.customerData, name: 'Jan', email: 'jan@test.pl' },
        vehicleData: { ...mockOfferState.vehicleData, brandModel: 'BMW M3' },
        selectedScopeIds: ['scope-1'],
      };

      renderGenerator();

      // Go to step 2
      const nextButton = screen.getByRole('button', { name: /dalej/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('scopes-step')).toBeInTheDocument();
      });

      // Advance to step 3
      const nextButton2 = screen.getByRole('button', { name: /dalej/i });
      await user.click(nextButton2);

      await waitFor(() => {
        expect(screen.getByTestId('summary-step')).toBeInTheDocument();
      });
    });
  });
});
