-- Add offer_discounts_enabled to instances
-- Controls whether per-item discount % fields appear in the v2 offer generator
ALTER TABLE instances
  ADD COLUMN IF NOT EXISTS offer_discounts_enabled boolean NOT NULL DEFAULT false;
