import { useState } from 'react';
import { toast } from 'sonner';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const { summary, loading: summaryLoading } = useSubscriptionSummary(instanceId ?? undefined);
  const { data: invoicesData } = useSubscriptionInvoices(instanceId ?? undefined, page, pageSize);
  const { billingData, loading: billingLoading, updateBillingData } = useBillingData(instanceId ?? undefined);

  const gusLookup = useGusLookup({
    supabase,
    onSuccess: () => toast.success('Dane pobrane z GUS'),
    onError: (msg) => toast.error(msg),
  });

  const handleSaveBillingData = async (data: BillingData) => {
    try {
      await updateBillingData(data);
      toast.success('Dane do faktury zapisane');
    } catch {
      toast.error('Nie udało się zapisać danych');
    }
  };

  return (
    <SubscriptionSettingsTabContent
      labels={{
        heading: 'Subskrypcja i faktury',
        subtitle: 'Zarządzaj subskrypcją i danymi do faktur',
        loading: 'Ładowanie...',
        paymentsHeading: 'Płatności',
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
