DO $$
DECLARE
  v_instance_id uuid := '29f15eeb-5ada-446c-9351-0194dbc886fd';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM instances WHERE id = v_instance_id) THEN RETURN; END IF;

  INSERT INTO instance_features (instance_id, feature_key, enabled)
  VALUES (v_instance_id, 'sales_crm', true)
  ON CONFLICT DO NOTHING;
END $$;
