-- Change default status for new protocols
ALTER TABLE public.protocols
  ALTER COLUMN status SET DEFAULT 'draft';

-- Migrate existing 'completed' protocols to 'accepted'
UPDATE public.protocols
  SET status = 'accepted'
  WHERE status = 'completed';
