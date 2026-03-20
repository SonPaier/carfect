ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS shipping_address JSONB;
