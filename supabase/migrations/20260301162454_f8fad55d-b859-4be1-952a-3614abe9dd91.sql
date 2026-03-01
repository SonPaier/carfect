
-- Table to track login attempts for account lockout
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  instance_id UUID REFERENCES public.instances(id) ON DELETE CASCADE NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_hint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX idx_login_attempts_profile_created ON public.login_attempts (profile_id, created_at DESC);
CREATE INDEX idx_login_attempts_instance ON public.login_attempts (instance_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins of the instance can view login attempts (for audit)
CREATE POLICY "Admins can view login attempts for their instance"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (public.can_access_instance(instance_id));

-- No direct insert/update/delete from client — only via edge function with service role
-- (no insert/update/delete policies needed)

-- Auto-cleanup: delete attempts older than 30 days (via a function that can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE created_at < now() - interval '30 days';
END;
$$;
