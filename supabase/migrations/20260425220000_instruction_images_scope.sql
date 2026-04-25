-- Tighten the instruction-images bucket RLS so an authenticated user can
-- only write/delete inside their own instance folder. Without this, any
-- authenticated user across all instances could overwrite or delete other
-- instances' images (path is `<instance_id>/<uuid>.<ext>`).

DROP POLICY IF EXISTS "Authenticated users can upload instruction images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete instruction images" ON storage.objects;

CREATE POLICY "Caller can upload to own instance instruction images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'instruction-images'
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

CREATE POLICY "Caller can delete own instance instruction images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'instruction-images'
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
