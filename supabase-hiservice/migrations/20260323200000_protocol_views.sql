-- Add viewed_at to protocols
ALTER TABLE public.protocols
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- Create protocol_views table
CREATE TABLE public.protocol_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_protocol_views_protocol_id ON public.protocol_views(protocol_id);

-- RLS for protocol_views
ALTER TABLE public.protocol_views ENABLE ROW LEVEL SECURITY;

-- Anon can insert only when protocol_id belongs to the supplied instance_id
-- (prevents inserting tracking rows for arbitrary instances)
CREATE POLICY "anon_insert_protocol_views" ON public.protocol_views
  FOR INSERT TO anon WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.protocols
      WHERE id = protocol_id
        AND instance_id = protocol_views.instance_id
    )
  );

-- Anon UPDATE is not granted via policy.
-- Duration updates are performed via the update_protocol_view_duration() RPC (SECURITY DEFINER).

-- Authenticated can read views only for their own instance
CREATE POLICY "authenticated_select_protocol_views" ON public.protocol_views
  FOR SELECT TO authenticated
  USING (
    has_instance_role(auth.uid(), 'admin'::app_role, instance_id)
    OR has_instance_role(auth.uid(), 'employee'::app_role, instance_id)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- RPC: mark protocol as viewed (only if status = 'sent')
CREATE OR REPLACE FUNCTION public.mark_protocol_viewed(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE protocols
  SET status = 'viewed', viewed_at = now()
  WHERE public_token = p_token
    AND status = 'sent';
END;
$$;

-- Grant execute on the RPC to anon and authenticated
GRANT EXECUTE ON FUNCTION public.mark_protocol_viewed(text) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_protocol_viewed(text) TO authenticated;

-- RPC: update duration for a specific view row (SECURITY DEFINER — bypasses UPDATE policy gap for anon)
-- Only updates duration_seconds; cannot change protocol_id or instance_id.
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
