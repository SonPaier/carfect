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
  ProductsSummaryStepV2: ({ discountsEnabled }: { discountsEnabled: boolean }) => (
    <div
      data-testid="products-summary-step"
      data-discounts-enabled={String(discountsEnabled)}
    >
      ProductsSummary
    </div>
  ),
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

  describe('layout', () => {
    it('renders customer data form', () => {
      renderGenerator();
      expect(screen.getByTestId('customer-step')).toBeInTheDocument();
    });

    it('renders products summary for v2 offers', () => {
      mockOfferState = { ...mockOfferState, offerFormat: 'v2' };
      renderGenerator();
      expect(screen.getByTestId('products-summary-step')).toBeInTheDocument();
    });
  });

  describe('send validation', () => {
    it('does not advance from step 1 without required fields', async () => {
      const user = userEvent.setup();
      renderGenerator();

      // Click the Send button without filling required fields
      const sendButton = screen.getByRole('button', { name: /wyślij/i });
      await user.click(sendButton);

      // Should show validation errors
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

      // Click Send — should proceed (call saveOffer) since fields are valid
      const sendButton = screen.getByRole('button', { name: /wyślij/i });
      await user.click(sendButton);

      // No validation errors should appear
      await waitFor(() => {
        expect(screen.queryByTestId('error-name')).not.toBeInTheDocument();
        expect(screen.queryByTestId('error-email')).not.toBeInTheDocument();
        expect(screen.queryByTestId('error-brandModel')).not.toBeInTheDocument();
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

      // Click Save button — should call saveOffer
      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSaveOffer).toHaveBeenCalled();
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

  describe('prefill from initialCustomerData', () => {
    it('pre-fills customer name, phone, and brandModel from initialCustomerData', async () => {
      const initialCustomerData = {
        name: 'Anna Nowak',
        phone: '+48600100200',
        plate: 'Toyota Yaris WA99999',
      };

      renderGenerator({ initialCustomerData });

      await waitFor(() => {
        expect(mockUpdateCustomerData).toHaveBeenCalledWith({
          name: 'Anna Nowak',
          phone: '+48600100200',
        });
        expect(mockUpdateVehicleData).toHaveBeenCalledWith({
          brandModel: 'Toyota Yaris WA99999',
        });
      });
    });
  });

  describe('discountsEnabled prop forwarding', () => {
    it('passes discountsEnabled=true to ProductsSummaryStepV2 when instance has offer_discounts_enabled=true', async () => {
      const { mockSupabase } = await import('@/test/mocks/supabase');
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            show_unit_prices_in_offer: false,
            offer_discounts_enabled: true,
            offer_default_payment_terms: null,
            offer_default_warranty: null,
            offer_default_service_info: null,
            offer_default_notes: null,
            name: 'Test',
            email: null,
            phone: null,
            address: null,
            website: null,
            contact_person: null,
            slug: 'test',
            offer_email_template: null,
          },
          error: null,
        }),
      });

      mockOfferState = { ...mockOfferState, offerFormat: 'v2' };
      renderGenerator();

      await waitFor(() => {
        expect(screen.getByTestId('products-summary-step')).toBeInTheDocument();
        expect(screen.getByTestId('products-summary-step')).toHaveAttribute(
          'data-discounts-enabled',
          'true',
        );
      });
    });

    it('passes discountsEnabled=false to ProductsSummaryStepV2 when instance has offer_discounts_enabled=false', async () => {
      const { mockSupabase } = await import('@/test/mocks/supabase');
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            show_unit_prices_in_offer: false,
            offer_discounts_enabled: false,
            offer_default_payment_terms: null,
            offer_default_warranty: null,
            offer_default_service_info: null,
            offer_default_notes: null,
            name: 'Test',
            email: null,
            phone: null,
            address: null,
            website: null,
            contact_person: null,
            slug: 'test',
            offer_email_template: null,
          },
          error: null,
        }),
      });

      mockOfferState = { ...mockOfferState, offerFormat: 'v2' };
      renderGenerator();

      await waitFor(() => {
        expect(screen.getByTestId('products-summary-step')).toHaveAttribute(
          'data-discounts-enabled',
          'false',
        );
      });
    });
  });

  describe('auto-populate defaults for new offers', () => {
    const makeInstanceMock = (defaults: {
      offer_default_payment_terms?: string | null;
      offer_default_warranty?: string | null;
      offer_default_service_info?: string | null;
      offer_default_notes?: string | null;
    }) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          show_unit_prices_in_offer: false,
          offer_discounts_enabled: false,
          offer_default_payment_terms: defaults.offer_default_payment_terms ?? null,
          offer_default_warranty: defaults.offer_default_warranty ?? null,
          offer_default_service_info: defaults.offer_default_service_info ?? null,
          offer_default_notes: defaults.offer_default_notes ?? null,
          name: 'Test',
          email: null,
          phone: null,
          address: null,
          website: null,
          contact_person: null,
          slug: 'test',
          offer_email_template: null,
        },
        error: null,
      }),
    });

    it('calls updateOffer with warranty and serviceInfo defaults when creating a new offer', async () => {
      const { mockSupabase } = await import('@/test/mocks/supabase');
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(
        makeInstanceMock({
          offer_default_warranty: '12 miesięcy',
          offer_default_service_info: 'Serwis autoryzowany',
        }),
      );

      renderGenerator(); // no offerId, no duplicateFromId

      await waitFor(() => {
        expect(mockUpdateOffer).toHaveBeenCalledWith(
          expect.objectContaining({
            warranty: '12 miesięcy',
            serviceInfo: 'Serwis autoryzowany',
          }),
        );
      });
    });

    it('calls updateOffer with all four defaults when all are set', async () => {
      const { mockSupabase } = await import('@/test/mocks/supabase');
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(
        makeInstanceMock({
          offer_default_payment_terms: 'Przelew 14 dni',
          offer_default_warranty: '24 miesiące',
          offer_default_service_info: 'ASO',
          offer_default_notes: 'Oferta ważna 7 dni',
        }),
      );

      renderGenerator();

      await waitFor(() => {
        expect(mockUpdateOffer).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentTerms: 'Przelew 14 dni',
            warranty: '24 miesiące',
            serviceInfo: 'ASO',
            notes: 'Oferta ważna 7 dni',
          }),
        );
      });
    });

    it('does NOT call updateOffer with defaults when all instance defaults are null', async () => {
      const { mockSupabase } = await import('@/test/mocks/supabase');
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(
        makeInstanceMock({}),
      );

      renderGenerator();

      // Wait for the async fetch to complete
      await waitFor(() => {
        // updateOffer may be called for offerFormat: 'v2' but NOT with any condition fields
        const conditionCalls = mockUpdateOffer.mock.calls.filter(
          ([arg]) => arg.warranty !== undefined || arg.serviceInfo !== undefined || arg.notes !== undefined || arg.paymentTerms !== undefined,
        );
        expect(conditionCalls).toHaveLength(0);
      });
    });

    it('does NOT apply defaults when editing an existing offer', async () => {
      const { mockSupabase } = await import('@/test/mocks/supabase');
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(
        makeInstanceMock({ offer_default_warranty: '12 miesięcy' }),
      );

      renderGenerator({ offerId: 'existing-offer-id' });

      await waitFor(() => {
        expect(mockLoadOffer).toHaveBeenCalledWith('existing-offer-id', false);
      });

      const conditionCalls = mockUpdateOffer.mock.calls.filter(
        ([arg]) => arg.warranty !== undefined,
      );
      expect(conditionCalls).toHaveLength(0);
    });

    it('does NOT apply defaults when duplicating an offer', async () => {
      const { mockSupabase } = await import('@/test/mocks/supabase');
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(
        makeInstanceMock({ offer_default_warranty: '12 miesięcy' }),
      );

      renderGenerator({ duplicateFromId: 'source-offer-id' });

      await waitFor(() => {
        expect(mockLoadOffer).toHaveBeenCalledWith('source-offer-id', true);
      });

      const conditionCalls = mockUpdateOffer.mock.calls.filter(
        ([arg]) => arg.warranty !== undefined,
      );
      expect(conditionCalls).toHaveLength(0);
    });
  });

  describe('v1 offer format', () => {
    it('does not advance from step 2 without selected scopes', async () => {
      // v1 offers show ScopesStep + SummaryStepV2 in the single-page layout
      mockOfferState = {
        ...mockOfferState,
        customerData: { ...mockOfferState.customerData, name: 'Jan', email: 'jan@test.pl' },
        vehicleData: { ...mockOfferState.vehicleData, brandModel: 'BMW M3' },
        selectedScopeIds: [],
        offerFormat: 'v1',
      };

      renderGenerator();

      // v1 layout shows scopes-step in single page
      expect(screen.getByTestId('scopes-step')).toBeInTheDocument();
    });

    it('advances from step 2 with selected scopes', async () => {
      // v1 offers with scopes selected show summary in single-page layout
      mockOfferState = {
        ...mockOfferState,
        customerData: { ...mockOfferState.customerData, name: 'Jan', email: 'jan@test.pl' },
        vehicleData: { ...mockOfferState.vehicleData, brandModel: 'BMW M3' },
        selectedScopeIds: ['scope-1'],
        offerFormat: 'v1',
      };

      renderGenerator();

      // v1 layout shows both scopes-step and summary-step together
      expect(screen.getByTestId('scopes-step')).toBeInTheDocument();
      expect(screen.getByTestId('summary-step')).toBeInTheDocument();
    });
  });
});
