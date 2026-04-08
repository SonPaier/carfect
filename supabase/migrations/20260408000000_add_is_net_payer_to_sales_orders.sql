ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS is_net_payer boolean NOT NULL DEFAULT false;

-- Track required running meters (mb) instead of m² — m² is derived via roll width
ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS required_mb numeric;

-- Allow fractional quantities (m² from mb conversion)
ALTER TABLE public.sales_order_items
  ALTER COLUMN quantity TYPE numeric USING quantity::numeric;
