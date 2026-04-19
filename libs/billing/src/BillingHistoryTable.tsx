import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  PaginationFooter,
  useIsMobile,
} from '@shared/ui';
import type { SubscriptionInvoice, PaymentStatus } from './billing.types';
import { formatDate } from './formatDate';

export interface BillingHistoryLabels {
  period: string;
  amountNet: string;
  positions: string;
  status: string;
  paymentDue: string;
  invoice: string;
  downloadPdf: string;
  noInvoices: string;
  itemLabel: string;
  statusPaid: string;
  statusPending: string;
  statusOverdue: string;
}

const DEFAULT_LABELS: BillingHistoryLabels = {
  period: 'Okres',
  amountNet: 'Kwota netto',
  positions: 'Pozycje',
  status: 'Status',
  paymentDue: 'Termin płatności',
  invoice: 'Faktura',
  downloadPdf: 'Pobierz PDF',
  noInvoices: 'Brak faktur',
  itemLabel: 'faktur',
  statusPaid: 'Opłacona',
  statusPending: 'Oczekuje',
  statusOverdue: 'Po terminie',
};

interface BillingHistoryTableProps {
  invoices: SubscriptionInvoice[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  labels?: Partial<BillingHistoryLabels>;
}

function getStatusConfig(status: PaymentStatus, labels: BillingHistoryLabels) {
  const config: Record<PaymentStatus, { label: string; className: string }> = {
    paid: { label: labels.statusPaid, className: 'bg-green-100 text-green-800 border-green-200' },
    pending: {
      label: labels.statusPending,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    overdue: { label: labels.statusOverdue, className: 'bg-red-100 text-red-800 border-red-200' },
  };
  return config[status] ?? { label: status, className: '' };
}

function InvoiceCard({
  invoice,
  labels,
}: {
  invoice: SubscriptionInvoice;
  labels: BillingHistoryLabels;
}) {
  const statusConfig = getStatusConfig(invoice.payment_status, labels);
  const isOverdue = invoice.payment_status === 'overdue';

  return (
    <div className="border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {formatDate(invoice.billing_period_start)}–{formatDate(invoice.billing_period_end)}
        </span>
        <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{labels.amountNet}</span>
        <span className="font-medium">{invoice.amount_net} zł</span>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">{labels.positions}: </span>
        {invoice.positions.map((pos, idx) => (
          <span key={idx}>
            {idx > 0 && ', '}
            {pos.name}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{labels.paymentDue}</span>
        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
          {formatDate(invoice.payment_due_date)}
        </span>
      </div>
      {invoice.pdf_url && (
        <a
          href={invoice.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline underline-offset-2 hover:opacity-80"
        >
          {labels.downloadPdf}
        </a>
      )}
    </div>
  );
}

export function BillingHistoryTable({
  invoices,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  labels: labelsProp,
}: BillingHistoryTableProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const isMobile = useIsMobile();
  const totalPages = Math.ceil(totalCount / pageSize);

  if (invoices.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">{labels.noInvoices}</div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} labels={labels} />
        ))}
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          pageSizeOptions={[12, 24, 48]}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          itemLabel={labels.itemLabel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{labels.period}</TableHead>
            <TableHead>{labels.amountNet}</TableHead>
            <TableHead>{labels.positions}</TableHead>
            <TableHead>{labels.status}</TableHead>
            <TableHead>{labels.paymentDue}</TableHead>
            <TableHead>{labels.invoice}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const statusConfig = getStatusConfig(invoice.payment_status, labels);
            const isOverdue = invoice.payment_status === 'overdue';

            return (
              <TableRow key={invoice.id}>
                <TableCell>
                  {formatDate(invoice.billing_period_start)}–
                  {formatDate(invoice.billing_period_end)}
                </TableCell>
                <TableCell>{invoice.amount_net} zł</TableCell>
                <TableCell>
                  {invoice.positions.map((pos, idx) => (
                    <div key={idx}>{pos.name}</div>
                  ))}
                </TableCell>
                <TableCell>
                  <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                </TableCell>
                <TableCell className={isOverdue ? 'text-red-600 font-medium' : undefined}>
                  {formatDate(invoice.payment_due_date)}
                </TableCell>
                <TableCell>
                  {invoice.pdf_url ? (
                    <a
                      href={invoice.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      {labels.downloadPdf}
                    </a>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={pageSize}
        pageSizeOptions={[12, 24, 48]}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        itemLabel={labels.itemLabel}
      />
    </div>
  );
}
