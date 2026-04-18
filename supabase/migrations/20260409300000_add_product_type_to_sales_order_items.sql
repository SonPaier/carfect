-- Add product_type to sales_order_items to preserve type at order time
-- 'roll' = default, existing behavior (vehicle + mb fields)
-- 'other' = generic product (no vehicle, no roll assignment)
ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'roll';
