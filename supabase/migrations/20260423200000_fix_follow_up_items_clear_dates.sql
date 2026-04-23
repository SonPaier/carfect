-- Fix follow_up items that still have dates set (should be dateless)
-- Guard: only run if calendar_items table exists (HiService instances)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_items') THEN
    UPDATE calendar_items
    SET item_date = NULL, start_time = NULL, end_time = NULL
    WHERE status = 'follow_up' AND item_date IS NOT NULL;
  END IF;
END $$;
