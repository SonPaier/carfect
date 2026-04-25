-- Public storage bucket for images embedded in post-sale instructions.
-- Public read because the customer-facing URL has no auth — anyone with the
-- instruction slug should be able to load the inline images.

INSERT INTO storage.buckets (id, name, public)
VALUES ('instruction-images', 'instruction-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload instruction images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'instruction-images');

CREATE POLICY "Authenticated users can delete instruction images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'instruction-images');

CREATE POLICY "Anyone can read instruction images"
ON storage.objects FOR SELECT
USING (bucket_id = 'instruction-images');
