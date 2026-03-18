-- Ensure end_date is not before item_date
ALTER TABLE calendar_items
  ADD CONSTRAINT check_end_date_not_before_start
  CHECK (end_date IS NULL OR end_date >= item_date);
