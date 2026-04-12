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

interface BillingHistoryTableProps {
  invoices: SubscriptionInvoice[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  paid: { label: 'Opłacona', className: 'bg-green-100 text-green-800 border-green-200' },
  pending: { label: 'Oczekuje', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  overdue: { label: 'Po terminie', className: 'bg-red-100 text-red-800 border-red-200' },
};

function InvoiceCard({ invoice }: { invoice: SubscriptionInvoice }) {
  const statusConfig = STATUS_CONFIG[invoice.payment_status] ?? { label: invoice.payment_status, className: '' };
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
        <span className="text-muted-foreground">Kwota netto</span>
        <span className="font-medium">{invoice.amount_net} zł</span>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">Pozycje: </span>
        {invoice.positions.map((pos, idx) => (
          <span key={idx}>
            {idx > 0 && ', '}
            {pos.name}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Termin płatności</span>
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
          Pobierz PDF
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
}: BillingHistoryTableProps) {
  const isMobile = useIsMobile();
  const totalPages = Math.ceil(totalCount / pageSize);

  if (invoices.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">Brak faktur</div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} />
        ))}
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          pageSizeOptions={[12, 24, 48]}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          itemLabel="faktur"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Okres</TableHead>
            <TableHead>Kwota netto</TableHead>
            <TableHead>Pozycje</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Termin płatności</TableHead>
            <TableHead>Faktura</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const statusConfig = STATUS_CONFIG[invoice.payment_status] ?? { label: invoice.payment_status, className: '' };
            const isOverdue = invoice.payment_status === 'overdue';

            return (
              <TableRow key={invoice.id}>
                <TableCell>
                  {formatDate(invoice.billing_period_start)}–{formatDate(invoice.billing_period_end)}
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
                <TableCell
                  className={isOverdue ? 'text-red-600 font-medium' : undefined}
                >
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
                      Pobierz PDF
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
        itemLabel="faktur"
      />
    </div>
  );
}
