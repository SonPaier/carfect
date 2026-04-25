-- Enforce the follow_up date invariant at the DB level so bad data
-- (a non-follow_up row with null times, or a follow_up row with times)
-- can never reach the calendar renderer and crash it.
--
-- Existing rows were already cleaned up in 20260423200000.
-- This adds a CHECK constraint to prevent future drift.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_items') THEN
    -- Repair any drift before adding the constraint, otherwise ALTER TABLE fails.
    UPDATE calendar_items
    SET item_date = NULL, start_time = NULL, end_time = NULL
    WHERE status = 'follow_up'
      AND (item_date IS NOT NULL OR start_time IS NOT NULL OR end_time IS NOT NULL);

    -- Drop the constraint if we are re-running this migration after an edit.
    ALTER TABLE calendar_items
      DROP CONSTRAINT IF EXISTS calendar_items_follow_up_dates_invariant;

    ALTER TABLE calendar_items
      ADD CONSTRAINT calendar_items_follow_up_dates_invariant CHECK (
        (status = 'follow_up'
         AND item_date IS NULL
         AND start_time IS NULL
         AND end_time IS NULL)
        OR
        (status <> 'follow_up'
         AND item_date IS NOT NULL
         AND start_time IS NOT NULL
         AND end_time IS NOT NULL)
      );
  END IF;
END $$;
