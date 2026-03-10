-- Allow authenticated users to upload, read, and delete photos in reservation-photos and protocol-photos buckets

CREATE POLICY "Authenticated users can upload reservation photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reservation-photos');

CREATE POLICY "Authenticated users can read reservation photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reservation-photos');

CREATE POLICY "Authenticated users can delete reservation photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reservation-photos');

CREATE POLICY "Authenticated users can upload protocol photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'protocol-photos');

CREATE POLICY "Authenticated users can read protocol photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'protocol-photos');

CREATE POLICY "Authenticated users can delete protocol photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'protocol-photos');
