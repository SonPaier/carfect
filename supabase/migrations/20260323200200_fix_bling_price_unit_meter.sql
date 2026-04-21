-- price_unit must be 'meter' (not 'm2') — frontend checks priceUnit === 'meter' for roll assignment
DO $$
DECLARE
  v_instance_id uuid := '29f15eeb-5ada-446c-9351-0194dbc886fd';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM instances WHERE id = v_instance_id) THEN RETURN; END IF;

  UPDATE sales_products SET price_unit = 'meter'
  WHERE instance_id = v_instance_id;
END $$;
