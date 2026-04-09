-- Add product_type to sales_products: 'roll' (default, existing behavior) or 'other' (generic product)
ALTER TABLE public.sales_products
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'roll';
