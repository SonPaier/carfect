-- Create demo instance with all features enabled
INSERT INTO public.instances (id, name, slug, phone, email, address, website, contact_person, short_name, protocol_email_template)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Demo Serwis',
  'demo',
  '+48 123 456 789',
  'kontakt@demo-serwis.pl',
  'ul. Testowa 1, 00-001 Warszawa',
  'https://demo-serwis.pl',
  'Jan Kowalski',
  'Demo',
  'Dzień dobry {imie_klienta},

W załączeniu przesyłamy link do protokołu zakończenia prac z dnia {data_protokolu}.

{link_protokolu}

Z poważaniem,
{nazwa_firmy}'
)
ON CONFLICT (slug) DO NOTHING;

-- Enable all features
INSERT INTO public.instance_features (instance_id, feature_key, enabled) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'activities', true),
  ('a0000000-0000-0000-0000-000000000001', 'employees', true),
  ('a0000000-0000-0000-0000-000000000001', 'protocols', true),
  ('a0000000-0000-0000-0000-000000000001', 'reminders', true),
  ('a0000000-0000-0000-0000-000000000001', 'priorities', true),
  ('a0000000-0000-0000-0000-000000000001', 'employee_calendar_view', true),
  ('a0000000-0000-0000-0000-000000000001', 'projects', true),
  ('a0000000-0000-0000-0000-000000000001', 'invoicing', true),
  ('a0000000-0000-0000-0000-000000000001', 'sms_notifications', true),
  ('a0000000-0000-0000-0000-000000000001', 'sms_payments', true),
  ('a0000000-0000-0000-0000-000000000001', 'push_notifications', true),
  ('a0000000-0000-0000-0000-000000000001', 'customer_categories', true)
ON CONFLICT (instance_id, feature_key) DO NOTHING;

-- Create default calendar columns
INSERT INTO public.calendar_columns (instance_id, name, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Ekipa 1', 0),
  ('a0000000-0000-0000-0000-000000000001', 'Ekipa 2', 1)
ON CONFLICT DO NOTHING;
