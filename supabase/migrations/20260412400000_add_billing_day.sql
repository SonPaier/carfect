-- Add billing_day to instance_subscriptions
-- Determines which day of the month invoices are generated (1, 10, 20, or 28)
ALTER TABLE public.instance_subscriptions
  ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1
  CHECK (billing_day IN (1, 10, 20));
