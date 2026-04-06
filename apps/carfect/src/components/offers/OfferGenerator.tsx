import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@shared/ui';
import { cn } from '@/lib/utils';
import { ChevronLeft, Send, Loader2, Eye, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOffer } from '@/hooks/useOffer';
import { openOfferPdf } from '@/lib/pdfUtils';
import { CustomerDataStep, CustomerDataStepHandle, ValidationErrors } from './CustomerDataStep';
import { ScopesStep } from './ScopesStep';
import { SummaryStepV2 } from './SummaryStepV2';
import { ProductsSummaryStepV2 } from './ProductsSummaryStepV2';
import { OfferPreviewDialog } from './OfferPreviewDialog';
import { OfferPreviewPanel } from './OfferPreviewPanel';
import { SendOfferEmailDialog } from '@/components/admin/SendOfferEmailDialog';
import { useIsMobile } from '@shared/ui';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui';

export interface OfferCustomerPrefill {
  name: string;
  phone: string;
  plate?: string;
}

interface OfferGeneratorProps {
  instanceId: string;
  offerId?: string;
  duplicateFromId?: string;
  onClose?: () => void;
  onSaved?: (offerId: string) => void;
  initialCustomerData?: OfferCustomerPrefill | null;
}

// Steps defined inside component for i18n

