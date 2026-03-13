-- Add shipping_addressee column (previously the addressee was stored in shipping_street_line2)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shipping_addressee TEXT;

-- Migrate: for sales customers, shipping_street_line2 was used as addressee, move it to the new column
UPDATE customers
SET shipping_addressee = shipping_street_line2,
    shipping_street_line2 = NULL
WHERE source = 'sales'
  AND shipping_street_line2 IS NOT NULL;
