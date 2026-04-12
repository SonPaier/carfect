-- Add billing fields to instances table
ALTER TABLE public.instances
  ADD COLUMN IF NOT EXISTS billing_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_nip TEXT,
  ADD COLUMN IF NOT EXISTS billing_street TEXT,
  ADD COLUMN IF NOT EXISTS billing_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_city TEXT;

-- Add next_billing_date to instance_subscriptions
ALTER TABLE public.instance_subscriptions
  ADD COLUMN IF NOT EXISTS next_billing_date DATE;

-- Create subscription_invoices table
CREATE TABLE public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  amount_net NUMERIC NOT NULL,
  amount_gross NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PLN',
  positions JSONB NOT NULL DEFAULT '[]',
  invoice_number TEXT,
  invoice_issue_date DATE NOT NULL,
  payment_due_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  pdf_url TEXT,
  external_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_subscription_invoices_instance_id ON public.subscription_invoices(instance_id);
CREATE INDEX idx_subscription_invoices_payment_status ON public.subscription_invoices(payment_status);

-- Enable RLS
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Users see only own instance invoices (with NULL guard)
CREATE POLICY "Users can view own instance invoices"
ON public.subscription_invoices
AS permissive
FOR SELECT
TO authenticated
USING (
  instance_id IS NOT NULL
  AND instance_id = (SELECT p.instance_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- Super admin full access
CREATE POLICY "Super admin full access to subscription invoices"
ON public.subscription_invoices
AS permissive
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
)
WITH CHECK (
  public.is_super_admin()
);
