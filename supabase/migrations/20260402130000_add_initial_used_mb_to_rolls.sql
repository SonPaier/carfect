-- Add initial_remaining_mb: measured remaining length when entering roll into system.
-- Defaults to length_m (full roll). For partially used rolls, set to actual measured remaining.
-- Remaining = initial_remaining_mb - SUM(usages.used_mb)
ALTER TABLE "public"."sales_rolls"
  ADD COLUMN "initial_remaining_mb" numeric;

-- Backfill existing rolls: assume they were entered as full rolls
UPDATE "public"."sales_rolls"
  SET "initial_remaining_mb" = "length_m"
  WHERE "initial_remaining_mb" IS NULL;

ALTER TABLE "public"."sales_rolls"
  ALTER COLUMN "initial_remaining_mb" SET NOT NULL,
  ALTER COLUMN "initial_remaining_mb" SET DEFAULT 0;

-- Update auto-archive trigger to use initial_remaining_mb
CREATE OR REPLACE FUNCTION public.auto_archive_depleted_roll()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  roll_remaining numeric;
  total_used numeric;
BEGIN
  SELECT initial_remaining_mb INTO roll_remaining
    FROM public.sales_rolls
    WHERE id = NEW.roll_id;

  SELECT COALESCE(SUM(used_mb), 0) INTO total_used
    FROM public.sales_roll_usages
    WHERE roll_id = NEW.roll_id;

  IF total_used >= roll_remaining THEN
    UPDATE public.sales_rolls
      SET status = 'archived', updated_at = now()
      WHERE id = NEW.roll_id;
  END IF;

  RETURN NEW;
END;
$$;
