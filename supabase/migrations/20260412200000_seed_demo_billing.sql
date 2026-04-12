-- Seed billing data for demo instance
UPDATE public.instances SET
  billing_name = 'N2Wash Sp. z o.o.',
  billing_nip = '5213456789',
  billing_street = 'ul. Testowa 1',
  billing_postal_code = '00-001',
  billing_city = 'Warszawa'
WHERE id = 'b3c29bfe-f393-4e1a-a837-68dd721df420';

-- Set next_billing_date on demo subscription
UPDATE public.instance_subscriptions SET
  next_billing_date = '2026-05-01'
WHERE instance_id = 'b3c29bfe-f393-4e1a-a837-68dd721df420';

-- Seed demo invoices
INSERT INTO public.subscription_invoices (
  instance_id, billing_period_start, billing_period_end,
  amount_net, amount_gross, currency, positions,
  invoice_number, invoice_issue_date, payment_due_date,
  payment_status, pdf_url
) VALUES
(
  'b3c29bfe-f393-4e1a-a837-68dd721df420',
  '2026-01-01', '2026-02-01',
  299, 367.77, 'PLN',
  '[{"name": "Subskrypcja 01.01.2026–01.02.2026", "quantity": 1, "unit_price_net": 299, "vat_rate": 23}]'::jsonb,
  'FV/2026/01/001', '2026-01-01', '2026-01-08',
  'paid', NULL
),
(
  'b3c29bfe-f393-4e1a-a837-68dd721df420',
  '2026-02-01', '2026-03-01',
  305, 375.15, 'PLN',
  '[{"name": "Subskrypcja 01.02.2026–01.03.2026", "quantity": 1, "unit_price_net": 299, "vat_rate": 23}, {"name": "Nadwyżka SMS za poprzedni okres", "quantity": 50, "unit_price_net": 0.12, "vat_rate": 23}]'::jsonb,
  'FV/2026/02/001', '2026-02-01', '2026-02-08',
  'paid', NULL
),
(
  'b3c29bfe-f393-4e1a-a837-68dd721df420',
  '2026-03-01', '2026-04-01',
  299, 367.77, 'PLN',
  '[{"name": "Subskrypcja 01.03.2026–01.04.2026", "quantity": 1, "unit_price_net": 299, "vat_rate": 23}]'::jsonb,
  'FV/2026/03/001', '2026-03-01', '2026-03-08',
  'paid', NULL
),
(
  'b3c29bfe-f393-4e1a-a837-68dd721df420',
  '2026-04-01', '2026-05-01',
  299, 367.77, 'PLN',
  '[{"name": "Subskrypcja 01.04.2026–01.05.2026", "quantity": 1, "unit_price_net": 299, "vat_rate": 23}]'::jsonb,
  'FV/2026/04/001', '2026-04-01', '2026-04-08',
  'pending', NULL
)
;
