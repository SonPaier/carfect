-- Add missing columns to invoices table to match shared invoicing-api edge function
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS buyer_country text,
  ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'transfer',
  ADD COLUMN IF NOT EXISTS place text,
  ADD COLUMN IF NOT EXISTS seller_person text,
  ADD COLUMN IF NOT EXISTS sales_order_id uuid,
  ADD COLUMN IF NOT EXISTS bank_account text;
