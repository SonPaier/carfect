import { DropdownMenuItem } from '@shared/ui';
import { useInvoiceMutations } from '@shared/invoicing';
import type { SalesOrder } from '@/data/salesMockData';

interface Props {
  order: SalesOrder;
  instanceId: string | null;
  onEditInvoice: (invoiceId: string) => void;
  onIssueInvoice: () => void;
  onChanged?: () => void;
  supabaseClient: any;
}

/**
 * Invoice-related items inside the per-order DropdownMenu.
 * Render: Pobierz FV / Wystaw FV / Edytuj FV. Skips itself for `paymentMethod === 'free'`.
 */
export function OrderInvoiceMenuItems({
  order,
  instanceId,
  onEditInvoice,
  onIssueInvoice,
  onChanged,
  supabaseClient,
}: Props) {
  const mutations = useInvoiceMutations({
    supabaseClient,
    instanceId: instanceId || '',
    onSuccess: onChanged,
  });

  if (order.paymentMethod === 'free') return null;

  const isFakturownia = order.invoiceProvider === 'fakturownia';
  const status = order.invoiceStatus;
  const canEdit = isFakturownia && order.invoiceId && status !== 'cancelled' && status !== 'paid';

  return (
    <>
      {order.invoiceId ? (
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            mutations.downloadPdf(
              order.invoiceId!,
              `faktura-${order.invoiceNumber || order.invoiceId}.pdf`,
            );
          }}
        >
          Pobierz FV
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onIssueInvoice();
          }}
        >
          Wystaw FV
        </DropdownMenuItem>
      )}
      {canEdit && (
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEditInvoice(order.invoiceId!);
          }}
        >
          Edytuj FV
        </DropdownMenuItem>
      )}
    </>
  );
}
