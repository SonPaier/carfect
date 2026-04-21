-- Ensure ALL Bling products have price_unit = 'm2'
DO $$
DECLARE
  v_instance_id uuid := '29f15eeb-5ada-446c-9351-0194dbc886fd';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM instances WHERE id = v_instance_id) THEN RETURN; END IF;

  UPDATE sales_products SET price_unit = 'm2'
  WHERE instance_id = v_instance_id;
END $$;
