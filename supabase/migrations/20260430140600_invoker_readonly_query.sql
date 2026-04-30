-- Switch execute_readonly_query to SECURITY INVOKER.
--
-- Background: SECURITY DEFINER ran the function as `postgres` which has BYPASSRLS.
-- That meant RLS policies (including the GUC-based RESTRICTIVE policy added in
-- 20260430140500) were ignored, leaking cross-tenant data.
--
-- Trying to demote with `SET LOCAL ROLE authenticated` inside SECURITY DEFINER is
-- blocked by Postgres (`cannot set parameter "role" within security-definer function`).
--
-- Cleanest fix: SECURITY INVOKER. The function runs as the calling role
-- (`authenticated`), so RLS applies naturally. auth.role() / auth.uid() work the same.
-- statement_timeout still applies via SET clause in proc definition.

CREATE OR REPLACE FUNCTION execute_readonly_query(query_text text, target_instance_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
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

  -- Only SELECT
  IF upper(left(trimmed, 6)) != 'SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Multi-statement injection guard
  IF position(';' in trimmed) > 0 THEN
    RAISE EXCEPTION 'Multi-statement queries are not allowed';
  END IF;

  -- Publish GUC so the RESTRICTIVE per-table policies can read it.
  PERFORM set_config('app.current_instance_id', target_instance_id::text, true);

  EXECUTE format(
    'SELECT coalesce(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    trimmed
  ) INTO result;

  RETURN result;
END;
$$;
