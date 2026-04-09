-- Clear all rolls from bling instance (will be re-added manually)
DO $$
DECLARE
  v_bling uuid := '29f15eeb-5ada-446c-9351-0194dbc886fd';
  v_count int;
BEGIN
  -- Remove roll usages first (FK)
  DELETE FROM sales_roll_usages WHERE roll_id IN (SELECT id FROM sales_rolls WHERE instance_id = v_bling);

  -- Delete rolls
  DELETE FROM sales_rolls WHERE instance_id = v_bling;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RAISE NOTICE 'Deleted % rolls from bling', v_count;
END $$;
