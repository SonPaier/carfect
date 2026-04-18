-- RPC for login flow: resolve username to email, bypassing RLS
-- Returns email only if user exists and is not blocked
-- For super_admin: works across all instances
CREATE OR REPLACE FUNCTION public.lookup_login_profile(
  _username TEXT,
  _instance_id UUID
)
RETURNS TABLE(id UUID, email TEXT, is_blocked BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Try instance-specific profile first
  RETURN QUERY
    SELECT p.id, p.email, p.is_blocked
    FROM profiles p
    WHERE p.username = _username
      AND p.instance_id = _instance_id
    LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Fallback: check super_admin (profile with instance_id IS NULL)
  RETURN QUERY
    SELECT p.id, p.email, p.is_blocked
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'super_admin'
    WHERE p.username = _username
      AND p.instance_id IS NULL
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_login_profile(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_login_profile(TEXT, UUID) TO authenticated;
