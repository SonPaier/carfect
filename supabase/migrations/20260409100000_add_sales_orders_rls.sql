-- Add RLS policies for sales_orders and sales_order_items
-- Both tables had RLS enabled but zero policies = default deny for everyone

-- sales_orders: admin, sales, super_admin can manage
CREATE POLICY "Admin/sales can manage sales_orders"
ON public.sales_orders FOR ALL
TO authenticated
USING (
  public.has_instance_role(auth.uid(), 'admin'::app_role, instance_id)
  OR public.has_instance_role(auth.uid(), 'sales'::app_role, instance_id)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  public.has_instance_role(auth.uid(), 'admin'::app_role, instance_id)
  OR public.has_instance_role(auth.uid(), 'sales'::app_role, instance_id)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- sales_order_items: same access as parent table
CREATE POLICY "Admin/sales can manage sales_order_items"
ON public.sales_order_items FOR ALL
TO authenticated
USING (
  order_id IN (
    SELECT id FROM public.sales_orders
    WHERE public.has_instance_role(auth.uid(), 'admin'::app_role, instance_id)
       OR public.has_instance_role(auth.uid(), 'sales'::app_role, instance_id)
       OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
)
WITH CHECK (
  order_id IN (
    SELECT id FROM public.sales_orders
    WHERE public.has_instance_role(auth.uid(), 'admin'::app_role, instance_id)
       OR public.has_instance_role(auth.uid(), 'sales'::app_role, instance_id)
       OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);
