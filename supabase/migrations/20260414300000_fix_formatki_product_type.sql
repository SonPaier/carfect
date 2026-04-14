-- Fix product_type for "Wycinanie formatek" products and historical order items.
-- These should be 'other' (generic product, no vehicle/roll fields), not 'roll'.
DO $$ BEGIN
  -- Fix product definitions
  UPDATE sales_products
  SET product_type = 'other'
  WHERE lower(full_name) LIKE '%wycinanie formatek%'
    AND product_type = 'roll';

  -- Fix historical order items
  UPDATE sales_order_items
  SET product_type = 'other'
  WHERE lower(name) LIKE '%wycinanie formatek%'
    AND product_type = 'roll';
EXCEPTION WHEN undefined_table THEN
  NULL; -- Tables may not exist on all environments
END $$;
