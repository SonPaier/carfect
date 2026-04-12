-- Seed subscription plans for HiService
INSERT INTO public.subscription_plans (id, name, slug, base_price, price_per_station, sms_limit, included_features, sort_order, active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Standard', 'standard', 200, 49, 100, '[]'::jsonb, 1, true)
ON CONFLICT (id) DO NOTHING;

-- Pool Prestige subscription: 250 zł/mies, billing_day=10
INSERT INTO public.instance_subscriptions (
  id, instance_id, plan_id, station_limit, monthly_price, starts_at, status,
  is_trial, trial_expires_at, next_billing_date, billing_day
) VALUES (
  'b0000000-0000-0000-0000-000000000010',
  'c32aa6e2-d63b-4707-a483-18cf36bec8ce',
  'a0000000-0000-0000-0000-000000000001',
  3, 250, '2026-03-10', 'active',
  false, NULL, '2026-05-10', 10
) ON CONFLICT (id) DO UPDATE SET
  monthly_price = 250,
  next_billing_date = '2026-05-10',
  billing_day = 10;

-- WaterGrass subscription: 260 zł/mies, billing_day=10
INSERT INTO public.instance_subscriptions (
  id, instance_id, plan_id, station_limit, monthly_price, starts_at, status,
  is_trial, trial_expires_at, next_billing_date, billing_day
) VALUES (
  'b0000000-0000-0000-0000-000000000020',
  'c6300bdc-5070-4599-8143-06926578a424',
  'a0000000-0000-0000-0000-000000000001',
  3, 260, '2026-03-10', 'active',
  false, NULL, '2026-05-10', 10
) ON CONFLICT (id) DO UPDATE SET
  monthly_price = 260,
  next_billing_date = '2026-05-10',
  billing_day = 10;

-- Pool Prestige: 1 invoice (April — first billing, period 10.04–09.05)
INSERT INTO public.subscription_invoices (
  instance_id, billing_period_start, billing_period_end,
  amount_net, amount_gross, currency, positions,
  invoice_number, invoice_issue_date, payment_due_date,
  payment_status
) VALUES (
  'c32aa6e2-d63b-4707-a483-18cf36bec8ce',
  '2026-04-10', '2026-05-09',
  250, 307.50, 'PLN',
  '[{"name": "Subskrypcja 10.04.2026–09.05.2026", "quantity": 1, "unit_price_net": 250, "vat_rate": 23}]'::jsonb,
  NULL, '2026-04-10', '2026-04-17',
  'pending'
);

-- WaterGrass: 1 invoice (April — first billing, period 10.04–09.05)
INSERT INTO public.subscription_invoices (
  instance_id, billing_period_start, billing_period_end,
  amount_net, amount_gross, currency, positions,
  invoice_number, invoice_issue_date, payment_due_date,
  payment_status
) VALUES (
  'c6300bdc-5070-4599-8143-06926578a424',
  '2026-04-10', '2026-05-09',
  260, 319.80, 'PLN',
  '[{"name": "Subskrypcja 10.04.2026–09.05.2026", "quantity": 1, "unit_price_net": 260, "vat_rate": 23}]'::jsonb,
  NULL, '2026-04-10', '2026-04-17',
  'pending'
);
