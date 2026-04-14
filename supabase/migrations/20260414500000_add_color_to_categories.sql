-- Add optional color column to unified_categories
ALTER TABLE unified_categories
  ADD COLUMN IF NOT EXISTS color TEXT;
