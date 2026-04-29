import { X, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@shared/ui';
import { Button } from '@shared/ui';
import { useIsMobile } from '@shared/ui';
import { useInvoiceForm, type UseInvoiceFormOptions } from './useInvoiceForm';
import { InvoiceForm } from './InvoiceForm';
import { KsefStatusBadge } from './KsefStatusBadge';
import type { InvoicePosition } from './invoicing.types';

interface CreateInvoiceDrawerProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
  calendarItemId?: string;
  salesOrderId?: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerNip?: string | null;
  positions?: InvoicePosition[];
  onSuccess?: () => void;
  supabaseClient: any; // SupabaseClient
  /** Table to query/update customer data. Defaults to 'customers'. */
  customerTable?: string;
  bankAccounts?: { name: string; number: string }[];
  /** When set, drawer opens in EDIT mode and pre-loads invoice data from Fakturownia. */
  existingInvoiceId?: string;
  /** Optional incoming positions (e.g. from order edit) — triggers diff highlighting. */
  incomingPositions?: InvoicePosition[];
}

export function CreateInvoiceDrawer({
  open,
  onClose,
  instanceId,
  calendarItemId,
  salesOrderId,
  customerId,
  customerName,
  customerEmail,
  customerNip,
  positions: initialPositions,
  onSuccess,
  supabaseClient,
  customerTable,
  bankAccounts,
  existingInvoiceId,
  incomingPositions,
}: CreateInvoiceDrawerProps) {
  const isMobile = useIsMobile();

  const form = useInvoiceForm(open, {
    instanceId,
    calendarItemId,
    salesOrderId,
    customerId,
    customerName,
    customerEmail,
    customerNip,
    positions: initialPositions,
    onSuccess,
    onClose,
    supabaseClient,
    customerTable,
    bankAccounts,
    existingInvoiceId,
    incomingPositions,
  });

  const isEditMode = form.mode === 'edit';
  const isEditWithDiff = isEditMode && !!form.positionDiffStatus;
  const headerTitle = isEditMode
    ? form.invoiceNumber
      ? `Edytuj fakturę ${form.invoiceNumber}`
      : 'Edytuj fakturę'
    : 'Wystaw fakturę';
  const submitLabel = isEditWithDiff
    ? 'Zatwierdź zmiany'
    : isEditMode
      ? 'Zapisz zmiany'
      : 'Wystaw fakturę';

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="right"
        hideCloseButton
        hideOverlay
        style={{ width: '1400px', maxWidth: '1400px' }}
        className="flex flex-col p-0 gap-0 z-[1000] h-full bg-white"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetTitle className="sr-only">Wystaw fakture</SheetTitle>
        <SheetDescription className="sr-only">Formularz wystawiania faktury</SheetDescription>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{headerTitle}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-primary/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {isEditMode && form.ksef?.status && <KsefStatusBadge ksef={form.ksef} />}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 relative">
          {form.loadingExisting && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                Wczytuję fakturę z Fakturowni…
              </div>
            </div>
          )}
          <InvoiceForm
            kind={form.kind}
            onKindChange={form.setKind}
            issueDate={form.issueDate}
            onIssueDateChange={form.setIssueDate}
            sellDate={form.sellDate}
            onSellDateChange={form.setSellDate}
            paymentDays={form.paymentDays}
            onPaymentDaysChange={form.setPaymentDays}
            buyerName={form.buyerName}
            onBuyerNameChange={form.setBuyerName}
            buyerTaxNo={form.buyerTaxNo}
            onBuyerTaxNoChange={form.setBuyerTaxNo}
            buyerEmail={form.buyerEmail}
            onBuyerEmailChange={form.setBuyerEmail}
            buyerStreet={form.buyerStreet}
            onBuyerStreetChange={form.setBuyerStreet}
            buyerPostCode={form.buyerPostCode}
            onBuyerPostCodeChange={form.setBuyerPostCode}
            buyerCity={form.buyerCity}
            onBuyerCityChange={form.setBuyerCity}
            buyerCountry={form.buyerCountry}
            onBuyerCountryChange={form.setBuyerCountry}
            paymentType={form.paymentType}
            onPaymentTypeChange={form.setPaymentType}
            splitPayment={form.splitPayment}
            onSplitPaymentChange={form.setSplitPayment}
            paidAmount={form.paidAmount}
            onPaidAmountChange={form.setPaidAmount}
            sellerName={form.sellerName}
            onSellerNameChange={form.setSellerName}
            sellerTaxNo={form.sellerTaxNo}
            onSellerTaxNoChange={form.setSellerTaxNo}
            sellerAddress={form.sellerAddress}
            onSellerAddressChange={form.setSellerAddress}
            sellerEmail={form.sellerEmail}
            onSellerEmailChange={form.setSellerEmail}
            sellerPhone={form.sellerPhone}
            onSellerPhoneChange={form.setSellerPhone}
            positions={form.positions}
            positionDiffStatus={form.positionDiffStatus}
            onAddPosition={form.addPosition}
            onRemovePosition={form.removePosition}
            onUpdatePosition={form.updatePosition}
            onMovePosition={form.movePosition}
            priceMode={form.priceMode}
            onPriceModeChange={form.setPriceMode}
            totalNetto={form.totalNetto}
            totalVat={form.totalVat}
            totalGross={form.totalGross}
            paymentTo={form.paymentTo}
            autoSendEmail={form.autoSendEmail}
            onAutoSendEmailChange={form.setAutoSendEmail}
            settingsActive={form.settings?.active}
            bankAccounts={form.bankAccounts}
            selectedBankAccount={form.selectedBankAccount}
            onBankAccountChange={form.setSelectedBankAccount}
          />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border px-6 py-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Anuluj
          </Button>
          <Button
            onClick={form.handleSubmit}
            disabled={form.submitting || form.loadingExisting || !form.settings?.active}
            className="flex-1"
          >
            {form.submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
