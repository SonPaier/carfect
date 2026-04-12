UPDATE public.subscription_invoices
SET payment_status = 'paid'
WHERE instance_id = 'c6300bdc-5070-4599-8143-06926578a424'
  AND billing_period_start = '2026-04-10';
