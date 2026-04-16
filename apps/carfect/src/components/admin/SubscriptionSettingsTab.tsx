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
  const { billingData, loading: billingLoading, updateBillingData } = useBillingData(instanceId ?? undefined);

  const gusLookup = useGusLookup({
    supabase,
    onSuccess: () => toast.success(t('settings.billing.gusSuccess', 'Dane pobrane z GUS')),
    onError: (msg) => toast.error(msg),
  });

  const handleSaveBillingData = async (data: BillingData) => {
    try {
      await updateBillingData(data);
      toast.success(t('settings.billing.saveSuccess', 'Dane do faktury zapisane'));
    } catch {
      toast.error(t('settings.billing.saveError', 'Nie udało się zapisać danych'));
    }
  };

  return (
    <SubscriptionSettingsTabContent
      labels={{
        heading: t('settings.billing.heading', 'Subskrypcja i faktury'),
        subtitle: t('settings.billing.subtitle', 'Zarządzaj subskrypcją i danymi do faktur'),
        loading: t('common.loading', 'Ładowanie...'),
        paymentsHeading: t('settings.billing.payments', 'Płatności'),
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
