-- Update sms_template default to use Polish placeholder names
ALTER TABLE reminder_templates
  ALTER COLUMN sms_template
  SET DEFAULT 'Zapraszamy na wizytę — pojazd {pojazd}. Kontakt: {telefon_firmy}';
