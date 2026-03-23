CREATE OR REPLACE FUNCTION execute_readonly_query(query_text text)
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

  -- Execute and return as JSON array
  EXECUTE 'SELECT coalesce(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || trimmed || ') t'
  INTO result;

  RETURN result;
END;
$$;
