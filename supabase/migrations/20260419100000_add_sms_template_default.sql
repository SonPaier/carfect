-- Set explicit DEFAULT for sms_template so new templates get a usable value
ALTER TABLE reminder_templates
  ALTER COLUMN sms_template
  SET DEFAULT '{short_name}: Zapraszamy na wizytę — pojazd {vehicle_plate}. Kontakt: {reservation_phone}';
