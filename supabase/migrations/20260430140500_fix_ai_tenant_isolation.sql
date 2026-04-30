-- CRITICAL TENANT ISOLATION FIX for AI Analyst
--
-- Two compounding bugs caused cross-tenant data leak:
-- 1) execute_readonly_query is SECURITY DEFINER, runs as `postgres` role which has BYPASSRLS.
--    RLS policies were therefore completely ignored for queries the agent issued.
-- 2) The previously added ai_analyst_select_<table> policies are PERMISSIVE (OR with the
--    existing user_roles policy). For super admins or users with roles in multiple instances,
--    the user_roles branch let any of their instances' rows through regardless of the GUC.
--
-- Fixes:
-- A) Inside execute_readonly_query do `SET LOCAL ROLE authenticated` before the EXECUTE so
--    BYPASSRLS no longer applies. Auth context (auth.uid(), JWT claims) is preserved across
--    SET LOCAL ROLE because it lives in GUCs already set by PostgREST.
-- B) Drop all ai_analyst_select_<table> permissive policies. Add a single RESTRICTIVE
--    policy per table that requires instance_id to match the GUC when the GUC is set.
--    RESTRICTIVE policies AND with all PERMISSIVE policies — when GUC is null normal
--    traffic is unaffected; when GUC is set queries must match.

-- ============================================================================
-- A) Update execute_readonly_query to demote role before executing user SQL
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_readonly_query(query_text text, target_instance_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '10s'
AS $$
DECLARE
  result jsonb;
  trimmed text;
BEGIN
  -- SECURITY: require authenticated user
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- SECURITY: require explicit instance + caller membership
  IF target_instance_id IS NULL THEN
    RAISE EXCEPTION 'target_instance_id is required';
  END IF;
  IF NOT public.can_access_instance(target_instance_id) THEN
    RAISE EXCEPTION 'Access denied to this instance';
  END IF;

  trimmed := btrim(query_text);

  -- Only SELECTs
  IF upper(left(trimmed, 6)) != 'SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Multi-statement injection guard
  IF position(';' in trimmed) > 0 THEN
    RAISE EXCEPTION 'Multi-statement queries are not allowed';
  END IF;

  -- Publish GUC for RESTRICTIVE policies to read.
  PERFORM set_config('app.current_instance_id', target_instance_id::text, true);

  -- CRITICAL: drop superuser privileges for the duration of this transaction so RLS
  -- actually applies. Without this, SECURITY DEFINER runs the inner query as `postgres`
  -- which has BYPASSRLS. SET LOCAL ROLE is reverted at COMMIT/ROLLBACK so it cannot leak.
  SET LOCAL ROLE authenticated;

  EXECUTE format(
    'SELECT coalesce(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    trimmed
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- B) Drop the old PERMISSIVE ai_analyst_select_* policies
-- ============================================================================

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'reservations','customers','customer_vehicles','stations','employees',
    'unified_services','unified_categories','services','service_categories',
    'offers','offer_scopes','vehicle_protocols',
    'sales_orders','sales_customers','sales_products','sales_rolls',
    'trainings','breaks','closed_days','time_entries','employee_days_off',
    'followup_events','followup_tasks','customer_reminders','notifications',
    'sms_logs','yard_vehicles'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "ai_analyst_select_%I" ON public.%I', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- C) Add a RESTRICTIVE policy per table that pins SELECT to the GUC instance when set
-- ============================================================================
--
-- Semantics: when the GUC is NULL (normal app traffic) the policy passes silently.
-- When the GUC is set (AI analyst path) the policy AND-s with whatever PERMISSIVE
-- policies allowed the row, requiring instance_id to match exactly.

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'reservations','customers','customer_vehicles','stations','employees',
    'unified_services','unified_categories','services','service_categories',
    'offers','offer_scopes','vehicle_protocols',
    'sales_orders','sales_customers','sales_products','sales_rolls',
    'trainings','breaks','closed_days','time_entries','employee_days_off',
    'followup_events','followup_tasks','customer_reminders','notifications',
    'sms_logs','yard_vehicles'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      $f$
        CREATE POLICY %I ON public.%I
          AS RESTRICTIVE FOR SELECT TO authenticated
          USING (
            current_ai_analyst_instance() IS NULL
            OR instance_id = current_ai_analyst_instance()
          )
      $f$,
      'ai_analyst_restrict_' || tbl,
      tbl
    );
  END LOOP;
END $$;
