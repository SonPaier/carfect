-- Clean Bling instance: remove test orders, old products, then seed fresh from scanned rolls
DO $$
DECLARE
  v_instance_id uuid := '29f15eeb-5ada-446c-9351-0194dbc886fd';
  v_product_id uuid;
BEGIN
  -- 1. Delete test order items and orders
  DELETE FROM sales_order_items WHERE order_id IN (
    SELECT id FROM sales_orders WHERE instance_id = v_instance_id
  );
  DELETE FROM sales_orders WHERE instance_id = v_instance_id;

  -- 2. Delete old product variants and products
  DELETE FROM sales_product_variants WHERE product_id IN (
    SELECT id FROM sales_products WHERE instance_id = v_instance_id
  );
  DELETE FROM sales_products WHERE instance_id = v_instance_id;

  -- 3. Seed products from scanned Ultrafit rolls

  -- XP Crystal (3 size variants)
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Crystal', 'XP Crystal', true, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 15m', 0, 1),
    (v_product_id, '1220mm x 30m', 0, 2),
    (v_product_id, '610mm x 30m', 0, 3);

  -- XP Retro Matte
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Retro Matte', 'XP Retro Matte', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 15m', 0, 1);

  -- XP Black
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Black', 'XP Black', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 15m', 0, 1);

  -- XP Black Carbon
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Black Carbon', 'XP Black Carbon', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 6m', 0, 1);

  -- XP Black Matte
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Black Matte', 'XP Black Matte', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 15m', 0, 1);

  -- XP Black Forged
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Black Forged', 'XP Black Forged', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 6m', 0, 1);

  -- XP Gold Black
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Gold Black', 'XP Gold Black', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '762mm x 15m', 0, 1);

  -- XP Graphite
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Graphite', 'XP Graphite', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '762mm x 15m', 0, 1);

  -- XP Deep Chroma Blue
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Deep Chroma Blue', 'XP Deep Chroma Blue', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 18m', 0, 1);

  -- XP Phoenix Red
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Phoenix Red', 'XP Phoenix Red', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 18m', 0, 1);

  -- XP Aurora Aqua
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Aurora Aqua', 'XP Aurora Aqua', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 18m', 0, 1);

  -- XP Aurora Forest
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Aurora Forest', 'XP Aurora Forest', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 18m', 0, 1);

  -- XP Retro Metalic Silver
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Retro Metalic Silver', 'XP Retro Metalic Silver', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 18m', 0, 1);

  -- XP Pearl White
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit XP Pearl White', 'XP Pearl White', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1524mm x 18m', 0, 1);

  -- WinCrest EVO (Windshield Protection Film)
  INSERT INTO sales_products (instance_id, full_name, short_name, has_variants, price_net, price_unit)
  VALUES (v_instance_id, 'Ultrafit WinCrest EVO', 'WinCrest EVO', false, 0, 'mb')
  RETURNING id INTO v_product_id;
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order) VALUES
    (v_product_id, '1220mm x 2m', 0, 1);

END $$;
