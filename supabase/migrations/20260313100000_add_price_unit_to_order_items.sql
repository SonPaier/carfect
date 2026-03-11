-- Add price_unit to sales_order_items (denormalized for display)
ALTER TABLE "public"."sales_order_items"
  ADD COLUMN IF NOT EXISTS "price_unit" text DEFAULT 'szt.';
