ALTER TABLE offers ADD COLUMN IF NOT EXISTS offer_format text CHECK (offer_format IN ('v1', 'v2'));
