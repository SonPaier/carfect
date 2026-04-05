import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';
import { mockSupabase, mockSupabaseRpc, resetSupabaseMocks } from '@/test/mocks/supabase';

// Mock supabase
vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="helmet">{children}</div>
  ),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock useAuth — default: unauthenticated user
const mockUseAuth = vi.fn().mockReturnValue({
  user: null,
  hasRole: () => false,
  hasInstanceRole: () => false,
});
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock PublicOfferCustomerView to keep tests focused on backend logic
vi.mock('@/components/offers/PublicOfferCustomerView', () => ({
  PublicOfferCustomerView: ({ offer }: { offer: unknown }) => (
    <div data-testid="offer-view">Offer loaded</div>
  ),
}));

// Mock Sentry
vi.mock('@/lib/sentry', () => ({
  captureBackendError: vi.fn(),
}));

import PublicOfferView from './PublicOfferView';

const TOKEN = 'abc-public-token';

const mockRpcResponse = {
  id: 'offer-1',
  instance_id: 'inst-1',
  offer_number: 'OFF-001',
  public_token: TOKEN,
  status: 'sent',
  customer_data: { name: 'Jan', email: 'jan@test.pl', phone: '' },
  vehicle_data: { brandModel: 'BMW M3', plate: '' },
  total_net: 1000,
  total_gross: 1230,
  vat_rate: 23,
  notes: '',
  payment_terms: '',
  warranty: '',
  service_info: '',
  valid_until: '2026-04-15',
  hide_unit_prices: false,
  created_at: '2026-03-01',
  approved_at: null,
  viewed_at: null,
  selected_state: null,
  has_unified_services: false,
  offer_format: null,
  offer_options: [],
  product_descriptions: {},
  instances: {
    id: 'inst-1',
    name: 'Test Instance',
    logo_url: null,
    phone: null,
    email: null,
    address: null,
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
  },
};

function renderPage(path = `/offer/${TOKEN}`, searchParams = '') {
  return render(
    <MemoryRouter initialEntries={[`${path}${searchParams}`]}>
      <Routes>
        <Route path="/offer/:token" element={<PublicOfferView />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicOfferView — RPC-based data fetching', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      hasRole: () => false,
      hasInstanceRole: () => false,
    });
  });

  describe('get_public_offer RPC', () => {
    it('calls get_public_offer with token and skip_mark_viewed=false for anonymous user', async () => {
      mockSupabaseRpc('get_public_offer', { data: mockRpcResponse, error: null });

      renderPage();

      await waitFor(() => {
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_public_offer', {
          p_token: TOKEN,
          p_skip_mark_viewed: false,
        });
      });
    });

    it('renders offer view on successful RPC response', async () => {
      mockSupabaseRpc('get_public_offer', { data: mockRpcResponse, error: null });

      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('offer-view')).toBeInTheDocument();
      });
    });

    it('passes skip_mark_viewed=true when admin preview', async () => {
      mockSupabaseRpc('get_public_offer', { data: mockRpcResponse, error: null });

      renderPage(`/offer/${TOKEN}`, '?admin=true');

      await waitFor(() => {
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_public_offer', {
          p_token: TOKEN,
          p_skip_mark_viewed: true,
        });
      });
    });

    it('passes skip_mark_viewed=true when print=true', async () => {
      mockSupabaseRpc('get_public_offer', { data: mockRpcResponse, error: null });

      renderPage(`/offer/${TOKEN}`, '?print=true');

      await waitFor(() => {
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_public_offer', {
          p_token: TOKEN,
          p_skip_mark_viewed: true,
        });
      });
    });

    it('shows error screen when RPC returns error', async () => {
      mockSupabaseRpc('get_public_offer', {
        data: null,
        error: { message: 'Offer not found' },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('common.error')).toBeInTheDocument();
      });
    });

    it('shows error screen when token is missing', async () => {
      render(
        <MemoryRouter initialEntries={['/offer/']}>
          <Routes>
            <Route path="/offer/" element={<PublicOfferView />} />
            <Route path="/offer/:token" element={<PublicOfferView />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('publicOffer.invalidLink')).toBeInTheDocument();
      });
    });

    it('enriches offer_option_items with product_descriptions from RPC response', async () => {
      const responseWithProducts = {
        ...mockRpcResponse,
        offer_options: [
          {
            id: 'opt-1',
            name: 'PPF',
            description: '',
            is_selected: true,
            sort_order: 0,
            scope_id: 'scope-1',
            is_upsell: false,
            scope: null,
            subtotal_net: 1000,
            offer_option_items: [
              {
                id: 'item-1',
                product_id: 'prod-1',
                custom_name: 'PPF Full',
                custom_description: null,
                quantity: 1,
                unit_price: 1000,
                unit: 'szt',
                discount_percent: 0,
                is_optional: false,
                is_custom: false,
                sort_order: 0,
              },
            ],
          },
        ],
        product_descriptions: {
          'prod-1': {
            description: 'Premium paint protection film',
            photo_urls: ['url1.jpg'],
          },
        },
      };

      mockSupabaseRpc('get_public_offer', { data: responseWithProducts, error: null });

      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('offer-view')).toBeInTheDocument();
      });

      // Single RPC call — no separate table queries
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
