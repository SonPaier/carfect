-- Restore roll to 'active' when usages are deleted/reduced and total drops below threshold
CREATE OR REPLACE FUNCTION public.auto_restore_roll_on_usage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_roll_id uuid;
  roll_remaining numeric;
  total_used numeric;
BEGIN
  target_roll_id := COALESCE(OLD.roll_id, NEW.roll_id);

  SELECT initial_remaining_mb INTO roll_remaining
    FROM public.sales_rolls
    WHERE id = target_roll_id;

  SELECT COALESCE(SUM(used_mb), 0) INTO total_used
    FROM public.sales_roll_usages
    WHERE roll_id = target_roll_id;

  IF total_used < roll_remaining THEN
    UPDATE public.sales_rolls
      SET status = 'active', updated_at = now()
      WHERE id = target_roll_id AND status = 'archived';
  ELSIF total_used >= roll_remaining THEN
    UPDATE public.sales_rolls
      SET status = 'archived', updated_at = now()
      WHERE id = target_roll_id AND status = 'active';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_auto_restore_roll_on_delete
  AFTER DELETE ON public.sales_roll_usages
  FOR EACH ROW EXECUTE FUNCTION public.auto_restore_roll_on_usage_change();

CREATE TRIGGER trg_auto_restore_roll_on_update
  AFTER UPDATE ON public.sales_roll_usages
  FOR EACH ROW EXECUTE FUNCTION public.auto_restore_roll_on_usage_change();
