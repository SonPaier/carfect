-- RLS policies for instance-logos bucket
CREATE POLICY "Authenticated users can upload instance logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'instance-logos');

CREATE POLICY "Authenticated users can read instance logos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'instance-logos');

CREATE POLICY "Authenticated users can delete instance logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'instance-logos');

-- RLS policies for employee-photos bucket
CREATE POLICY "Authenticated users can upload employee photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'employee-photos');

CREATE POLICY "Authenticated users can read employee photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'employee-photos');

CREATE POLICY "Authenticated users can delete employee photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'employee-photos');

-- RLS policies for service-photos bucket
CREATE POLICY "Authenticated users can upload service photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-photos');

CREATE POLICY "Authenticated users can read service photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'service-photos');

CREATE POLICY "Authenticated users can delete service photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'service-photos');

-- RLS policies for price-lists bucket
CREATE POLICY "Authenticated users can upload price lists"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'price-lists');

CREATE POLICY "Authenticated users can read price lists"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'price-lists');

CREATE POLICY "Authenticated users can delete price lists"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'price-lists');
