-- Allow employees to manage offers (same as admin)
-- offer_options and offer_option_items already allow any instance member
DROP POLICY IF EXISTS "Admins can manage offers" ON "public"."offers";

CREATE POLICY "Instance members can manage offers"
  ON "public"."offers"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
    OR public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id)
  );
