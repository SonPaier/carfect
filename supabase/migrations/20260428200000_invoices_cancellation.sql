-- Add cancellation fields to invoices and extend status enum.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Replace any existing status check constraint with one that allows 'cancelled'.
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.invoices'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft','issued','sent','paid','overdue','cancelled'));
