-- ============================================================================
-- Fix increment_sms_usage RPC: always increment (remove limit guard)
-- Change default sms_limit from 50 to 100
-- Backfill existing instances with sms_limit = 50 to 100
-- ============================================================================

-- 1. Fix increment_sms_usage to always increment and return true
CREATE OR REPLACE FUNCTION public.increment_sms_usage(_instance_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.instances
  SET sms_used = sms_used + 1, updated_at = now()
  WHERE id = _instance_id;
  RETURN true;
END;
$$;

-- 2. Change default sms_limit from 50 to 100
ALTER TABLE public.instances ALTER COLUMN sms_limit SET DEFAULT 100;

-- 3. Update existing instances that still have the old default of 50
UPDATE public.instances SET sms_limit = 100 WHERE sms_limit = 50;
