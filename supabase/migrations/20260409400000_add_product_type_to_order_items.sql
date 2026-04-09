-- Add product_type to sales_order_items so it persists through edit
ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'roll';
