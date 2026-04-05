-- Fix: REVOKE from both anon AND public roles
-- The functions were granted to 'public' role which includes anon
REVOKE EXECUTE ON FUNCTION public.generate_protocol_token() FROM public;
REVOKE EXECUTE ON FUNCTION public.generate_short_token() FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts() FROM public;

-- Re-grant to authenticated only
GRANT EXECUTE ON FUNCTION public.generate_protocol_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_short_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_login_attempts() TO authenticated;
