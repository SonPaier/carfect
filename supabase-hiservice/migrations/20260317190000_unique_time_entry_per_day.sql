-- Prevent duplicate time entries for the same employee on the same day with same entry_number.
-- When start_stop is disabled, there should always be exactly 1 entry (entry_number=1) per day.

-- First, clean up any existing duplicates by keeping only the latest one per (employee_id, entry_date, entry_number)
DELETE FROM public.time_entries
WHERE id NOT IN (
  SELECT DISTINCT ON (employee_id, entry_date, entry_number) id
  FROM public.time_entries
  ORDER BY employee_id, entry_date, entry_number, updated_at DESC
);

-- Add unique constraint
ALTER TABLE public.time_entries
  ADD CONSTRAINT uq_time_entry_employee_date_number
  UNIQUE (employee_id, entry_date, entry_number);
