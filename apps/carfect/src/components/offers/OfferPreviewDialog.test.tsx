import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { OfferPreviewDialog } from './OfferPreviewDialog';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';
import { defaultCustomerData, defaultVehicleData } from '@/hooks/useOfferTypes';
import type { OfferState } from '@/hooks/useOffer';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

// Mock PublicOfferCustomerView to avoid rendering the full customer view
vi.mock('./PublicOfferCustomerView', () => ({
  PublicOfferCustomerView: ({ offer }: { offer: { offer_number: string; total_net: number } }) => (
    <div data-testid="public-offer-view">
      <span data-testid="offer-number">{offer.offer_number}</span>
      <span data-testid="total-net">{offer.total_net}</span>
    </div>
  ),
}));

const INSTANCE_ID = 'test-instance-id';

const createOffer = (overrides: Partial<OfferState> = {}): OfferState => ({
  instanceId: INSTANCE_ID,
  customerData: { ...defaultCustomerData, name: 'Jan', email: 'jan@test.pl' },
  vehicleData: { ...defaultVehicleData, brandModel: 'BMW M3' },
  selectedScopeIds: [],
  options: [
    {
      id: 'opt-1',
      name: 'PPF Standard',
      description: 'Protection',
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          customName: 'PPF Full',
          quantity: 1,
          unitPrice: 1000,
          unit: 'szt',
          discountPercent: 10,
          isOptional: false,
          isCustom: false,
        },
        {
          id: 'item-2',
          productId: 'prod-2',
          customName: 'Extra',
          quantity: 2,
          unitPrice: 200,
          unit: 'szt',
          discountPercent: 0,
          isOptional: true,
          isCustom: false,
        },
      ],
      isSelected: true,
      sortOrder: 0,
      scopeId: 'scope-1',
    },
  ],
  additions: [],
  vatRate: 23,
  hideUnitPrices: false,
  status: 'draft',
  ...overrides,
});

const mockInstance = {
  name: 'Test Firma',
  logo_url: null,
  phone: '123456',
  email: 'firma@test.pl',
  address: 'ul. Testowa 1',
  website: null,
  social_facebook: null,
  social_instagram: null,
  offer_branding_enabled: false,
  offer_bg_color: null,
  offer_header_bg_color: null,
  offer_header_text_color: null,
  offer_section_bg_color: null,
  offer_section_text_color: null,
  offer_primary_color: null,
  offer_scope_header_text_color: null,
  offer_portfolio_url: null,
  offer_google_reviews_url: null,
  contact_person: null,
  offer_bank_company_name: null,
  offer_bank_account_number: null,
  offer_bank_name: null,
  offer_trust_header_title: null,
  offer_trust_description: null,
  offer_trust_tiles: null,
};

function renderDialog(offer: OfferState, open = true) {
  return render(
    <I18nextProvider i18n={i18n}>
      <OfferPreviewDialog
        open={open}
        onClose={vi.fn()}
        offer={offer}
        instanceId={INSTANCE_ID}
        calculateTotalNet={() =>
          offer.options
            .filter((o) => o.isSelected)
            .reduce(
              (sum, o) =>
                sum +
                o.items.reduce((s, i) => {
                  if (i.isOptional) return s;
                  return s + i.quantity * i.unitPrice * (1 - i.discountPercent / 100);
                }, 0),
              0,
            )
        }
        calculateTotalGross={() => {
          const net = offer.options
            .filter((o) => o.isSelected)
            .reduce(
              (sum, o) =>
                sum +
                o.items.reduce((s, i) => {
                  if (i.isOptional) return s;
                  return s + i.quantity * i.unitPrice * (1 - i.discountPercent / 100);
                }, 0),
              0,
            );
          return net * (1 + offer.vatRate / 100);
        }}
      />
    </I18nextProvider>,
  );
}

describe('OfferPreviewDialog', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockSupabaseQuery('instances', { data: mockInstance, error: null });
    mockSupabaseQuery('offer_scopes', { data: [], error: null });
    mockSupabaseQuery('unified_services', { data: [], error: null });
  });

  it('shows loading state then renders preview', async () => {
    const offer = createOffer();
    renderDialog(offer);

    // Should eventually show the public offer view
    const view = await screen.findByTestId('public-offer-view');
    expect(view).toBeInTheDocument();
  });

  it('maps offer_number as PODGLĄD for preview', async () => {
    const offer = createOffer();
    renderDialog(offer);

    const number = await screen.findByTestId('offer-number');
    expect(number.textContent).toBe('PODGLĄD');
  });

  it('calculates subtotal_net excluding optional items', async () => {
    const offer = createOffer();
    renderDialog(offer);

    const totalNet = await screen.findByTestId('total-net');
    // item-1: 1 * 1000 * (1 - 10/100) = 900
    // item-2: optional, excluded
    expect(Number(totalNet.textContent)).toBe(900);
  });

  it('does not render when closed', () => {
    const offer = createOffer();
    renderDialog(offer, false);
    expect(screen.queryByTestId('public-offer-view')).not.toBeInTheDocument();
  });
});
