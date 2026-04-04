-- Add pricing_mode setting: whether instance works with netto or brutto prices
ALTER TABLE "public"."instances"
  ADD COLUMN "pricing_mode" text NOT NULL DEFAULT 'brutto'
  CHECK ("pricing_mode" IN ('netto', 'brutto'));

COMMENT ON COLUMN "public"."instances"."pricing_mode"
  IS 'Whether the instance works with netto or brutto prices. Affects price display and input across admin and sales panels.';
