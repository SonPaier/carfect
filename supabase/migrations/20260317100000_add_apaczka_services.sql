-- Add apaczka_services JSON array to instances
-- Format: [{ "name": "DPD", "serviceId": 12345 }, { "name": "DHL", "serviceId": 67890 }]
ALTER TABLE "public"."instances"
  ADD COLUMN IF NOT EXISTS "apaczka_services" jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN "public"."instances"."apaczka_services"
  IS 'Array of configured Apaczka courier services: [{ name, serviceId }]';
