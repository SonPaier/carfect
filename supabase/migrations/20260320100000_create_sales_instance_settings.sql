-- Create sales_instance_settings table for Sales Panel company data.
-- Separate from the instances table so Studio and Sales panels have independent settings.
-- Each instance gets at most one row (1:1 with instances).

CREATE TABLE IF NOT EXISTS public.sales_instance_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL UNIQUE,
  name text,
  short_name text,
  invoice_company_name text,
  nip text,
  phone text,
  email text,
  address text,
  logo_url text,
  website text,
  contact_person text,
  social_facebook text,
  social_instagram text,
  google_maps_url text,
  bank_accounts jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sales_instance_settings_pkey PRIMARY KEY (id),
  CONSTRAINT sales_instance_settings_instance_id_fkey FOREIGN KEY (instance_id)
    REFERENCES public.instances(id) ON DELETE CASCADE
);

ALTER TABLE public.sales_instance_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies — same pattern as sales_customers
DROP POLICY IF EXISTS "Admins can manage sales_instance_settings" ON public.sales_instance_settings;
DROP POLICY IF EXISTS "Sales can view sales_instance_settings" ON public.sales_instance_settings;
DROP POLICY IF EXISTS "Sales can insert sales_instance_settings" ON public.sales_instance_settings;
DROP POLICY IF EXISTS "Sales can update sales_instance_settings" ON public.sales_instance_settings;

CREATE POLICY "Admins can manage sales_instance_settings"
  ON public.sales_instance_settings
  AS permissive
  FOR ALL
  TO public
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
  );

CREATE POLICY "Sales can view sales_instance_settings"
  ON public.sales_instance_settings
  AS permissive
  FOR SELECT
  TO public
  USING (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));

CREATE POLICY "Sales can insert sales_instance_settings"
  ON public.sales_instance_settings
  AS permissive
  FOR INSERT
  TO public
  WITH CHECK (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));

CREATE POLICY "Sales can update sales_instance_settings"
  ON public.sales_instance_settings
  AS permissive
  FOR UPDATE
  TO public
  USING (public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id));

-- Storage bucket for sales logos (separate from instance-logos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sales-logos', 'sales-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for sales-logos bucket
DO $$
BEGIN
  -- Allow authenticated users to upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload sales logos'
  ) THEN
    CREATE POLICY "Authenticated users can upload sales logos"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'sales-logos');
  END IF;

  -- Allow public to read (bucket is public)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read sales logos'
  ) THEN
    CREATE POLICY "Anyone can read sales logos"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'sales-logos');
  END IF;

  -- Allow authenticated users to delete their logos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete sales logos'
  ) THEN
    CREATE POLICY "Authenticated users can delete sales logos"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'sales-logos');
  END IF;
END $$;
