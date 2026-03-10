-- Add packages JSONB column to sales_orders
ALTER TABLE "public"."sales_orders"
  ADD COLUMN "packages" jsonb;

COMMENT ON COLUMN "public"."sales_orders"."packages" IS
  'JSON array of package objects: { id, shippingMethod, packagingType?, dimensions?, productKeys[] }';
