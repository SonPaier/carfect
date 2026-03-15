import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { OfferListCard } from './OfferListCard';
import type { OfferWithOptions } from './offerTypes';

// Mock child components that have complex dependencies
vi.mock('./OfferActionsMenu', () => ({
  OfferActionsMenu: () => <div data-testid="actions-menu">Actions</div>,
}));

vi.mock('./OfferFollowUpStatus', () => ({
  OfferFollowUpStatus: () => <div data-testid="follow-up-status">FollowUp</div>,
}));

const defaultProps = {
  onEdit: vi.fn(),
  onPreview: vi.fn(),
  onCopyLink: vi.fn(),
  onSendEmail: vi.fn(),
  onChangeStatus: vi.fn(),
  onOpenApproval: vi.fn(),
  onComplete: vi.fn(),
  onReminders: vi.fn(),
  onDelete: vi.fn(),
  onReserve: vi.fn(),
  onFollowUpChange: vi.fn(),
  onNoteClick: vi.fn(),
};

const createOffer = (overrides: Partial<OfferWithOptions> = {}): OfferWithOptions => ({
  id: 'offer-1',
  offer_number: 'OFF-001',
  customer_data: { name: 'Jan Kowalski', phone: '123456789' },
  vehicle_data: { brandModel: 'BMW M3' },
  status: 'draft',
  total_net: 1000,
  total_gross: 1230,
  created_at: '2026-03-01T10:00:00Z',
  public_token: 'abc123',
  ...overrides,
});

function renderCard(offer: OfferWithOptions) {
  return render(
    <I18nextProvider i18n={i18n}>
      <OfferListCard offer={offer} {...defaultProps} />
    </I18nextProvider>,
  );
}

