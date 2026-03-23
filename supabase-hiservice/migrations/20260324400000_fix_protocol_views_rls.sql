-- Fix: tighten RLS on protocol_views and add update_protocol_view_duration RPC

-- Drop the overly permissive anon policies
DROP POLICY IF EXISTS "anon_insert_protocol_views" ON public.protocol_views;
DROP POLICY IF EXISTS "anon_update_own_protocol_views" ON public.protocol_views;
DROP POLICY IF EXISTS "authenticated_select_protocol_views" ON public.protocol_views;

-- Anon can insert only when protocol_id belongs to the supplied instance_id
CREATE POLICY "anon_insert_protocol_views" ON public.protocol_views
  FOR INSERT TO anon WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.protocols
      WHERE id = protocol_id
        AND instance_id = protocol_views.instance_id
    )
  );

-- No anon UPDATE policy — duration updates go through RPC

-- Authenticated can read views only for their own instance
CREATE POLICY "authenticated_select_protocol_views" ON public.protocol_views
  FOR SELECT TO authenticated
  USING (
    has_instance_role(auth.uid(), 'admin'::app_role, instance_id)
    OR has_instance_role(auth.uid(), 'employee'::app_role, instance_id)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- RPC: update duration for a specific view row (SECURITY DEFINER — bypasses UPDATE policy gap for anon)
CREATE OR REPLACE FUNCTION public.update_protocol_view_duration(p_view_id uuid, p_duration_seconds integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_duration_seconds < 0 THEN
    RAISE EXCEPTION 'duration_seconds must be non-negative';
  END IF;
  UPDATE protocol_views
  SET duration_seconds = p_duration_seconds
  WHERE id = p_view_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_protocol_view_duration(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.update_protocol_view_duration(uuid, integer) TO authenticated;