export const OfferGenerator = ({
  instanceId,
  offerId,
  duplicateFromId,
  onClose,
  onSaved,
  initialCustomerData,
}: OfferGeneratorProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [instanceShowUnitPrices, setInstanceShowUnitPrices] = useState(false);
  const [instanceDiscountsEnabled, setInstanceDiscountsEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [savedOfferForEmail, setSavedOfferForEmail] = useState<{
    id: string;
    offer_number: string;
    public_token: string;
    customer_data: { name?: string; email?: string };
  } | null>(null);
  const [instanceData, setInstanceData] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    contact_person?: string;
    slug?: string;
    offer_email_template?: string;
  } | null>(null);

  // Ref for CustomerDataStep to call scrollToFirstError
  const customerStepRef = useRef<CustomerDataStepHandle>(null);

  const {
    offer,
    loading,
    saving,
    updateCustomerData,
    updateVehicleData,
    updateSelectedScopes,
    updateOffer,
    calculateTotalNet,
    calculateTotalGross,
    saveOffer,
    loadOffer,
  } = useOffer(instanceId);

  const isV2 = offer.offerFormat === 'v2';

  // Pre-fill customer data from reservation (new offers only)
  useEffect(() => {
    if (initialCustomerData && !offerId && !duplicateFromId) {
      updateCustomerData({
        name: initialCustomerData.name,
        phone: initialCustomerData.phone,
      });
      if (initialCustomerData.plate) {
        updateVehicleData({ brandModel: initialCustomerData.plate });
      }
    }
  }, []);

  // Fetch instance settings for unit prices visibility and email dialog
  useEffect(() => {
    const fetchInstanceSettings = async () => {
      const { data, error } = await supabase
        .from('instances')
        .select(
          'show_unit_prices_in_offer, offer_discounts_enabled, name, email, phone, address, website, contact_person, slug, offer_email_template',
        )
        .eq('id', instanceId)
        .single();

      if (error) {
        console.error('Error fetching instance settings:', error);
        toast.error(t('common.loadError'));
        return;
      }

      if (data) {
        setInstanceShowUnitPrices(data.show_unit_prices_in_offer === true);
        setInstanceDiscountsEnabled(data.offer_discounts_enabled === true);
        setInstanceData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
          contact_person: data.contact_person,
          slug: data.slug,
          offer_email_template: data.offer_email_template,
        });
      }
    };
    fetchInstanceSettings();
  }, [instanceId]);

  // Load existing offer if editing or duplicating, or load defaults for new offers
  useEffect(() => {
    const loadId = offerId || duplicateFromId;
    if (loadId) {
      // Pass isDuplicate flag to regenerate all UUIDs and prevent primary key conflicts
      loadOffer(loadId, !!duplicateFromId);
    } else {
      // New offer — set v2 format
      updateOffer({ offerFormat: 'v2' });
    }
  }, [offerId, duplicateFromId]);

  // Track changes for new offers
  useEffect(() => {
    if (!offerId && !duplicateFromId) {
      // Check if any data has been entered
      const hasData =
        Boolean(offer.customerData.name) ||
        Boolean(offer.customerData.email) ||
        Boolean(offer.vehicleData.brandModel) ||
        offer.selectedScopeIds.length > 0 ||
        offer.options.length > 0;
      setHasUnsavedChanges(hasData);
    } else {
      // For existing offers, always track changes
      setHasUnsavedChanges(true);
    }
  }, [offer, offerId, duplicateFromId]);

  // Handle browser beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
      setPendingClose(true);
    } else {
      onClose?.();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleConfirmExit = async (saveBeforeExit: boolean) => {
    if (saveBeforeExit) {
      try {
        const savedId = await saveOffer();
        if (savedId) {
          onSaved?.(savedId);
          toast.success(t('offers.savedAndClosed'));
        }
      } catch (error) {
        // Error already handled in hook
        return;
      }
    }
    setShowExitDialog(false);
    setHasUnsavedChanges(false);
    if (pendingClose) {
      onClose?.();
    }
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
    setPendingClose(false);
  };

  const handleSave = async () => {
    try {
      const savedId = await saveOffer();
      if (savedId) {
        // Don't close the generator, just notify about save
        // onSaved is only called when explicitly closing
      }
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleSend = async () => {
    // Validate required fields before sending
    const errors: ValidationErrors = {};
    if (!offer.customerData.name?.trim()) {
      errors.name = 'Imię i nazwisko jest wymagane';
    }
    if (!offer.customerData.email?.trim()) {
      errors.email = 'Email jest wymagany';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(offer.customerData.email.trim())) {
      errors.email = 'Nieprawidłowy format email';
    }
    if (!offer.vehicleData.brandModel?.trim()) {
      errors.brandModel = 'Marka i model jest wymagany';
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      customerStepRef.current?.scrollToFirstError(errors);
      return;
    }
    setValidationErrors({});

    setSending(true);
    try {
      const savedId = await saveOffer();
      if (savedId) {
        // Fetch the saved offer to get public_token
        const { data: savedOffer } = await supabase
          .from('offers')
          .select('id, offer_number, public_token, customer_data')
          .eq('id', savedId)
          .single();

        if (savedOffer) {
          const customerData = savedOffer.customer_data as { name?: string; email?: string } | null;
          if (!customerData?.email) {
            toast.error(t('offers.noCustomerEmail'));
            setSending(false);
            return;
          }
          setSavedOfferForEmail({
            id: savedOffer.id,
            offer_number: savedOffer.offer_number,
            public_token: savedOffer.public_token,
            customer_data: savedOffer.customer_data as { name?: string; email?: string },
          });
          setShowEmailDialog(true);
        }
      }
    } catch (error) {
      // Error already handled in hook
    } finally {
      setSending(false);
    }
  };

  const handleSendFromPreview = async () => {
    try {
      const savedId = await saveOffer();
      if (savedId) {
        // Fetch the saved offer to get public_token
        const { data: savedOffer } = await supabase
          .from('offers')
          .select('id, offer_number, public_token, customer_data')
          .eq('id', savedId)
          .single();

        if (savedOffer) {
          const customerData = savedOffer.customer_data as { name?: string; email?: string } | null;
          if (!customerData?.email) {
            toast.error(t('offers.noCustomerEmail'));
            return;
          }
          // Close preview and open email dialog
          setShowPreview(false);
          setSavedOfferForEmail({
            id: savedOffer.id,
            offer_number: savedOffer.offer_number,
            public_token: savedOffer.public_token,
            customer_data: savedOffer.customer_data as { name?: string; email?: string },
          });
          setShowEmailDialog(true);
        }
      }
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleShowPreview = () => {
    setShowPreview(true);
  };

  const handlePrint = async () => {
    try {
      const savedId = await saveOffer(true);
      if (savedId) {
        const { data: savedOffer } = await supabase
          .from('offers')
          .select('public_token')
          .eq('id', savedId)
          .single();
        if (savedOffer?.public_token) {
          await openOfferPdf(savedOffer.public_token);
        }
      }
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  const handleDownloadPdf = async () => {
    if (!offer.id) {
      toast.error(t('offers.saveFirst'));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-offer-pdf', {
        body: { offerId: offer.id },
      });

      if (error) throw error;

      // Validate response is HTML before opening (#3)
      if (data instanceof Blob && data.type && !data.type.includes('text/html')) {
        throw new Error(`Unexpected response type: ${data.type}`);
      }
      // Open in new window for print-to-PDF using a safe blob URL
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        // Revoke after the window has loaded the content
        printWindow.addEventListener('load', () => URL.revokeObjectURL(blobUrl));
      } else {
        // Fallback - download as HTML
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Oferta_${offer.id}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        toast.info(t('offers.openFilePrintPdf'));
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('offers.pdfError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const formContent = (
    <div className="space-y-6">
      <CustomerDataStep
        ref={customerStepRef}
        instanceId={instanceId}
        customerData={offer.customerData}
        vehicleData={offer.vehicleData}
        onCustomerChange={(data) => {
          updateCustomerData(data);
          if (data.name !== undefined && validationErrors.name) {
            setValidationErrors((prev) => ({ ...prev, name: undefined }));
          }
          if (data.email !== undefined && validationErrors.email) {
            setValidationErrors((prev) => ({ ...prev, email: undefined }));
          }
        }}
        onVehicleChange={(data) => {
          updateVehicleData(data);
          if (data.brandModel !== undefined && validationErrors.brandModel) {
            setValidationErrors((prev) => ({ ...prev, brandModel: undefined }));
          }
        }}
        validationErrors={validationErrors}
        internalNotes={offer.internalNotes}
        onInternalNotesChange={(value) => updateOffer({ internalNotes: value })}
      />

      {isV2 ? (
        <ProductsSummaryStepV2
          instanceId={instanceId}
          offer={offer}
          showUnitPrices={instanceShowUnitPrices}
          discountsEnabled={instanceDiscountsEnabled}
          isEditing={!!offerId}
          onUpdateOffer={updateOffer}
          calculateTotalNet={calculateTotalNet}
          calculateTotalGross={calculateTotalGross}
          onShowPreview={handleShowPreview}
          onServiceSaved={() => setPreviewRefreshKey((k) => k + 1)}
        />
      ) : (
        <>
          <ScopesStep
            instanceId={instanceId}
            selectedScopeIds={offer.selectedScopeIds}
            onScopesChange={updateSelectedScopes}
          />
          <SummaryStepV2
            instanceId={instanceId}
            offer={offer}
            showUnitPrices={instanceShowUnitPrices}
            isEditing={!!offerId}
            onUpdateOffer={updateOffer}
            calculateTotalNet={calculateTotalNet}
            calculateTotalGross={calculateTotalGross}
            onShowPreview={handleShowPreview}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="pb-24">
      {/* Desktop: split view with preview */}
      {!isMobile ? (
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* Left: Form */}
          <div className="w-[540px] shrink-0 overflow-y-auto pr-2">{formContent}</div>

          {/* Right: Live Preview */}
          <div className="flex-1 min-w-0 border rounded-lg overflow-hidden bg-white">
            <OfferPreviewPanel
              offer={offer}
              instanceId={instanceId}
              calculateTotalNet={calculateTotalNet}
              calculateTotalGross={calculateTotalGross}
              refreshKey={previewRefreshKey}
            />
          </div>
        </div>
      ) : (
        /* Mobile: single-column layout */
        <div className="space-y-6">{formContent}</div>
      )}

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[var(--sidebar-w,0px)] bg-background border-t py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 transition-[left] duration-300">
        <div className="flex items-center justify-between px-4">
          <div>
            {onClose && (
              <Button
                variant="outline"
                onClick={handleClose}
                className="h-12 w-12 sm:w-auto sm:px-4 bg-white"
              >
                <span className="hidden sm:inline">{t('common.cancel')}</span>
                <ChevronLeft className="w-5 h-5 sm:hidden" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              className="gap-2 h-12 w-12 sm:w-auto sm:px-4 bg-white"
            >
              <span className="hidden sm:inline">{t('common.save')}</span>
            </Button>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2 h-12 w-12 sm:w-auto sm:px-4 bg-white"
            >
              <Printer className="w-5 h-5" />
              <span className="hidden sm:inline">Drukuj PDF</span>
            </Button>

            {/* Preview button - only on mobile (desktop has inline preview) */}
            {isMobile && (
              <Button
                variant="outline"
                onClick={handleShowPreview}
                className="gap-2 h-12 w-12 sm:w-auto sm:px-4 bg-white"
              >
                <Eye className="w-5 h-5" />
                <span className="hidden sm:inline">{t('offers.preview')}</span>
              </Button>
            )}

            <Button
              onClick={handleSend}
              disabled={sending}
              className="gap-2 h-12 w-12 sm:w-auto sm:px-4"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">{t('offers.sendOffer')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('offers.unsavedChangesTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('offers.unsavedChangesDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
            <AlertDialogAction onClick={() => handleConfirmExit(true)}>
              {t('offers.saveAndExit')}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleConfirmExit(false)}
              className="bg-transparent border border-input text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {t('offers.exitWithoutSaving')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <OfferPreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        offer={offer}
        instanceId={instanceId}
        calculateTotalNet={calculateTotalNet}
        calculateTotalGross={calculateTotalGross}
      />

      {/* Email Dialog */}
      {savedOfferForEmail && (
        <SendOfferEmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          offer={savedOfferForEmail}
          instanceData={instanceData}
          onSent={() => {
            setShowEmailDialog(false);
            setSavedOfferForEmail(null);
            setHasUnsavedChanges(false);
            onSaved?.(savedOfferForEmail.id);
          }}
        />
      )}
    </div>
  );
};
