-- Security definer RPC so employees can update calendar_item status
-- even if RLS policies are not correctly applied
CREATE OR REPLACE FUNCTION public.employee_update_calendar_item_status(
  _item_id uuid,
  _new_status text,
  _work_started_at timestamptz DEFAULT NULL,
  _work_ended_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _instance_id uuid;
BEGIN
  -- Get the instance_id from the calendar item
  SELECT instance_id INTO _instance_id
  FROM public.calendar_items
  WHERE id = _item_id;

  IF _instance_id IS NULL THEN
    RAISE EXCEPTION 'Calendar item not found';
  END IF;

  -- Verify caller is employee or admin for this instance
  IF NOT (
    has_instance_role(auth.uid(), 'employee'::app_role, _instance_id)
    OR has_instance_role(auth.uid(), 'admin'::app_role, _instance_id)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Perform the update
  UPDATE public.calendar_items
  SET
    status = _new_status,
    work_started_at = COALESCE(_work_started_at, work_started_at),
    work_ended_at = COALESCE(_work_ended_at, work_ended_at)
  WHERE id = _item_id;
END;
$$;
