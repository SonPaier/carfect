-- Extend Bling trial to April 25
UPDATE public.instance_subscriptions SET
  trial_expires_at = '2026-04-25'
WHERE instance_id = '29f15eeb-5ada-446c-9351-0194dbc886fd'
  AND is_trial = true;
