-- Fix demo instance: set sms_limit to 100 (global standard)
UPDATE public.instances SET sms_limit = 100
WHERE id = 'b3c29bfe-f393-4e1a-a837-68dd721df420';

-- Delete old seed invoices and re-insert with correct monthly_price (297)
DELETE FROM public.subscription_invoices
WHERE instance_id = 'b3c29bfe-f393-4e1a-a837-68dd721df420';

INSERT INTO public.subscription_invoices (
  instance_id, billing_period_start, billing_period_end,
  amount_net, amount_gross, currency, positions,
  invoice_number, invoice_issue_date, payment_due_date,
  payment_status, pdf_url
) VALUES
(
  'b3c29bfe-f393-4e1a-a837-68dd721df420',
  '2026-01-01', '2026-02-01',
  297, 365.31, 'PLN',
  '[{"name": "Subskrypcja 01.01.2026–01.02.2026", "quantity": 1, "unit_price_net": 297, "vat_rate": 23}]'::jsonb,
  'FV/2026/01/001', '2026-01-01', '2026-01-08',
  'paid', NULL
),
(
  'b3c29bfe-f393-4e1a-a837-68dd721df420',
  '2026-02-01', '2026-03-01',
  297, 365.31, 'PLN',
  '[{"name": "Subskrypcja 01.02.2026–01.03.2026", "quantity": 1, "unit_price_net": 297, "vat_rate": 23}]'::jsonb,
  'FV/2026/02/001', '2026-02-01', '2026-02-08',
  'paid', NULL
),
(
  'b3c29bfe-f393-4e1a-a837-68dd721df420',
  '2026-03-01', '2026-04-01',
  327.24, 402.51, 'PLN',
  '[{"name": "Subskrypcja 01.03.2026–01.04.2026", "quantity": 1, "unit_price_net": 297, "vat_rate": 23}, {"name": "Nadwyżka SMS za poprzedni okres", "quantity": 252, "unit_price_net": 0.12, "vat_rate": 23}]'::jsonb,
  'FV/2026/03/001', '2026-03-01', '2026-03-08',
  'paid', NULL
),
(
  'b3c29bfe-f393-4e1a-a837-68dd721df420',
  '2026-04-01', '2026-05-01',
  297, 365.31, 'PLN',
  '[{"name": "Subskrypcja 01.04.2026–01.05.2026", "quantity": 1, "unit_price_net": 297, "vat_rate": 23}]'::jsonb,
  'FV/2026/04/001', '2026-04-01', '2026-04-08',
  'pending', NULL
);
