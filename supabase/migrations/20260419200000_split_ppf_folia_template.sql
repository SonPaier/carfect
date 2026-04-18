-- Split "PPF Folia" template (armcar) into two separate templates:
-- 1. "PPF Folia — kontrola" (1× co 1 mies.)
-- 2. "PPF Folia — serwis" (1× co 12 mies.)
-- Old template had mixed items: [{months:1, service_type:'kontrola'}, {months:12, service_type:'serwis'}]

DO $$
DECLARE
  v_instance_id uuid;
  v_old_template_id uuid;
  v_old_sms_template text;
  v_old_email_subject text;
  v_old_email_body text;
  v_kontrola_id uuid;
  v_serwis_id uuid;
BEGIN
  -- Find armcar instance
  SELECT id INTO v_instance_id FROM instances WHERE slug = 'armcar';
  IF v_instance_id IS NULL THEN
    RAISE NOTICE 'armcar instance not found, skipping';
    RETURN;
  END IF;

  -- Find the old template
  SELECT id, sms_template, email_subject, email_body
  INTO v_old_template_id, v_old_sms_template, v_old_email_subject, v_old_email_body
  FROM reminder_templates
  WHERE instance_id = v_instance_id AND name = 'PPF Folia';

  IF v_old_template_id IS NULL THEN
    RAISE NOTICE 'PPF Folia template not found, skipping';
    RETURN;
  END IF;

  -- Create "PPF Folia — kontrola" (1× co 1 mies.)
  INSERT INTO reminder_templates (instance_id, name, items, sms_template, email_subject, email_body)
  VALUES (
    v_instance_id,
    'PPF Folia — kontrola',
    '[{"months": 1, "service_type": "serwis"}]'::jsonb,
    COALESCE(v_old_sms_template, '{short_name}: Zapraszamy na kontrolę folii PPF pojazdu {vehicle_plate}. Kontakt: {reservation_phone}'),
    COALESCE(v_old_email_subject, 'Przypomnienie o kontroli folii PPF'),
    COALESCE(v_old_email_body, 'Szanowny Kliencie, przypominamy o bezpłatnej kontroli folii PPF pojazdu {vehicle_plate}. Zapraszamy do kontaktu: {reservation_phone}. Pozdrawiamy, {short_name}')
  )
  RETURNING id INTO v_kontrola_id;

  -- Create "PPF Folia — serwis" (1× co 12 mies.)
  INSERT INTO reminder_templates (instance_id, name, items, sms_template, email_subject, email_body)
  VALUES (
    v_instance_id,
    'PPF Folia — serwis',
    '[{"months": 12, "service_type": "serwis"}]'::jsonb,
    COALESCE(v_old_sms_template, '{short_name}: Zapraszamy na serwis folii PPF pojazdu {vehicle_plate}. Kontakt: {reservation_phone}'),
    COALESCE(v_old_email_subject, 'Przypomnienie o serwisie folii PPF'),
    COALESCE(v_old_email_body, 'Szanowny Kliencie, przypominamy o zbliżającym się serwisie folii PPF pojazdu {vehicle_plate}. Zapraszamy do kontaktu: {reservation_phone}. Pozdrawiamy, {short_name}')
  )
  RETURNING id INTO v_serwis_id;

  -- Reassign customer_reminders from old template:
  -- months_after=1 → kontrola template
  -- months_after=12 → serwis template
  UPDATE customer_reminders
  SET reminder_template_id = v_kontrola_id
  WHERE reminder_template_id = v_old_template_id
    AND months_after = 1;

  UPDATE customer_reminders
  SET reminder_template_id = v_serwis_id
  WHERE reminder_template_id = v_old_template_id
    AND months_after = 12;

  -- Reassign any remaining reminders (other months_after values) to serwis
  UPDATE customer_reminders
  SET reminder_template_id = v_serwis_id
  WHERE reminder_template_id = v_old_template_id;

  -- Reassign services that pointed to old template
  UPDATE unified_services
  SET reminder_template_id = v_serwis_id
  WHERE reminder_template_id = v_old_template_id;

  -- Reassign products_library that pointed to old template
  UPDATE products_library
  SET reminder_template_id = v_serwis_id
  WHERE reminder_template_id = v_old_template_id;

  -- Delete old template
  DELETE FROM reminder_templates WHERE id = v_old_template_id;

  RAISE NOTICE 'Split PPF Folia: kontrola=%, serwis=%, old=% deleted', v_kontrola_id, v_serwis_id, v_old_template_id;
END $$;
