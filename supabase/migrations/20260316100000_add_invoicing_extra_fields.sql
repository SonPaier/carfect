-- Add missing invoice fields: payment type, place, seller person, buyer country

-- invoicing_settings: new defaults
ALTER TABLE invoicing_settings
  ADD COLUMN IF NOT EXISTS default_payment_type TEXT DEFAULT 'transfer',
  ADD COLUMN IF NOT EXISTS default_place TEXT,
  ADD COLUMN IF NOT EXISTS default_seller_person TEXT;

-- invoices: new fields
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'transfer',
  ADD COLUMN IF NOT EXISTS place TEXT,
  ADD COLUMN IF NOT EXISTS seller_person TEXT,
  ADD COLUMN IF NOT EXISTS buyer_country TEXT;
