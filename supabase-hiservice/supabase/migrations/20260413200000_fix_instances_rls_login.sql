-- Allow authenticated users to see basic instance info for login page
-- (without this, a user logged into instance A cannot see instance B's login page)
CREATE POLICY "Authenticated can view active instances for login"
ON public.instances FOR SELECT TO authenticated
USING (active = true);
