import { SubscriptionSummaryCard } from './SubscriptionSummaryCard';
import { TrialBanner } from './TrialBanner';
import { BillingHistoryTable } from './BillingHistoryTable';
import { InvoiceDataForm } from './InvoiceDataForm';
import type { SubscriptionSummary, SubscriptionInvoice, BillingData } from './billing.types';

const EMPTY_BILLING: BillingData = {
  billing_name: null,
  billing_nip: null,
  billing_street: null,
  billing_postal_code: null,
  billing_city: null,
};

export interface SubscriptionSettingsLabels {
  heading: string;
  subtitle: string;
  loading: string;
  paymentsHeading: string;
}

interface SubscriptionSettingsTabContentProps {
  labels: SubscriptionSettingsLabels;
  contactPhone: string;
  summary: SubscriptionSummary | null;
  summaryLoading: boolean;
  billingData: BillingData | null;
  billingLoading: boolean;
  invoices: SubscriptionInvoice[];
  invoicesTotalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSaveBillingData: (data: BillingData) => Promise<void>;
  gusLookup: {
    lookupNip: (nip: string) => Promise<{ name: string; street: string; postalCode: string; city: string } | null>;
    loading: boolean;
  };
}

export function SubscriptionSettingsTabContent({
  labels,
  contactPhone,
  summary,
  summaryLoading,
  billingData,
  billingLoading,
  invoices,
  invoicesTotalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSaveBillingData,
  gusLookup,
}: SubscriptionSettingsTabContentProps) {
  const isLoading = summaryLoading || billingLoading;
  const isTrial = summary?.isTrial && summary.trialExpiresAt;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{labels.heading}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? labels.loading : labels.subtitle}
        </p>
      </div>

      {isLoading ? null : isTrial ? (
        <TrialBanner trialExpiresAt={summary!.trialExpiresAt!} contactPhone={contactPhone} />
      ) : (
        <>
          {summary && <SubscriptionSummaryCard summary={summary} />}

          <h4 className="text-base font-semibold">{labels.paymentsHeading}</h4>
          <BillingHistoryTable
            invoices={invoices}
            totalCount={invoicesTotalCount}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />

          <InvoiceDataForm
            initialData={billingData ?? EMPTY_BILLING}
            onSave={onSaveBillingData}
            gusLookup={gusLookup}
          />
        </>
      )}
    </div>
  );
}
