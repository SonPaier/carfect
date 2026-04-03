-- Allow manual roll usage entries (without order)
-- Add source, worker_name, note columns

-- 1. Make order_id and order_item_id nullable
ALTER TABLE "public"."sales_roll_usages"
  ALTER COLUMN "order_id" DROP NOT NULL,
  ALTER COLUMN "order_item_id" DROP NOT NULL;

-- 2. Add new columns
ALTER TABLE "public"."sales_roll_usages"
  ADD COLUMN "source" text NOT NULL DEFAULT 'order',
  ADD COLUMN "worker_name" text,
  ADD COLUMN "note" text;

-- 3. Constraint: order usages must have order_id and order_item_id
ALTER TABLE "public"."sales_roll_usages"
  ADD CONSTRAINT roll_usage_order_fields_check
  CHECK (
    (source = 'order' AND order_id IS NOT NULL AND order_item_id IS NOT NULL)
    OR (source IN ('manual', 'worker'))
  );
