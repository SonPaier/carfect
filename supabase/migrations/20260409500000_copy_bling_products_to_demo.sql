-- Copy sales_products, sales_product_variants, and sales_rolls from bling to demo
DO $$
DECLARE
  v_bling uuid := '29f15eeb-5ada-446c-9351-0194dbc886fd';
  v_demo uuid := 'b3c29bfe-f393-4e1a-a837-68dd721df420';
  v_old_id uuid;
  v_new_id uuid;
BEGIN
  -- Clean existing demo sales data (cascade through FKs)
  DELETE FROM sales_roll_usages WHERE order_id IN (SELECT id FROM sales_orders WHERE instance_id = v_demo);
  DELETE FROM sales_roll_usages WHERE roll_id IN (SELECT id FROM sales_rolls WHERE instance_id = v_demo);
  DELETE FROM sales_order_items WHERE order_id IN (SELECT id FROM sales_orders WHERE instance_id = v_demo);
  DELETE FROM sales_orders WHERE instance_id = v_demo;
  DELETE FROM sales_product_variants WHERE product_id IN (SELECT id FROM sales_products WHERE instance_id = v_demo);
  DELETE FROM sales_rolls WHERE instance_id = v_demo;
  DELETE FROM sales_products WHERE instance_id = v_demo;

  -- 1. Copy sales_products (with ID mapping)
  CREATE TEMP TABLE product_id_map (old_id uuid, new_id uuid) ON COMMIT DROP;

  FOR v_old_id IN SELECT id FROM sales_products WHERE instance_id = v_bling
  LOOP
    v_new_id := gen_random_uuid();
    INSERT INTO product_id_map VALUES (v_old_id, v_new_id);

    INSERT INTO sales_products (id, instance_id, full_name, short_name, description, price_net, price_unit, product_type, has_variants, exclude_from_discount, created_at)
    SELECT v_new_id, v_demo, full_name, short_name, description, price_net, price_unit, product_type, has_variants, exclude_from_discount, now()
    FROM sales_products WHERE id = v_old_id;
  END LOOP;

  -- 2. Copy sales_product_variants
  INSERT INTO sales_product_variants (product_id, name, price_net, sort_order)
  SELECT m.new_id, v.name, v.price_net, v.sort_order
  FROM sales_product_variants v
  JOIN product_id_map m ON m.old_id = v.product_id;

  -- 3. Copy sales_rolls
  INSERT INTO sales_rolls (instance_id, product_name, product_code, brand, width_mm, length_m, initial_length_m, initial_remaining_mb, status, description, photo_url, barcode, delivery_date, created_at)
  SELECT v_demo, product_name, product_code, brand, width_mm, length_m, initial_length_m, initial_remaining_mb, status, description, photo_url, barcode, delivery_date, now()
  FROM sales_rolls WHERE instance_id = v_bling;

  RAISE NOTICE 'Copied % products and % rolls from bling to demo',
    (SELECT count(*) FROM product_id_map),
    (SELECT count(*) FROM sales_rolls WHERE instance_id = v_demo);
END $$;
