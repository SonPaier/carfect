-- Standardize SMS limit to 100 across all plans
UPDATE public.subscription_plans SET sms_limit = 100 WHERE sms_limit != 100;
