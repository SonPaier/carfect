-- Add photo_urls columns
ALTER TABLE public.offer_scopes ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT NULL;
ALTER TABLE public.unified_services ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT NULL;

-- Create service-photos bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for service-photos bucket
CREATE POLICY "Public read service-photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'service-photos');
CREATE POLICY "Authenticated upload service-photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'service-photos');
CREATE POLICY "Authenticated delete service-photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'service-photos');
CREATE POLICY "Authenticated update service-photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'service-photos');