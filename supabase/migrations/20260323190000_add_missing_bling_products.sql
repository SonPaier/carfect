DO $$
DECLARE
  v_instance_id uuid := '29f15eeb-5ada-446c-9351-0194dbc886fd';
  v_product_id uuid;
BEGIN
  -- XP Moonlight (VLT 42%)
  IF NOT EXISTS (SELECT 1 FROM sales_products WHERE instance_id = v_instance_id AND short_name = 'XP Moonlight') THEN
    INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
    VALUES (v_instance_id, 'Ultrafit XP Moonlight', 'XP Moonlight', false, 309, 'm2')
    RETURNING id INTO v_product_id;
    INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
      (v_product_id, '762mm x 15m', 0, 1);
  END IF;

  -- XP Color
  IF NOT EXISTS (SELECT 1 FROM sales_products WHERE instance_id = v_instance_id AND short_name = 'XP Color') THEN
    INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
    VALUES (v_instance_id, 'Ultrafit XP Color', 'XP Color', false, 0, 'm2')
    RETURNING id INTO v_product_id;
    INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
      (v_product_id, '1524mm x 18m', 0, 1);
  END IF;

  -- XP Color Shift
  IF NOT EXISTS (SELECT 1 FROM sales_products WHERE instance_id = v_instance_id AND short_name = 'XP Color Shift') THEN
    INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
    VALUES (v_instance_id, 'Ultrafit XP Color Shift', 'XP Color Shift', false, 0, 'm2')
    RETURNING id INTO v_product_id;
    INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
      (v_product_id, '1524mm x 18m', 0, 1);
  END IF;
END $$;
