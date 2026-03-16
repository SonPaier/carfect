-- Allow employees to insert calendar_items (create new orders)
CREATE POLICY "Employee can insert calendar_items"
ON public.calendar_items FOR INSERT TO authenticated
WITH CHECK (has_instance_role(auth.uid(), 'employee'::app_role, instance_id));

-- Allow employees to insert customer_sms_notifications (when creating orders with SMS)
CREATE POLICY "Employee can insert customer_sms_notifications"
ON public.customer_sms_notifications FOR INSERT TO authenticated
WITH CHECK (has_instance_role(auth.uid(), 'employee'::app_role, instance_id));
