-- Instance-level portfolio of offer photos and per-offer selection.
-- - instance_portfolio_photos: shared library of photos for an instance.
-- - offer_portfolio_photos: junction selecting up to 16 photos per offer.

CREATE TABLE public.instance_portfolio_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_instance_portfolio_photos_instance
  ON public.instance_portfolio_photos (instance_id, sort_order);

ALTER TABLE public.instance_portfolio_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instance members can read portfolio photos"
  ON public.instance_portfolio_photos
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
    OR public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id)
  );

CREATE POLICY "Instance members can manage portfolio photos"
  ON public.instance_portfolio_photos
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
    OR public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
    OR public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id)
  );

-- Junction: which portfolio photos appear on which offer (and in what order).
CREATE TABLE public.offer_portfolio_photos (
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES public.instance_portfolio_photos(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (offer_id, photo_id)
);

CREATE INDEX idx_offer_portfolio_photos_offer
  ON public.offer_portfolio_photos (offer_id, sort_order);

ALTER TABLE public.offer_portfolio_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instance members can manage offer portfolio selections"
  ON public.offer_portfolio_photos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_id
      AND (
        public.has_role(auth.uid(), 'super_admin'::public.app_role)
        OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, o.instance_id)
        OR public.has_instance_role(auth.uid(), 'employee'::public.app_role, o.instance_id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_id
      AND (
        public.has_role(auth.uid(), 'super_admin'::public.app_role)
        OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, o.instance_id)
        OR public.has_instance_role(auth.uid(), 'employee'::public.app_role, o.instance_id)
      )
    )
    AND EXISTS (
      -- Ensure the picked photo belongs to the same instance as the offer.
      SELECT 1
      FROM public.instance_portfolio_photos p
      JOIN public.offers o ON o.id = offer_id
      WHERE p.id = photo_id AND p.instance_id = o.instance_id
    )
  );

-- Enforce max 16 photos per offer.
CREATE OR REPLACE FUNCTION public.enforce_offer_portfolio_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT count(*) INTO current_count
  FROM public.offer_portfolio_photos
  WHERE offer_id = NEW.offer_id;

  IF current_count >= 16 THEN
    RAISE EXCEPTION 'Offer % already has the maximum of 16 portfolio photos', NEW.offer_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_offer_portfolio_limit
BEFORE INSERT ON public.offer_portfolio_photos
FOR EACH ROW EXECUTE FUNCTION public.enforce_offer_portfolio_limit();
