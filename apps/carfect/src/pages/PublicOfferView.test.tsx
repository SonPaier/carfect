import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';
import {
  mockSupabase,
  mockSupabaseQuery,
  mockSupabaseRpc,
  resetSupabaseMocks,
} from '@/test/mocks/supabase';

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

const mockOfferData = {
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
  offer_options: [],
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

describe('PublicOfferView — Supabase backend interactions', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      hasRole: () => false,
      hasInstanceRole: () => false,
    });
  });

  describe('mark_offer_viewed RPC', () => {
    it('calls mark_offer_viewed for offers with status=sent (anonymous user)', async () => {
      mockSupabaseQuery('offers', { data: mockOfferData, error: null });
      mockSupabaseRpc('mark_offer_viewed', { data: null, error: null });

      renderPage();

      await waitFor(() => {
        expect(mockSupabase.rpc).toHaveBeenCalledWith('mark_offer_viewed', {
          p_token: TOKEN,
        });
      });
    });

    it('does NOT call mark_offer_viewed when status is not sent', async () => {
      const viewedOffer = { ...mockOfferData, status: 'viewed' };
      mockSupabaseQuery('offers', { data: viewedOffer, error: null });

      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('offer-view')).toBeInTheDocument();
      });

      expect(mockSupabase.rpc).not.toHaveBeenCalledWith('mark_offer_viewed', expect.anything());
    });

    it('does NOT call mark_offer_viewed when user is super_admin', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1' },
        hasRole: (role: string) => role === 'super_admin',
        hasInstanceRole: () => false,
      });

      mockSupabaseQuery('offers', { data: mockOfferData, error: null });

      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('offer-view')).toBeInTheDocument();
      });

      expect(mockSupabase.rpc).not.toHaveBeenCalledWith('mark_offer_viewed', expect.anything());
    });

    it('does NOT call mark_offer_viewed when user is instance admin', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-2' },
        hasRole: () => false,
        hasInstanceRole: (role: string, instId: string) => role === 'admin' && instId === 'inst-1',
      });

      mockSupabaseQuery('offers', { data: mockOfferData, error: null });

      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('offer-view')).toBeInTheDocument();
      });

      expect(mockSupabase.rpc).not.toHaveBeenCalledWith('mark_offer_viewed', expect.anything());
    });

    it('does NOT call mark_offer_viewed when print=true', async () => {
      mockSupabaseQuery('offers', { data: mockOfferData, error: null });

      renderPage(`/offer/${TOKEN}`, '?print=true');

      await waitFor(() => {
        expect(screen.getByTestId('offer-view')).toBeInTheDocument();
      });

      expect(mockSupabase.rpc).not.toHaveBeenCalledWith('mark_offer_viewed', expect.anything());
    });
  });

  describe('offer fetching', () => {
    it('fetches offer by public_token from URL params', async () => {
      mockSupabaseQuery('offers', { data: mockOfferData, error: null });

      renderPage();

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('offers');
      });

      await waitFor(() => {
        expect(screen.getByTestId('offer-view')).toBeInTheDocument();
      });
    });

    it('shows error screen when offer not found (PGRST116)', async () => {
      mockSupabaseQuery('offers', {
        data: null,
        error: { message: 'JSON object requested, multiple (or no) rows returned' },
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

    it('fetches product descriptions for items with product_id', async () => {
      const offerWithProducts = {
        ...mockOfferData,
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
      };

      mockSupabaseQuery('offers', { data: offerWithProducts, error: null });
      mockSupabaseQuery('unified_services', {
        data: [
          { id: 'prod-1', description: 'Premium paint protection film', photo_urls: ['url1.jpg'] },
        ],
        error: null,
      });
      mockSupabaseRpc('mark_offer_viewed', { data: null, error: null });

      renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('offer-view')).toBeInTheDocument();
      });

      // Verify unified_services was queried for product descriptions
      expect(mockSupabase.from).toHaveBeenCalledWith('unified_services');
    });
  });
});
