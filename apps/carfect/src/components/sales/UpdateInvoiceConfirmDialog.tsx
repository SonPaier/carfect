import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@shared/ui';

interface UpdateInvoiceConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string | null;
  /** User clicked "Tak, edytuj fakturę" — save order then open invoice edit drawer with diff. */
  onUpdateInvoice: () => void;
  /** User clicked "Tylko zapisz zamówienie" — save order, leave invoice untouched. */
  onSaveOnly: () => void;
}

/**
 * Plain-div confirm dialog (no Radix). Radix AlertDialog conflicts with the parent
 * Sheet's focus trap and gets pointer-events:none → user clicks pass through to the
 * Save button underneath. This implementation sidesteps that by not using a focus trap.
 */
export function UpdateInvoiceConfirmDialog({
  open,
  onOpenChange,
  invoiceNumber,
  onUpdateInvoice,
  onSaveOnly,
}: UpdateInvoiceConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center"
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-labelledby="update-invoice-title"
        aria-describedby="update-invoice-desc"
        className="relative z-10 w-full max-w-lg mx-4 bg-background rounded-lg border shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="update-invoice-title" className="text-lg font-semibold mb-2">
          {invoiceNumber
            ? `Faktura ${invoiceNumber} jest powiązana z tym zamówieniem`
            : 'Faktura jest powiązana z tym zamówieniem'}
        </h2>
        <p id="update-invoice-desc" className="text-sm text-muted-foreground mb-6">
          Zmiany w pozycjach lub danych nabywcy mogą wymagać aktualizacji faktury w Fakturowni. Czy
          chcesz ją zaktualizować po zapisie zamówienia?
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onSaveOnly();
              onOpenChange(false);
            }}
          >
            Tylko zapisz zamówienie
          </Button>
          <Button
            onClick={() => {
              onUpdateInvoice();
              onOpenChange(false);
            }}
          >
            Tak, edytuj fakturę
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
