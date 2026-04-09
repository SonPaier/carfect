-- Clear any remaining roll usages for bling instance
DO $$
DECLARE
  v_bling uuid := '29f15eeb-5ada-446c-9351-0194dbc886fd';
  v_count int;
BEGIN
  DELETE FROM sales_roll_usages WHERE order_id IN (SELECT id FROM sales_orders WHERE instance_id = v_bling);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % roll usages from bling', v_count;
END $$;
