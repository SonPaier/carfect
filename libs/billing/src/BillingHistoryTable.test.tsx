import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BillingHistoryTable } from './BillingHistoryTable';
import type { SubscriptionInvoice } from './billing.types';

const baseInvoice: SubscriptionInvoice = {
  id: 'inv-1',
  instance_id: 'inst-1',
  billing_period_start: '2026-03-01',
  billing_period_end: '2026-03-31',
  amount_net: 199,
  amount_gross: 244.77,
  currency: 'PLN',
  positions: [
    { name: 'Subskrypcja Basic', quantity: 1, unit_price_net: 199, vat_rate: 23 },
  ],
  invoice_number: 'FV/2026/03/001',
  invoice_issue_date: '2026-04-01',
  payment_due_date: '2026-04-15',
  payment_status: 'paid',
  pdf_url: 'https://example.com/invoice.pdf',
  external_invoice_id: null,
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
};

const defaultProps = {
  invoices: [baseInvoice],
  totalCount: 1,
  currentPage: 1,
  pageSize: 12,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

describe('BillingHistoryTable', () => {
  it('renders table headers', () => {
    render(<BillingHistoryTable {...defaultProps} />);
    expect(screen.getByText('Okres')).toBeInTheDocument();
    expect(screen.getByText('Kwota netto')).toBeInTheDocument();
    expect(screen.getByText('Pozycje')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Termin płatności')).toBeInTheDocument();
    expect(screen.getByText('Faktura')).toBeInTheDocument();
  });

  it('renders invoice row with correct period dates', () => {
    render(<BillingHistoryTable {...defaultProps} />);
    expect(screen.getByText(/01\.03\.2026.*31\.03\.2026/)).toBeInTheDocument();
  });

  it('renders amount in PLN format', () => {
    render(<BillingHistoryTable {...defaultProps} />);
    expect(screen.getByText('199 zł')).toBeInTheDocument();
  });

  it('renders positions names', () => {
    render(<BillingHistoryTable {...defaultProps} />);
    expect(screen.getByText('Subskrypcja Basic')).toBeInTheDocument();
  });

  it('shows paid status badge with green styling', () => {
    render(<BillingHistoryTable {...defaultProps} />);
    const badge = screen.getByText('Opłacona');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-green-800');
  });

  it('shows overdue status badge with red styling', () => {
    const invoice = { ...baseInvoice, payment_status: 'overdue' as const };
    render(<BillingHistoryTable {...defaultProps} invoices={[invoice]} />);
    const badge = screen.getByText('Po terminie');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-red-800');
  });

  it('shows pending status badge with yellow styling', () => {
    const invoice = { ...baseInvoice, payment_status: 'pending' as const };
    render(<BillingHistoryTable {...defaultProps} invoices={[invoice]} />);
    const badge = screen.getByText('Oczekuje');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-yellow-800');
  });

  it('renders payment due date in red when overdue', () => {
    const invoice = { ...baseInvoice, payment_status: 'overdue' as const };
    render(<BillingHistoryTable {...defaultProps} invoices={[invoice]} />);
    const dueDateCell = screen.getByText('15.04.2026');
    expect(dueDateCell).toHaveClass('text-red-600');
    expect(dueDateCell).toHaveClass('font-medium');
  });

  it('renders payment due date in normal color when paid', () => {
    render(<BillingHistoryTable {...defaultProps} />);
    const dueDateCell = screen.getByText('15.04.2026');
    expect(dueDateCell).not.toHaveClass('text-red-600');
  });

  it('renders PDF download link when pdf_url exists', () => {
    render(<BillingHistoryTable {...defaultProps} />);
    const link = screen.getByRole('link', { name: 'Pobierz PDF' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com/invoice.pdf');
  });

  it('shows dash when pdf_url is null', () => {
    const invoice = { ...baseInvoice, pdf_url: null };
    render(<BillingHistoryTable {...defaultProps} invoices={[invoice]} />);
    expect(screen.queryByRole('link', { name: 'Pobierz PDF' })).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders PaginationFooter with correct props', () => {
    render(
      <BillingHistoryTable
        {...defaultProps}
        totalCount={30}
        currentPage={1}
        pageSize={12}
      />,
    );
    // 30 items / 12 per page = 3 pages; footer shows item count
    expect(screen.getByText('1–12 z 30 faktur')).toBeInTheDocument();
  });

  it('shows empty state when no invoices', () => {
    render(<BillingHistoryTable {...defaultProps} invoices={[]} totalCount={0} />);
    expect(screen.getByText('Brak faktur')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
