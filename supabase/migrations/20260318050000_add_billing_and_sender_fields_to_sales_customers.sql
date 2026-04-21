ALTER TABLE public.sales_customers
  ADD COLUMN IF NOT EXISTS billing_country_code text DEFAULT 'PL',
  ADD COLUMN IF NOT EXISTS billing_street_line2 text,
  ADD COLUMN IF NOT EXISTS shipping_same_as_billing boolean NOT NULL DEFAULT false;
