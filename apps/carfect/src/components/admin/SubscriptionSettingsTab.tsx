import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SubscriptionSettingsTabContent } from '@shared/billing';
import type { BillingData } from '@shared/billing';
import { useGusLookup } from '@shared/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionSummary } from '@/hooks/useSubscriptionSummary';
import { useSubscriptionInvoices } from '@/hooks/useSubscriptionInvoices';
import { useBillingData } from '@/hooks/useBillingData';

const CONTACT_PHONE = '+48 666 610 222';
const PAGE_SIZE = 12;

interface SubscriptionSettingsTabProps {
  instanceId: string | null;
}

export function SubscriptionSettingsTab({ instanceId }: SubscriptionSettingsTabProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const { summary, loading: summaryLoading } = useSubscriptionSummary(instanceId ?? undefined);
  const { data: invoicesData } = useSubscriptionInvoices(instanceId ?? undefined, page, pageSize);
  const {
    billingData,
    loading: billingLoading,
    updateBillingData,
  } = useBillingData(instanceId ?? undefined);

  const gusLookup = useGusLookup({
    supabase,
    onSuccess: () => toast.success(t('settings.billing.gusSuccess')),
    onError: (msg) => toast.error(msg),
  });

  const handleSaveBillingData = async (data: BillingData) => {
    try {
      await updateBillingData(data);
      toast.success(t('settings.billing.saveSuccess'));
    } catch {
      toast.error(t('settings.billing.saveError'));
    }
  };

  return (
    <SubscriptionSettingsTabContent
      labels={{
        heading: t('settings.billing.heading'),
        subtitle: t('settings.billing.subtitle'),
        loading: t('common.loading'),
        paymentsHeading: t('settings.billing.payments'),
      }}
      summaryLabels={{
        subscription: t('settings.billing.subscription'),
        price: t('settings.billing.price'),
        priceFormat: t('settings.billing.priceFormat'),
        vatNote: t('settings.billing.vatNote'),
        stations: t('settings.billing.stations'),
        status: t('common.status'),
        statusActive: t('settings.billing.statusActive'),
        statusInactive: t('settings.billing.statusInactive'),
        currentPeriod: t('settings.billing.currentPeriod'),
        nextBilling: t('settings.billing.nextBilling'),
        smsInPeriod: t('settings.billing.smsInPeriod'),
        smsOverLimit: t('settings.billing.smsOverLimit'),
      }}
      historyLabels={{
        period: t('settings.billing.historyPeriod'),
        amountNet: t('settings.billing.historyAmountNet'),
        positions: t('settings.billing.historyPositions'),
        status: t('common.status'),
        paymentDue: t('settings.billing.historyPaymentDue'),
        invoice: t('settings.billing.historyInvoice'),
        downloadPdf: t('settings.billing.historyDownloadPdf'),
        noInvoices: t('settings.billing.historyNoInvoices'),
        itemLabel: t('settings.billing.historyItemLabel'),
        statusPaid: t('settings.billing.statusPaid'),
        statusPending: t('settings.billing.statusPending'),
        statusOverdue: t('settings.billing.statusOverdue'),
      }}
      invoiceFormLabels={{
        title: t('settings.billing.invoiceTitle'),
        nip: t('customers.nip'),
        companyName: t('settings.billing.invoiceCompanyName'),
        street: t('settings.billing.invoiceStreet'),
        postalCode: t('settings.billing.invoicePostalCode'),
        city: t('settings.billing.invoiceCity'),
        gusButton: t('settings.billing.invoiceGusButton'),
        saveButton: t('settings.billing.invoiceSaveButton'),
      }}
      contactPhone={CONTACT_PHONE}
      summary={summary}
      summaryLoading={summaryLoading}
      billingData={billingData}
      billingLoading={billingLoading}
      invoices={invoicesData?.invoices ?? []}
      invoicesTotalCount={invoicesData?.totalCount ?? 0}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      onSaveBillingData={handleSaveBillingData}
      gusLookup={gusLookup}
    />
  );
}
