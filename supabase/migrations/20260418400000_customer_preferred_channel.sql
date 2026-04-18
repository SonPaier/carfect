-- Customer-level default channel for reminders
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS preferred_reminder_channel text NOT NULL DEFAULT 'sms'
  CHECK (preferred_reminder_channel IN ('sms', 'email'));
