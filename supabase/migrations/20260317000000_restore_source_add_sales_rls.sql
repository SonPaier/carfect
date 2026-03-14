-- Restore source column for customer list independence (Studio vs Sales)
-- and add missing RLS policies for 'sales' role on customers table.

-- Step 1: Add source column back (with default 'studio')
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'studio';

-- Step 2: Mark customers referenced by sales_orders as 'sales'
UPDATE customers SET source = 'sales'
WHERE id IN (
  SELECT DISTINCT customer_id FROM sales_orders WHERE customer_id IS NOT NULL
);

-- Step 3: Replace unique constraint to include source
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_instance_id_phone_key;
DROP INDEX IF EXISTS customers_instance_id_phone_key;

CREATE UNIQUE INDEX customers_instance_id_source_phone_key
  ON customers USING btree (instance_id, source, phone);
ALTER TABLE customers ADD CONSTRAINT customers_instance_id_source_phone_key
  UNIQUE USING INDEX customers_instance_id_source_phone_key;

-- Step 4: Index for fast source filtering
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers (source);

-- Step 5: Add RLS policies for 'sales' role on customers table
CREATE POLICY "Sales can view customers"
  ON "public"."customers"
  AS permissive
  FOR SELECT
  TO public
  USING (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));

CREATE POLICY "Sales can insert customers"
  ON "public"."customers"
  AS permissive
  FOR INSERT
  TO public
  WITH CHECK (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));

CREATE POLICY "Sales can update customers"
  ON "public"."customers"
  AS permissive
  FOR UPDATE
  TO public
  USING (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));

CREATE POLICY "Sales can delete customers"
  ON "public"."customers"
  AS permissive
  FOR DELETE
  TO public
  USING (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));