describe('OfferListCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders customer name', () => {
      renderCard(createOffer());
      expect(screen.getAllByText('Jan Kowalski').length).toBeGreaterThanOrEqual(1);
    });

    it('renders vehicle brandModel', () => {
      renderCard(createOffer());
      expect(screen.getAllByText('BMW M3').length).toBeGreaterThanOrEqual(1);
    });

    it('renders offer number', () => {
      renderCard(createOffer());
      expect(screen.getAllByText('OFF-001').length).toBeGreaterThanOrEqual(1);
    });

    it('shows company name when no customer name', () => {
      renderCard(createOffer({ customer_data: { company: 'FirmaXYZ' } }));
      expect(screen.getAllByText('FirmaXYZ').length).toBeGreaterThanOrEqual(1);
    });

    it('shows WWW badge for website source', () => {
      renderCard(createOffer({ source: 'website' }));
      expect(screen.getAllByText('WWW').length).toBeGreaterThanOrEqual(1);
    });

    it('does not show WWW badge for non-website source', () => {
      renderCard(createOffer({ source: 'manual' }));
      expect(screen.queryByText('WWW')).not.toBeInTheDocument();
    });
  });

  describe('scope pills', () => {
    it('renders scope names as pills', () => {
      renderCard(
        createOffer({
          offer_scopes: [
            { id: 's1', name: 'PPF' },
            { id: 's2', name: 'Ceramic' },
          ],
        }),
      );
      expect(screen.getAllByText('PPF').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Ceramic').length).toBeGreaterThanOrEqual(1);
    });

    it('shows price next to scope pill when option has subtotal_net', () => {
      renderCard(
        createOffer({
          offer_scopes: [{ id: 's1', name: 'PPF' }],
          offer_options: [{ id: 'opt-1', scope_id: 's1', is_upsell: false, subtotal_net: 500 }],
        }),
      );
      expect(screen.getAllByText('PPF: 500 zł').length).toBeGreaterThanOrEqual(1);
    });

    it('does not render pills when no scopes', () => {
      renderCard(createOffer({ offer_scopes: [] }));
      // No scope pills rendered
      expect(screen.queryByText('PPF')).not.toBeInTheDocument();
    });
  });

  describe('selected option name', () => {
    it('shows selected option badge when offer is accepted', () => {
      renderCard(
        createOffer({
          status: 'accepted',
          selectedOptionName: 'PPF Premium',
          offer_scopes: [{ id: 's1', name: 'PPF' }],
        }),
      );
      expect(screen.getAllByText('PPF Premium').length).toBeGreaterThanOrEqual(1);
    });

    it('does not show selected option badge for draft', () => {
      renderCard(
        createOffer({
          status: 'draft',
          selectedOptionName: 'PPF Premium',
          offer_scopes: [{ id: 's1', name: 'PPF' }],
        }),
      );
      expect(screen.queryByText('PPF Premium')).not.toBeInTheDocument();
    });
  });

  describe('approved price', () => {
    it('shows approved gross when admin_approved_gross is set', () => {
      renderCard(createOffer({ admin_approved_gross: 1500, approved_at: '2026-03-10' }));
      // formatPrice(1500) = "1 500,00 zł" (Polish locale)
      const priceElements = screen.getAllByText(/1[\s ]?500/);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it('shows total_gross when admin_approved_gross is null but approved_at is set', () => {
      renderCard(
        createOffer({ admin_approved_gross: null, approved_at: '2026-03-10', total_gross: 1230 }),
      );
      const priceElements = screen.getAllByText(/1[\s ]?230/);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it('does not show price when admin_approved_gross is null and no approved_at', () => {
      const { container } = renderCard(
        createOffer({ admin_approved_gross: null, approved_at: null }),
      );
      // No price span rendered
      const priceSpans = container.querySelectorAll('.text-sm.font-medium');
      expect(priceSpans.length).toBe(0);
    });

    it('shows price when admin_approved_gross is 0 (not null)', () => {
      renderCard(createOffer({ admin_approved_gross: 0, approved_at: '2026-03-10' }));
      // formatPrice(0) = "0,00 zł"
      const priceElements = screen.getAllByText(/0,00/);
      expect(priceElements.length).toBeGreaterThan(0);
    });
  });

  describe('interactions', () => {
    it('calls onEdit when card is clicked', async () => {
      const user = userEvent.setup();
      renderCard(createOffer());

      const card = screen.getAllByText('Jan Kowalski')[0].closest('[class*="cursor-pointer"]')!;
      await user.click(card);

      expect(defaultProps.onEdit).toHaveBeenCalledWith('offer-1');
    });
  });

  describe('status badge', () => {
    it('shows viewed date for viewed status with viewed_at', () => {
      renderCard(createOffer({ status: 'viewed', viewed_at: '2026-03-10T14:30:00Z' }));
      // StatusBadge renders viewedAt translation with formatted date containing "10.03" or "10 mar"
      expect(screen.getAllByText(/obejrzana|10\.03|10 mar/i).length).toBeGreaterThanOrEqual(1);
    });

    it('shows generic status text for viewed without viewed_at', () => {
      renderCard(createOffer({ status: 'viewed', viewed_at: null }));
      // Without viewed_at, falls through to generic status text — no date shown
      expect(screen.queryByText(/obejrzana.*10/i)).not.toBeInTheDocument();
    });

    it('shows generic status for non-viewed statuses', () => {
      renderCard(createOffer({ status: 'draft' }));
      // Generic badge renders translated status — "Szkic" in Polish
      expect(screen.getAllByText(/szkic/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('follow-up status', () => {
    it('renders follow-up when customer has phone', () => {
      renderCard(createOffer({ customer_data: { name: 'Jan', phone: '123' } }));
      expect(screen.getAllByTestId('follow-up-status').length).toBeGreaterThanOrEqual(1);
    });

    it('does not render follow-up when no phone', () => {
      renderCard(createOffer({ customer_data: { name: 'Jan' } }));
      expect(screen.queryByTestId('follow-up-status')).not.toBeInTheDocument();
    });
  });
});
