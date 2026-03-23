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
  trimmed := btrim(query_text);

  -- Only allow SELECT statements
  IF upper(left(trimmed, 6)) != 'SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Reject if contains semicolons (prevent multi-statement injection)
  IF position(';' in trimmed) > 0 THEN
    RAISE EXCEPTION 'Multi-statement queries are not allowed';
  END IF;

  -- Set session variable for potential RLS use
  IF target_instance_id IS NOT NULL THEN
    PERFORM set_config('app.current_instance_id', target_instance_id::text, true);
  END IF;

  -- Execute and return as JSON array
  EXECUTE format(
    'SELECT coalesce(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    trimmed
  ) INTO result;

  RETURN result;
END;
$$;
