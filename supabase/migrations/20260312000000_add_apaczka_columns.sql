-- Add Apaczka shipment tracking columns to sales_orders
ALTER TABLE "public"."sales_orders"
  ADD COLUMN IF NOT EXISTS "apaczka_order_id" text,
  ADD COLUMN IF NOT EXISTS "apaczka_tracking_url" text;

COMMENT ON COLUMN "public"."sales_orders"."apaczka_order_id"
  IS 'Apaczka order ID returned from order_send API';
COMMENT ON COLUMN "public"."sales_orders"."apaczka_tracking_url"
  IS 'Tracking URL for the Apaczka shipment';

-- Add Apaczka config to instances (credentials are per-instance)
ALTER TABLE "public"."instances"
  ADD COLUMN IF NOT EXISTS "apaczka_sender_address" jsonb,
  ADD COLUMN IF NOT EXISTS "apaczka_service_id" integer,
  ADD COLUMN IF NOT EXISTS "apaczka_app_id" text,
  ADD COLUMN IF NOT EXISTS "apaczka_app_secret" text;

COMMENT ON COLUMN "public"."instances"."apaczka_sender_address"
  IS 'Sender address for Apaczka shipments: { name, contact_person, street, postal_code, city, country_code, phone, email }';
COMMENT ON COLUMN "public"."instances"."apaczka_service_id"
  IS 'Default Apaczka courier service ID for this instance';
COMMENT ON COLUMN "public"."instances"."apaczka_app_id"
  IS 'Apaczka Web API App ID for this instance';
COMMENT ON COLUMN "public"."instances"."apaczka_app_secret"
  IS 'Apaczka Web API App Secret for this instance';
