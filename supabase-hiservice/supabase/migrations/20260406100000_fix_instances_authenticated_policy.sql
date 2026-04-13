-- ============================================================================
-- FIX: Restore instances SELECT for authenticated users
-- The 20260404100000 security fix dropped "Instances are publicly readable"
-- but only created a replacement policy for anon. Authenticated employees
-- lost SELECT access → 406 on any .single() query.
-- ============================================================================

CREATE POLICY "Authenticated can view their instance"
ON public.instances
FOR SELECT
TO authenticated
USING (
  id IN (SELECT instance_id FROM public.user_roles WHERE user_id = auth.uid())
);
