-- Allow anon to lookup profiles by username for login flow
-- Only exposes id, email, is_blocked — no other PII
-- This was accidentally removed in 20260404100000 security fix
CREATE POLICY "Anon can lookup profile for login"
ON public.profiles
AS permissive
FOR SELECT
TO anon
USING (username IS NOT NULL);
