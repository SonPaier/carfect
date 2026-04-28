import { useState } from 'react';
import { MoreVertical, Download, Mail, Pencil, Ban, Trash2, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Label,
} from '@shared/ui';
import { useInvoiceMutations } from '@shared/invoicing';

interface InvoiceLite {
  id: string;
  number: string | null;
  status: string;
  externalInvoiceId: string | null;
  provider: 'fakturownia' | 'ifirma';
}

interface SalesOrderInvoiceActionsProps {
  invoice: InvoiceLite;
  instanceId: string;
  supabaseClient: any;
  /** Called after any successful action — invalidate the query in parent. */
  onChanged?: () => void;
  /** Called when user picks "Edytuj" — parent should open the InvoiceDrawer in edit mode with this id. */
  onRequestEdit?: (invoiceId: string) => void;
}

const cancellable = (status: string) => status === 'issued' || status === 'sent';
const deletable = (status: string) => status === 'draft' || status === 'issued';
const editable = (status: string) => status === 'draft' || status === 'issued' || status === 'sent';
const sendable = (status: string) => status === 'issued' || status === 'sent';

export function SalesOrderInvoiceActions({
  invoice,
  instanceId,
  supabaseClient,
  onChanged,
  onRequestEdit,
}: SalesOrderInvoiceActionsProps) {
  const { sendByEmail, cancelInvoice, deleteInvoice, downloadPdf, pendingAction } =
    useInvoiceMutations({ supabaseClient, instanceId, onSuccess: onChanged });

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isFakturownia = invoice.provider === 'fakturownia';
  const status = invoice.status;
  const isCancelled = status === 'cancelled';
  const isPaid = status === 'paid';

  // For non-Fakturownia (iFirma) we only show Pobierz PDF for now.
  const canEdit = isFakturownia && editable(status) && !isCancelled && !isPaid;
  const canCancel = isFakturownia && cancellable(status) && !isCancelled;
  const canDelete = isFakturownia && deletable(status) && !isCancelled;
  const canSend = sendable(status) && !isCancelled;

  const fileName = `faktura-${invoice.number || invoice.externalInvoiceId || invoice.id}.pdf`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-1 rounded hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
            aria-label="Akcje faktury"
          >
            {pendingAction ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MoreVertical className="w-4 h-4" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="z-[1100]">
          {invoice.externalInvoiceId && (
            <DropdownMenuItem onClick={() => downloadPdf(invoice.id, fileName)}>
              <Download className="w-4 h-4 mr-2" /> Pobierz PDF
            </DropdownMenuItem>
          )}
          {canSend && (
            <DropdownMenuItem onClick={() => sendByEmail(invoice.id)}>
              <Mail className="w-4 h-4 mr-2" /> Wyślij mailem
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem onClick={() => onRequestEdit?.(invoice.id)}>
              <Pencil className="w-4 h-4 mr-2" /> Edytuj
            </DropdownMenuItem>
          )}
          {(canCancel || canDelete) && <DropdownMenuSeparator />}
          {canCancel && (
            <DropdownMenuItem
              onClick={() => {
                setCancelReason('');
                setCancelDialogOpen(true);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="w-4 h-4 mr-2" /> Anuluj
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Usuń
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Cancel dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Anulować fakturę {invoice.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Faktura zostanie oznaczona jako anulowana w Fakturowni.{' '}
              <strong>Tej operacji nie można cofnąć.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason" className="text-xs">
              Powód anulowania (opcjonalny)
            </Label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Np. błąd w danych nabywcy"
              className="w-full min-h-[80px] rounded border border-border p-2 text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cofnij</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={async () => {
                  await cancelInvoice(invoice.id, cancelReason.trim() || undefined);
                  setCancelDialogOpen(false);
                }}
              >
                Anuluj fakturę
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć fakturę {invoice.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Faktura zostanie trwale usunięta z Fakturowni i z naszej bazy.{' '}
              <strong>Tej operacji nie można cofnąć.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cofnij</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={async () => {
                  await deleteInvoice(invoice.id);
                  setDeleteDialogOpen(false);
                }}
              >
                Usuń fakturę
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
