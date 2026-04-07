INSERT INTO storage.buckets (id, name, public)
VALUES ('hint-images', 'hint-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for hint-images bucket
CREATE POLICY "Super admin can upload hint images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'hint-images' AND public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Anyone can read hint images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'hint-images');

CREATE POLICY "Super admin can delete hint images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'hint-images' AND public.has_role(auth.uid(), 'super_admin'::public.app_role));
