-- Add unique constraint on (instance_id, message_type) for sms_message_settings
-- Required for upsert with onConflict to work
CREATE UNIQUE INDEX IF NOT EXISTS sms_message_settings_instance_type_unique
  ON public.sms_message_settings (instance_id, message_type);
