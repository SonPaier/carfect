import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubscriptionSettingsTab } from './SubscriptionSettingsTab';
import type { SubscriptionSummary, BillingData, SubscriptionInvoice } from '@shared/billing';

// Mock hooks
const mockSummary: SubscriptionSummary = {
  monthlyPrice: 299,
  stationLimit: 5,
  status: 'active',
  isTrial: false,
  trialExpiresAt: null,
  currentPeriodStart: '2026-03-12',
  currentPeriodEnd: '2026-04-12',
  nextBillingDate: '2026-04-12',
  smsUsed: 45,
  smsLimit: 100,
};

const mockBillingData: BillingData = {
  billing_name: 'Test Firma Sp. z o.o.',
  billing_nip: '1234567890',
  billing_street: 'ul. Testowa 1',
  billing_postal_code: '00-001',
  billing_city: 'Warszawa',
};

const mockInvoice: SubscriptionInvoice = {
  id: 'inv-1',
  instance_id: 'inst-1',
  billing_period_start: '2026-02-12',
  billing_period_end: '2026-03-12',
  amount_net: 299,
  amount_gross: 367.77,
  currency: 'PLN',
  positions: [{ name: 'Subskrypcja', quantity: 1, unit_price_net: 299, vat_rate: 23 }],
  invoice_number: 'FV/2026/03/001',
  invoice_issue_date: '2026-03-12',
  payment_due_date: '2026-03-19',
  payment_status: 'paid',
  pdf_url: 'https://example.com/invoice.pdf',
  external_invoice_id: 'ext-1',
  created_at: '2026-03-12T10:00:00Z',
  updated_at: '2026-03-12T10:00:00Z',
};

const mockUseSubscriptionSummary = vi.fn();
const mockUseSubscriptionInvoices = vi.fn();
const mockUseBillingData = vi.fn();

vi.mock('@/hooks/useSubscriptionSummary', () => ({
  useSubscriptionSummary: (...args: unknown[]) => mockUseSubscriptionSummary(...args),
}));

vi.mock('@/hooks/useSubscriptionInvoices', () => ({
  useSubscriptionInvoices: (...args: unknown[]) => mockUseSubscriptionInvoices(...args),
}));

vi.mock('@/hooks/useBillingData', () => ({
  useBillingData: (...args: unknown[]) => mockUseBillingData(...args),
}));

vi.mock('@shared/utils', () => ({
  useGusLookup: () => ({ lookupNip: vi.fn(), loading: false }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderTab(instanceId = 'inst-1') {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <SubscriptionSettingsTab instanceId={instanceId} />
    </QueryClientProvider>,
  );
}

describe('SubscriptionSettingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSubscriptionSummary.mockReturnValue({ summary: mockSummary, loading: false });
    mockUseSubscriptionInvoices.mockReturnValue({
      data: { invoices: [mockInvoice], totalCount: 1 },
      isLoading: false,
    });
    mockUseBillingData.mockReturnValue({
      billingData: mockBillingData,
      loading: false,
      updateBillingData: vi.fn(),
    });
  });

  it('renders page heading', () => {
    renderTab();
    expect(screen.getByText('Subskrypcja i faktury')).toBeInTheDocument();
  });

  it('shows SubscriptionSummaryCard with correct monthly price', () => {
    renderTab();
    expect(screen.getByText(/299 zł netto \/ mies\./)).toBeInTheDocument();
  });

  it('shows BillingHistoryTable with invoice data', () => {
    renderTab();
    // Invoice period dates rendered in table
    expect(screen.getByText(/12\.02\.2026.*12\.03\.2026/)).toBeInTheDocument();
  });

  it('shows InvoiceDataForm with billing data', () => {
    renderTab();
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Firma Sp. z o.o.')).toBeInTheDocument();
  });

  it('shows TrialBanner when isTrial is true', () => {
    mockUseSubscriptionSummary.mockReturnValue({
      summary: { ...mockSummary, isTrial: true, trialExpiresAt: '2026-05-01' },
      loading: false,
    });
    renderTab();
    expect(screen.getByText(/Skontaktuj się/i)).toBeInTheDocument();
  });

  it('hides history table and form during trial', () => {
    mockUseSubscriptionSummary.mockReturnValue({
      summary: { ...mockSummary, isTrial: true, trialExpiresAt: '2026-05-01' },
      loading: false,
    });
    renderTab();
    expect(screen.queryByText(/12\.02\.2026/)).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('1234567890')).not.toBeInTheDocument();
  });

  it('shows loading state while data is loading', () => {
    mockUseSubscriptionSummary.mockReturnValue({ summary: null, loading: true });
    renderTab();
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
  });
});
