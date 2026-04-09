ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendar_default_view TEXT DEFAULT 'day';
