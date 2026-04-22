-- Add attachments JSONB column to sales_roll_usages (same pattern as sales_orders.attachments)
ALTER TABLE sales_roll_usages
  ADD COLUMN attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
