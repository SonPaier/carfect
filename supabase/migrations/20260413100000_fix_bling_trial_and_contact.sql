-- Extend Bling trial to April 25
DO $$
DECLARE
  v_instance_id uuid := '29f15eeb-5ada-446c-9351-0194dbc886fd';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM instances WHERE id = v_instance_id) THEN RETURN; END IF;

  UPDATE public.instance_subscriptions SET
    trial_expires_at = '2026-04-25'
  WHERE instance_id = v_instance_id
    AND is_trial = true;
END $$;
