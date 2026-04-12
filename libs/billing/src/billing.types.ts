export type SubscriptionStatus = 'active' | 'inactive';
export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface InvoicePosition {
  name: string;
  quantity: number;
  unit_price_net: number;
  vat_rate: number;
}

export interface SubscriptionInvoice {
  id: string;
  instance_id: string;
  billing_period_start: string;
  billing_period_end: string;
  amount_net: number;
  amount_gross: number;
  currency: string;
  positions: InvoicePosition[];
  invoice_number: string | null;
  invoice_issue_date: string;
  payment_due_date: string;
  payment_status: PaymentStatus;
  pdf_url: string | null;
  external_invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingData {
  billing_name: string | null;
  billing_nip: string | null;
  billing_street: string | null;
  billing_postal_code: string | null;
  billing_city: string | null;
}

export interface SubscriptionSummary {
  monthlyPrice: number;
  stationLimit: number;
  status: SubscriptionStatus;
  isTrial: boolean;
  trialExpiresAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextBillingDate: string | null;
  smsUsed: number;
  smsLimit: number;
}
