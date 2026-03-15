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

CREATE UNIQUE INDEX IF NOT EXISTS sales_customers_instance_id_phone_key
  ON public.sales_customers USING btree (instance_id, phone);

-- Step 2: Migrate existing customers referenced by sales_orders into sales_customers
-- Copy ALL customers that are referenced by sales_orders (preserving UUIDs for FK integrity)
INSERT INTO public.sales_customers (
  id, instance_id, name, contact_person, phone, email, company, nip,
  default_currency, is_net_payer, discount_percent, sales_notes,
  shipping_addressee, shipping_country_code, shipping_street, shipping_street_line2,
  shipping_postal_code, shipping_city, billing_street, billing_postal_code, billing_city,
  created_at, updated_at
)
SELECT
  c.id, c.instance_id, c.name, c.contact_person, c.phone, c.email, c.company, c.nip,
  c.default_currency, c.is_net_payer, c.discount_percent, c.sales_notes,
  c.shipping_addressee, c.shipping_country_code, c.shipping_street, c.shipping_street_line2,
  c.shipping_postal_code, c.shipping_city, c.billing_street, c.billing_postal_code, c.billing_city,
  c.created_at, c.updated_at
FROM public.customers c
WHERE c.id IN (SELECT DISTINCT customer_id FROM public.sales_orders WHERE customer_id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- Clean up source column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'source'
  ) THEN
    -- Also copy any remaining customers with source='sales' not already copied
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
    WHERE source = 'sales'
    ON CONFLICT (id) DO NOTHING;

    DELETE FROM public.customers WHERE source = 'sales';

    DROP POLICY IF EXISTS "Sales can view customers" ON public.customers;
    DROP POLICY IF EXISTS "Sales can insert customers" ON public.customers;
    DROP POLICY IF EXISTS "Sales can update customers" ON public.customers;
    DROP POLICY IF EXISTS "Sales can delete customers" ON public.customers;

    ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_instance_id_source_phone_key;
    DROP INDEX IF EXISTS idx_customers_source;
    ALTER TABLE public.customers DROP COLUMN IF EXISTS source;

    CREATE UNIQUE INDEX IF NOT EXISTS customers_instance_id_phone_key
      ON public.customers USING btree (instance_id, phone);
  END IF;
END $$;

-- Step 3: Update sales_orders FK to point to sales_customers
ALTER TABLE public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_customer_id_fkey;
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.sales_customers(id);

-- Step 4: RLS policies on sales_customers — admin + sales roles
-- Drop first in case of partial previous run
DROP POLICY IF EXISTS "Admins can manage sales_customers" ON public.sales_customers;
DROP POLICY IF EXISTS "Sales can view sales_customers" ON public.sales_customers;
DROP POLICY IF EXISTS "Sales can insert sales_customers" ON public.sales_customers;
DROP POLICY IF EXISTS "Sales can update sales_customers" ON public.sales_customers;
DROP POLICY IF EXISTS "Sales can delete sales_customers" ON public.sales_customers;

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
