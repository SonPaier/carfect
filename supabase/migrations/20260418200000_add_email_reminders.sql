-- Add email support to reminder templates and customer reminders

-- reminder_templates: email template fields
ALTER TABLE reminder_templates
  ADD COLUMN IF NOT EXISTS email_subject text DEFAULT 'Przypomnienie o wizycie',
  ADD COLUMN IF NOT EXISTS email_body text DEFAULT '{short_name}: Zapraszamy na {service_type} pojazdu {vehicle_plate}. Kontakt: {reservation_phone}';

-- customer_reminders: channel selection + customer email
ALTER TABLE customer_reminders
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'sms',
  ADD COLUMN IF NOT EXISTS customer_email text;

-- Constraint: channel must be sms or email
ALTER TABLE customer_reminders
  ADD CONSTRAINT customer_reminders_channel_check
  CHECK (channel IN ('sms', 'email'));

-- Constraint: email required when channel is email
ALTER TABLE customer_reminders
  ADD CONSTRAINT customer_reminders_email_required
  CHECK (channel != 'email' OR customer_email IS NOT NULL);
