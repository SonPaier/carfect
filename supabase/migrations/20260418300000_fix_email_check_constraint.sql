ALTER TABLE customer_reminders DROP CONSTRAINT customer_reminders_email_required;
ALTER TABLE customer_reminders ADD CONSTRAINT customer_reminders_email_required
  CHECK (channel != 'email' OR (customer_email IS NOT NULL AND customer_email != ''));
