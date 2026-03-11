-- Add attachments JSONB column to sales_orders
ALTER TABLE "public"."sales_orders"
  ADD COLUMN IF NOT EXISTS "attachments" jsonb DEFAULT '[]';

-- Create storage bucket for order attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-attachments', 'order-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for order-attachments bucket
CREATE POLICY "Authenticated users can upload order attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'order-attachments');

CREATE POLICY "Authenticated users can read order attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'order-attachments');

CREATE POLICY "Authenticated users can delete order attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'order-attachments');
