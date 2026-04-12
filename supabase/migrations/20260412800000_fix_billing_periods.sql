-- Fix billing periods to use "non-overlapping" convention:
-- Period: billing_day to (next billing_day - 1)
-- E.g. billing_day=10: 10.02–09.03, 10.03–09.04, 10.04–09.05

-- Fix Armcar invoices
UPDATE public.subscription_invoices SET
  billing_period_end = '2026-03-09',
  positions = '[{"name": "Subskrypcja 10.02.2026–09.03.2026", "quantity": 1, "unit_price_net": 286, "vat_rate": 23}]'::jsonb
WHERE instance_id = '4ce15650-76c7-47e7-b5c8-32b9a2d1c321'
  AND billing_period_start = '2026-02-10';

UPDATE public.subscription_invoices SET
  billing_period_end = '2026-04-09',
  positions = '[{"name": "Subskrypcja 10.03.2026–09.04.2026", "quantity": 1, "unit_price_net": 286, "vat_rate": 23}]'::jsonb
WHERE instance_id = '4ce15650-76c7-47e7-b5c8-32b9a2d1c321'
  AND billing_period_start = '2026-03-10';

UPDATE public.subscription_invoices SET
  billing_period_end = '2026-05-09',
  positions = '[{"name": "Subskrypcja 10.04.2026–09.05.2026", "quantity": 1, "unit_price_net": 286, "vat_rate": 23}, {"name": "Dodatkowy pakiet SMS", "quantity": 1, "unit_price_net": 35, "vat_rate": 23}]'::jsonb
WHERE instance_id = '4ce15650-76c7-47e7-b5c8-32b9a2d1c321'
  AND billing_period_start = '2026-04-10';

-- Fix Demo invoices
UPDATE public.subscription_invoices SET
  billing_period_end = '2026-01-31',
  positions = '[{"name": "Subskrypcja 01.01.2026–31.01.2026", "quantity": 1, "unit_price_net": 297, "vat_rate": 23}]'::jsonb
WHERE instance_id = 'b3c29bfe-f393-4e1a-a837-68dd721df420'
  AND billing_period_start = '2026-01-01';

UPDATE public.subscription_invoices SET
  billing_period_end = '2026-02-28',
  positions = '[{"name": "Subskrypcja 01.02.2026–28.02.2026", "quantity": 1, "unit_price_net": 297, "vat_rate": 23}]'::jsonb
WHERE instance_id = 'b3c29bfe-f393-4e1a-a837-68dd721df420'
  AND billing_period_start = '2026-02-01';

UPDATE public.subscription_invoices SET
  billing_period_end = '2026-03-31',
  positions = '[{"name": "Subskrypcja 01.03.2026–31.03.2026", "quantity": 1, "unit_price_net": 297, "vat_rate": 23}, {"name": "Nadwyżka SMS za poprzedni okres", "quantity": 252, "unit_price_net": 0.12, "vat_rate": 23}]'::jsonb
WHERE instance_id = 'b3c29bfe-f393-4e1a-a837-68dd721df420'
  AND billing_period_start = '2026-03-01';

UPDATE public.subscription_invoices SET
  billing_period_end = '2026-04-30',
  positions = '[{"name": "Subskrypcja 01.04.2026–30.04.2026", "quantity": 1, "unit_price_net": 297, "vat_rate": 23}]'::jsonb
WHERE instance_id = 'b3c29bfe-f393-4e1a-a837-68dd721df420'
  AND billing_period_start = '2026-04-01';
