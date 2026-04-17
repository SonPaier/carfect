-- Allow any instance member (including sales-crm role) to read employees
-- Needed for worker dropdown in roll usage and employee rolls report
CREATE POLICY "employees_read_instance_member" ON employees
  FOR SELECT USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
    OR public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id)
    OR public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id)
  );
