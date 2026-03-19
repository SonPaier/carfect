-- Add per-product discount percentage to sales_order_items
ALTER TABLE sales_order_items
  ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
