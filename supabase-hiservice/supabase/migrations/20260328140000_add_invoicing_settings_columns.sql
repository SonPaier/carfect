-- Add missing columns to invoicing_settings used by shared-invoicing lib
ALTER TABLE public.invoicing_settings
  ADD COLUMN IF NOT EXISTS default_payment_type text DEFAULT 'transfer',
  ADD COLUMN IF NOT EXISTS default_place text,
  ADD COLUMN IF NOT EXISTS default_seller_person text;
