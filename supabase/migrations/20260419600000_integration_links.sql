CREATE TABLE public.integration_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  provider text NOT NULL,
  external_customer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_links_pkey PRIMARY KEY (id),
  CONSTRAINT integration_links_instance_provider_key UNIQUE (instance_id, provider)
);

ALTER TABLE public.integration_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage integration_links"
  ON public.integration_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Instance users can read own integration_link"
  ON public.integration_links FOR SELECT TO authenticated
  USING (public.can_access_instance(instance_id));
