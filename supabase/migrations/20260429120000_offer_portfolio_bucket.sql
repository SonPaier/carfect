-- Public storage bucket for instance offer portfolio photos.
-- Path convention: {instance_id}/{photo_id}.{ext}
-- Public read because the customer-facing offer page is served to anonymous
-- visitors holding a public_token. Writes are scoped per instance via the
-- first folder segment.

INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-portfolio', 'offer-portfolio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read offer portfolio photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'offer-portfolio');

CREATE POLICY "Caller can upload to own instance offer portfolio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'offer-portfolio'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(
      auth.uid(),
      'admin'::public.app_role,
      ((storage.foldername(name))[1])::uuid
    )
    OR public.has_instance_role(
      auth.uid(),
      'employee'::public.app_role,
      ((storage.foldername(name))[1])::uuid
    )
  )
);

CREATE POLICY "Caller can delete own instance offer portfolio"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'offer-portfolio'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(
      auth.uid(),
      'admin'::public.app_role,
      ((storage.foldername(name))[1])::uuid
    )
    OR public.has_instance_role(
      auth.uid(),
      'employee'::public.app_role,
      ((storage.foldername(name))[1])::uuid
    )
  )
);
