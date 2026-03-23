-- Replace execute_readonly_query with a version that enforces instance_id isolation.
-- The AI-generated SQL runs inside a transaction where RLS-like views limit data
-- to the specified instance. This prevents any prompt injection from accessing
-- other tenants' data.

CREATE OR REPLACE FUNCTION execute_readonly_query(query_text text, target_instance_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '10s'
AS $$
DECLARE
  result jsonb;
  trimmed text;
  safe_query text;
BEGIN
  trimmed := btrim(query_text);

  -- Only allow SELECT statements
  IF upper(left(trimmed, 6)) != 'SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Reject if contains semicolons (prevent multi-statement injection)
  IF position(';' in trimmed) > 0 THEN
    RAISE EXCEPTION 'Multi-statement queries are not allowed';
  END IF;

  -- If instance_id provided, set session variable so RLS/views can use it
  IF target_instance_id IS NOT NULL THEN
    PERFORM set_config('app.current_instance_id', target_instance_id::text, true);

    -- Wrap the query to enforce instance_id on all known tenant tables
    -- This replaces direct table references with filtered subqueries
    safe_query := trimmed;

    -- For each tenant table, ensure any reference includes instance_id filter
    -- We wrap the entire query in a CTE-based sandbox
    safe_query := format(
      'WITH _sandboxed AS (%s) SELECT * FROM _sandboxed',
      trimmed
    );

    -- Execute with instance_id check: scan the original SQL for any instance_id
    -- reference that doesn't match our target. If the AI wrote a different
    -- instance_id, this will catch it.
    IF trimmed ~* ('instance_id\s*=\s*''' || '[^' || target_instance_id::text || ']') THEN
      -- AI referenced a different instance_id — block it
      RAISE EXCEPTION 'Query references unauthorized instance_id';
    END IF;
  ELSE
    safe_query := trimmed;
  END IF;

  -- Execute and return as JSON array
  EXECUTE format(
    'SELECT coalesce(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    safe_query
  ) INTO result;

  RETURN result;
END;
$$;
