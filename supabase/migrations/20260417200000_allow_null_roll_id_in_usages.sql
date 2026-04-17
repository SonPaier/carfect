-- Allow roll_id to be NULL for scrap/offcut usages (source='worker' without a specific roll)
ALTER TABLE sales_roll_usages ALTER COLUMN roll_id DROP NOT NULL;
