-- Seed real subscription for Armcar instance
-- Armcar: 286 zł/mies, billing_day=10, paid 10.02, 10.03, 10.04

-- Create plan if not exists
INSERT INTO public.subscription_plans (id, name, slug, base_price, price_per_station, sms_limit, included_features, sort_order, active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Standard', 'standard', 200, 49, 100, '[]'::jsonb, 1, true)
ON CONFLICT (id) DO NOTHING;

-- Armcar already has a subscription row — update it
UPDATE public.instance_subscriptions SET
  monthly_price = 286,
  next_billing_date = '2026-05-10',
  billing_day = 10
WHERE instance_id = '4ce15650-76c7-47e7-b5c8-32b9a2d1c321';

-- Armcar billing data
UPDATE public.instances SET
  billing_name = 'ARM INVEST Armen Avagyan',
  billing_nip = '5833456789',
  billing_street = 'Aleja Grunwaldzka 229',
  billing_postal_code = '80-266',
  billing_city = 'Gdańsk'
WHERE id = '4ce15650-76c7-47e7-b5c8-32b9a2d1c321';

-- Armcar invoices: Feb, Mar, Apr (Apr has extra SMS package)
INSERT INTO public.subscription_invoices (
  instance_id, billing_period_start, billing_period_end,
  amount_net, amount_gross, currency, positions,
  invoice_number, invoice_issue_date, payment_due_date,
  payment_status
) VALUES
(
  '4ce15650-76c7-47e7-b5c8-32b9a2d1c321',
  '2026-02-10', '2026-03-10',
  286, 351.78, 'PLN',
  '[{"name": "Subskrypcja 10.02.2026–10.03.2026", "quantity": 1, "unit_price_net": 286, "vat_rate": 23}]'::jsonb,
  NULL, '2026-02-10', '2026-02-17',
  'paid'
),
(
  '4ce15650-76c7-47e7-b5c8-32b9a2d1c321',
  '2026-03-10', '2026-04-10',
  286, 351.78, 'PLN',
  '[{"name": "Subskrypcja 10.03.2026–10.04.2026", "quantity": 1, "unit_price_net": 286, "vat_rate": 23}]'::jsonb,
  NULL, '2026-03-10', '2026-03-17',
  'paid'
),
(
  '4ce15650-76c7-47e7-b5c8-32b9a2d1c321',
  '2026-04-10', '2026-05-10',
  321, 394.83, 'PLN',
  '[{"name": "Subskrypcja 10.04.2026–10.05.2026", "quantity": 1, "unit_price_net": 286, "vat_rate": 23}, {"name": "Dodatkowy pakiet SMS", "quantity": 1, "unit_price_net": 35, "vat_rate": 23}]'::jsonb,
  NULL, '2026-04-10', '2026-04-17',
  'pending'
);
