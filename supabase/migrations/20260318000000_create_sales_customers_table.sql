-- Create separate sales_customers table and migrate data from customers table.
-- Sales and studio customers are independent entities — no shared table.

-- Step 1: Create sales_customers table
CREATE TABLE IF NOT EXISTS public.sales_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text NOT NULL,
  email text,
  company text,
  nip text,
  default_currency text DEFAULT 'PLN',
  is_net_payer boolean NOT NULL DEFAULT false,
  discount_percent integer,
  sales_notes text,
  shipping_addressee text,
  shipping_country_code text,
  shipping_street text,
  shipping_street_line2 text,
  shipping_postal_code text,
  shipping_city text,
  billing_street text,
  billing_postal_code text,
  billing_city text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sales_customers_pkey PRIMARY KEY (id),
  CONSTRAINT sales_customers_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.instances(id) ON DELETE CASCADE
);

ALTER TABLE public.sales_customers ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX sales_customers_instance_id_phone_key
  ON public.sales_customers USING btree (instance_id, phone);

-- Step 2: Migrate existing sales customers (preserve UUIDs for FK integrity)
INSERT INTO public.sales_customers (
  id, instance_id, name, contact_person, phone, email, company, nip,
  default_currency, is_net_payer, discount_percent, sales_notes,
  shipping_addressee, shipping_country_code, shipping_street, shipping_street_line2,
  shipping_postal_code, shipping_city, billing_street, billing_postal_code, billing_city,
  created_at, updated_at
)
SELECT
  id, instance_id, name, contact_person, phone, email, company, nip,
  default_currency, is_net_payer, discount_percent, sales_notes,
  shipping_addressee, shipping_country_code, shipping_street, shipping_street_line2,
  shipping_postal_code, shipping_city, billing_street, billing_postal_code, billing_city,
  created_at, updated_at
FROM public.customers
WHERE source = 'sales';

-- Step 3: Update sales_orders FK to point to sales_customers
ALTER TABLE public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_customer_id_fkey;
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.sales_customers(id);

-- Step 4: Delete sales customers from customers table
DELETE FROM public.customers WHERE source = 'sales';

-- Step 5: Clean up customers table — remove source column and related indexes
DROP POLICY IF EXISTS "Sales can view customers" ON public.customers;
DROP POLICY IF EXISTS "Sales can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Sales can update customers" ON public.customers;
DROP POLICY IF EXISTS "Sales can delete customers" ON public.customers;

ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_instance_id_source_phone_key;
DROP INDEX IF EXISTS idx_customers_source;
ALTER TABLE public.customers DROP COLUMN IF EXISTS source;

-- Recreate unique constraint without source
CREATE UNIQUE INDEX IF NOT EXISTS customers_instance_id_phone_key
  ON public.customers USING btree (instance_id, phone);

-- Step 6: RLS policies on sales_customers — admin + sales roles
CREATE POLICY "Admins can manage sales_customers"
  ON public.sales_customers
  AS permissive
  FOR ALL
  TO public
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
  );

CREATE POLICY "Sales can view sales_customers"
  ON public.sales_customers
  AS permissive
  FOR SELECT
  TO public
  USING (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));

CREATE POLICY "Sales can insert sales_customers"
  ON public.sales_customers
  AS permissive
  FOR INSERT
  TO public
  WITH CHECK (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));

CREATE POLICY "Sales can update sales_customers"
  ON public.sales_customers
  AS permissive
  FOR UPDATE
  TO public
  USING (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));

CREATE POLICY "Sales can delete sales_customers"
  ON public.sales_customers
  AS permissive
  FOR DELETE
  TO public
  USING (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));
