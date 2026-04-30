-- Add ai_analyst_select_<table> SELECT policy on every tenant-scoped table.
-- Branch 1: existing user_roles check (covers normal app traffic).
-- Branch 2: GUC set by execute_readonly_query RPC (covers AI Analyst).
-- The IS NOT NULL guard on the helper ensures branch 2 never fires unless GUC set intentionally.
--
-- Tables WITHOUT instance_id (omitted): offer_option_items, offer_options,
--   sales_order_items, sales_product_variants.
-- These child tables are accessible via JOINs from parent rows already filtered by RLS.

-- Helper: returns the GUC current_instance_id as uuid, or NULL if unset/empty.
CREATE OR REPLACE FUNCTION current_ai_analyst_instance() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_instance_id', true), '')::uuid;
$$;

CREATE POLICY "ai_analyst_select_reservations" ON public.reservations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = reservations.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND reservations.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_customers" ON public.customers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = customers.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND customers.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_customer_vehicles" ON public.customer_vehicles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = customer_vehicles.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND customer_vehicles.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_stations" ON public.stations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = stations.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND stations.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_employees" ON public.employees FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = employees.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND employees.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_unified_services" ON public.unified_services FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = unified_services.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND unified_services.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_unified_categories" ON public.unified_categories FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = unified_categories.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND unified_categories.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_services" ON public.services FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = services.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND services.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_service_categories" ON public.service_categories FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = service_categories.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND service_categories.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_offers" ON public.offers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = offers.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND offers.instance_id = current_ai_analyst_instance())
  );

-- offer_scopes has instance_id nullable; NULL rows are global scopes readable by all authenticated.
CREATE POLICY "ai_analyst_select_offer_scopes" ON public.offer_scopes FOR SELECT TO authenticated
  USING (
    instance_id IS NULL
    OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = offer_scopes.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND offer_scopes.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_vehicle_protocols" ON public.vehicle_protocols FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = vehicle_protocols.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND vehicle_protocols.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_sales_orders" ON public.sales_orders FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = sales_orders.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND sales_orders.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_sales_customers" ON public.sales_customers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = sales_customers.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND sales_customers.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_sales_products" ON public.sales_products FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = sales_products.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND sales_products.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_sales_rolls" ON public.sales_rolls FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = sales_rolls.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND sales_rolls.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_trainings" ON public.trainings FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = trainings.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND trainings.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_breaks" ON public.breaks FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = breaks.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND breaks.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_closed_days" ON public.closed_days FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = closed_days.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND closed_days.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_time_entries" ON public.time_entries FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = time_entries.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND time_entries.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_employee_days_off" ON public.employee_days_off FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = employee_days_off.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND employee_days_off.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_followup_events" ON public.followup_events FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = followup_events.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND followup_events.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_followup_tasks" ON public.followup_tasks FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = followup_tasks.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND followup_tasks.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_customer_reminders" ON public.customer_reminders FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = customer_reminders.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND customer_reminders.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_notifications" ON public.notifications FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = notifications.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND notifications.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_sms_logs" ON public.sms_logs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = sms_logs.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND sms_logs.instance_id = current_ai_analyst_instance())
  );

CREATE POLICY "ai_analyst_select_yard_vehicles" ON public.yard_vehicles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.instance_id = yard_vehicles.instance_id)
    OR (current_ai_analyst_instance() IS NOT NULL AND yard_vehicles.instance_id = current_ai_analyst_instance())
  );
