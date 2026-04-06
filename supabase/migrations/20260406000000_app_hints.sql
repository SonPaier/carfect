-- Create app_hints and app_hint_dismissals tables.
-- Used for in-app tooltips, popups and infoboxes managed by superadmin.

CREATE TABLE IF NOT EXISTS public.app_hints (
  id                 uuid NOT NULL DEFAULT gen_random_uuid(),
  type               text NOT NULL,
  title              text NOT NULL,
  body               text NOT NULL,
  image_url          text,
  target_element_id  text,
  route_pattern      text,
  target_roles       text[] NOT NULL DEFAULT '{}',
  delay_ms           integer NOT NULL DEFAULT 0,
  active             boolean NOT NULL DEFAULT true,
  created_at         timestamp with time zone DEFAULT now(),
  updated_at         timestamp with time zone DEFAULT now(),
  CONSTRAINT app_hints_pkey PRIMARY KEY (id),
  CONSTRAINT app_hints_type_check CHECK (type IN ('tooltip', 'popup', 'infobox'))
);

ALTER TABLE public.app_hints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can manage app_hints" ON public.app_hints;
DROP POLICY IF EXISTS "Authenticated users can read app_hints" ON public.app_hints;

CREATE POLICY "Super admin can manage app_hints"
  ON public.app_hints
  AS permissive
  FOR ALL
  TO public
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Authenticated users can read app_hints"
  ON public.app_hints
  AS permissive
  FOR SELECT
  TO authenticated
  USING (active = true);

-- -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.app_hint_dismissals (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  hint_id      uuid NOT NULL,
  user_id      uuid NOT NULL,
  dismissed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_hint_dismissals_pkey PRIMARY KEY (id),
  CONSTRAINT app_hint_dismissals_hint_id_fkey FOREIGN KEY (hint_id)
    REFERENCES public.app_hints(id) ON DELETE CASCADE,
  CONSTRAINT app_hint_dismissals_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT app_hint_dismissals_hint_user_unique UNIQUE (hint_id, user_id)
);

ALTER TABLE public.app_hint_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own dismissals" ON public.app_hint_dismissals;
DROP POLICY IF EXISTS "Super admin can read all dismissals" ON public.app_hint_dismissals;

CREATE POLICY "Users can manage own dismissals"
  ON public.app_hint_dismissals
  AS permissive
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admin can read all dismissals"
  ON public.app_hint_dismissals
  AS permissive
  FOR SELECT
  TO public
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));
