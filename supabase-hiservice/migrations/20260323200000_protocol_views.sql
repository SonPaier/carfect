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

-- Anon can insert (public protocol page)
CREATE POLICY "anon_insert_protocol_views" ON public.protocol_views
  FOR INSERT TO anon WITH CHECK (true);

-- Anon can update own rows (duration)
CREATE POLICY "anon_update_own_protocol_views" ON public.protocol_views
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Authenticated can read all views for their instance
CREATE POLICY "authenticated_select_protocol_views" ON public.protocol_views
  FOR SELECT TO authenticated USING (true);

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
