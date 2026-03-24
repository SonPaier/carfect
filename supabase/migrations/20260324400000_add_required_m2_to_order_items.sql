ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS required_m2 NUMERIC;
