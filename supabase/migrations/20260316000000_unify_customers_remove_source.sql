-- Unify customers: merge duplicates by phone, remove source-based separation
-- Step 1: Merge duplicates — for each (instance_id, phone) with multiple records,
-- keep the one with the most data (prefer non-null company, nip, email, address)
-- and delete the rest.

-- First, update the "keeper" record with any missing data from duplicates
WITH ranked AS (
  SELECT
    id,
    instance_id,
    phone,
    name,
    email,
    company,
    nip,
    address,
    billing_street,
    billing_postal_code,
    billing_city,
    ROW_NUMBER() OVER (
      PARTITION BY instance_id, phone
      ORDER BY
        -- Prefer records with more filled fields
        (CASE WHEN company IS NOT NULL THEN 1 ELSE 0 END
         + CASE WHEN nip IS NOT NULL THEN 1 ELSE 0 END
         + CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END
         + CASE WHEN address IS NOT NULL THEN 1 ELSE 0 END
         + CASE WHEN billing_street IS NOT NULL THEN 1 ELSE 0 END) DESC,
        updated_at DESC NULLS LAST,
        created_at DESC NULLS LAST
    ) AS rn
  FROM customers
  WHERE phone IS NOT NULL
),
keepers AS (
  SELECT * FROM ranked WHERE rn = 1
),
duplicates AS (
  SELECT r.id AS dup_id, r.instance_id, r.phone,
         r.email AS dup_email, r.company AS dup_company, r.nip AS dup_nip,
         r.address AS dup_address, r.billing_street AS dup_billing_street,
         r.billing_postal_code AS dup_billing_postal_code, r.billing_city AS dup_billing_city
  FROM ranked r
  WHERE r.rn > 1
)
-- Enrich keeper with data from duplicates (fill NULLs)
UPDATE customers c
SET
  email = COALESCE(c.email, d.dup_email),
  company = COALESCE(c.company, d.dup_company),
  nip = COALESCE(c.nip, d.dup_nip),
  address = COALESCE(c.address, d.dup_address),
  billing_street = COALESCE(c.billing_street, d.dup_billing_street),
  billing_postal_code = COALESCE(c.billing_postal_code, d.dup_billing_postal_code),
  billing_city = COALESCE(c.billing_city, d.dup_billing_city),
  updated_at = NOW()
FROM keepers k
JOIN duplicates d ON d.instance_id = k.instance_id AND d.phone = k.phone
WHERE c.id = k.id
  AND (c.email IS NULL OR c.company IS NULL OR c.nip IS NULL
       OR c.address IS NULL OR c.billing_street IS NULL);

-- Step 2: Delete duplicate records (keep only rn=1)
DELETE FROM customers
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY instance_id, phone
        ORDER BY
          (CASE WHEN company IS NOT NULL THEN 1 ELSE 0 END
           + CASE WHEN nip IS NOT NULL THEN 1 ELSE 0 END
           + CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END
           + CASE WHEN address IS NOT NULL THEN 1 ELSE 0 END
           + CASE WHEN billing_street IS NOT NULL THEN 1 ELSE 0 END) DESC,
          updated_at DESC NULLS LAST,
          created_at DESC NULLS LAST
      ) AS rn
    FROM customers
    WHERE phone IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Step 3: Drop old constraint and index
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_instance_id_source_phone_key;
DROP INDEX IF EXISTS idx_customers_source;

-- Step 4: Create new unique constraint on (instance_id, phone)
CREATE UNIQUE INDEX customers_instance_id_phone_key ON customers USING btree (instance_id, phone);
ALTER TABLE customers ADD CONSTRAINT customers_instance_id_phone_key UNIQUE USING INDEX customers_instance_id_phone_key;

-- Step 5: Drop source column
ALTER TABLE customers DROP COLUMN IF EXISTS source;
