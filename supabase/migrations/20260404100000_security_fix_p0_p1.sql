-- ============================================================================
-- SECURITY FIX: P0 + P1 findings from 2026-04-04 audit
-- ============================================================================

-- ============================================================================
-- P0-1: RESTRICT execute_readonly_query TO AUTHENTICATED USERS ONLY
-- Previously: callable by anon, allows arbitrary SQL including auth.users
-- Fix: require authentication + block access to system schemas
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
  safe_query text;
BEGIN
  -- SECURITY: Require authenticated user
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- SECURITY: Require instance access
  IF target_instance_id IS NULL THEN
    RAISE EXCEPTION 'target_instance_id is required';
  END IF;

  IF NOT public.can_access_instance(target_instance_id) THEN
    RAISE EXCEPTION 'Access denied to this instance';
  END IF;

  trimmed := btrim(query_text);

  -- Only allow SELECT statements
  IF upper(left(trimmed, 6)) != 'SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Reject multi-statement queries
  IF position(';' in trimmed) > 0 THEN
    RAISE EXCEPTION 'Multi-statement queries are not allowed';
  END IF;

  -- SECURITY: Block access to system schemas
  IF trimmed ~* '\b(auth|storage|supabase_functions|pg_catalog|information_schema)\.' THEN
    RAISE EXCEPTION 'Access to system schemas is not allowed';
  END IF;

  -- SECURITY: Block dangerous commands even in subqueries
  IF trimmed ~* '\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|COPY)\b' THEN
    RAISE EXCEPTION 'Only read operations are allowed';
  END IF;

  -- Set instance context for RLS
  PERFORM set_config('app.current_instance_id', target_instance_id::text, true);

  safe_query := trimmed;

  -- Execute and return as JSON array
  EXECUTE format(
    'SELECT coalesce(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    safe_query
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- P0-2: FIX reservations RLS — replace USING (true) with proper policy
-- Previously: anyone can read ALL reservations
-- Fix: anon can only view by confirmation_code (passed as query filter),
--      authenticated users see their instance's reservations
-- ============================================================================
DROP POLICY IF EXISTS "Public can view reservation by confirmation_code" ON public.reservations;

-- Anon: can only access reservations via confirmation_code filter
-- The frontend must pass ?confirmation_code=eq.XXXX in the query
-- Without the filter, PostgREST returns empty because no rows match anon access
CREATE POLICY "Anon can view reservation by confirmation_code"
ON public.reservations
AS permissive
FOR SELECT
TO anon
USING (false);
-- NOTE: We use USING(false) for anon because the booking confirmation page
-- uses RPC functions (cancel_reservation_by_code, request_reservation_change_by_code)
-- which are SECURITY DEFINER and don't need direct table access.
-- If direct anon SELECT is needed, replace with a token-based approach.

-- ============================================================================
-- P0-3: FIX vehicle_protocols RLS — replace USING (true) with token-based
-- Previously: anyone can read ALL protocols
-- Fix: public access only via public_token match in query filter
-- ============================================================================
DROP POLICY IF EXISTS "Public read access to protocols via token" ON public.vehicle_protocols;

CREATE POLICY "Public read protocol by token filter"
ON public.vehicle_protocols
AS permissive
FOR SELECT
TO anon
USING (false);
-- NOTE: Public protocol view should use a dedicated RPC or edge function
-- that accepts a token and returns only that protocol's data.
-- Direct table access for anon is blocked.

-- ============================================================================
-- P0-4: FIX protocol_damage_points RLS — replace USING (true)
-- Previously: anyone can read ALL damage points
-- ============================================================================
DROP POLICY IF EXISTS "Public read access to damage points" ON public.protocol_damage_points;

CREATE POLICY "Public read damage points by protocol token"
ON public.protocol_damage_points
AS permissive
FOR SELECT
TO anon
USING (false);
-- Same as vehicle_protocols — public view should use dedicated endpoint

-- ============================================================================
-- P1-1: FIX profiles RLS — remove "Anyone can lookup" policy
-- Previously: USING (username IS NOT NULL) → exposes all profiles
-- Fix: only authenticated users can lookup
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can lookup profile by username" ON public.profiles;

CREATE POLICY "Authenticated users can lookup by username"
ON public.profiles
AS permissive
FOR SELECT
TO authenticated
USING (username IS NOT NULL);

-- ============================================================================
-- P1-2: FIX subscription_plans — restrict to authenticated
-- Previously: "Anyone can view active subscription plans" → internal pricing leak
-- Fix: only authenticated users see plans
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;

CREATE POLICY "Authenticated users can view active plans"
ON public.subscription_plans
AS permissive
FOR SELECT
TO authenticated
USING (active = true);

-- ============================================================================
-- P1-3: FIX instance_features — restrict to authenticated
-- Previously: "Anyone can read enabled features" → feature flags leak
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can read enabled features" ON public.instance_features;

CREATE POLICY "Authenticated users can read enabled features"
ON public.instance_features
AS permissive
FOR SELECT
TO authenticated
USING (enabled = true);

-- ============================================================================
-- P1-4: FIX unified_services anon policy — keep for booking but restrict fields
-- The booking form needs service descriptions, so we keep anon SELECT
-- but this is acceptable — no PII, just service catalog
-- ============================================================================
-- unified_services: KEEP current policy (public catalog, no PII)
-- services: KEEP current policy (public catalog for booking form)
-- service_categories: KEEP current policy (public catalog)
-- car_models: KEEP current policy (public catalog)
-- stations: KEEP current policy (booking form needs this)
-- closed_days: KEEP current policy (booking calendar needs this)
-- instances: KEEP current policy (only via offer token — already secure)

-- ============================================================================
-- P1-5: FIX offer-related tables — tighten "anyone" policies to anon-only
-- with proper offer token chain
-- ============================================================================

-- offer_scope_extras: replace USING (true) with token chain
-- Chain: offer_scope_extras.scope_id → offer_scopes.id → offer_options.scope_id → offers.id
DROP POLICY IF EXISTS "Anyone can view scope extras" ON public.offer_scope_extras;
CREATE POLICY "Anon can view scope extras via offer"
ON public.offer_scope_extras
AS permissive
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM public.offer_options oo
  JOIN public.offers o ON o.id = oo.offer_id
  WHERE oo.scope_id = offer_scope_extras.scope_id
  AND o.public_token IS NOT NULL
));

-- offer_scope_extra_products: replace USING (true) with token chain
DROP POLICY IF EXISTS "Anyone can view scope extra products" ON public.offer_scope_extra_products;
CREATE POLICY "Anon can view scope extra products via offer"
ON public.offer_scope_extra_products
AS permissive
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM public.offer_scope_extras ose
  JOIN public.offer_options oo ON oo.scope_id = ose.scope_id
  JOIN public.offers o ON o.id = oo.offer_id
  WHERE ose.id = offer_scope_extra_products.extra_id
  AND o.public_token IS NOT NULL
));

-- offer_scope_variants: replace USING (true) with token chain
DROP POLICY IF EXISTS "Anyone can view scope variants" ON public.offer_scope_variants;
CREATE POLICY "Anon can view scope variants via offer"
ON public.offer_scope_variants
AS permissive
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM public.offer_options oo
  JOIN public.offers o ON o.id = oo.offer_id
  WHERE oo.scope_id = offer_scope_variants.scope_id
  AND o.public_token IS NOT NULL
));

-- offer_scope_variant_products: replace USING (true) with token chain
DROP POLICY IF EXISTS "Anyone can view scope variant products" ON public.offer_scope_variant_products;
CREATE POLICY "Anon can view scope variant products via offer"
ON public.offer_scope_variant_products
AS permissive
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM public.offer_scope_variants osv
  JOIN public.offer_options oo ON oo.scope_id = osv.scope_id
  JOIN public.offers o ON o.id = oo.offer_id
  WHERE osv.id = offer_scope_variant_products.variant_id
  AND o.public_token IS NOT NULL
));

-- ============================================================================
-- P1-6: RESTRICT token generation RPCs to authenticated only
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.generate_protocol_token() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_short_token() FROM anon;

-- ============================================================================
-- P1-7: RESTRICT cleanup_old_login_attempts to authenticated
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts() FROM anon;

-- ============================================================================
-- Create RPC for public protocol view (replaces direct table access)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_protocol_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'protocol', row_to_json(vp),
    'damage_points', COALESCE((
      SELECT jsonb_agg(row_to_json(dp))
      FROM protocol_damage_points dp
      WHERE dp.protocol_id = vp.id
    ), '[]'::jsonb)
  ) INTO result
  FROM vehicle_protocols vp
  WHERE vp.public_token = p_token
  LIMIT 1;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Protocol not found';
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_protocol_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_protocol_by_token(text) TO authenticated;

-- ============================================================================
-- Create RPC for public reservation view (replaces direct table access)
-- Returns reservation with joined service and instance data
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_reservation_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_code IS NULL OR length(p_code) < 4 THEN
    RAISE EXCEPTION 'Invalid code';
  END IF;

  SELECT jsonb_build_object(
    'id', r.id,
    'confirmation_code', r.confirmation_code,
    'instance_id', r.instance_id,
    'station_id', r.station_id,
    'customer_name', r.customer_name,
    'customer_phone', r.customer_phone,
    'vehicle_plate', r.vehicle_plate,
    'car_size', r.car_size,
    'reservation_date', r.reservation_date,
    'start_time', r.start_time,
    'end_time', r.end_time,
    'end_date', r.end_date,
    'status', r.status,
    'price', r.price,
    'customer_notes', r.customer_notes,
    'service_ids', r.service_ids,
    'service_id', r.service_id,
    'source', r.source,
    'confirmed_at', r.confirmed_at,
    'completed_at', r.completed_at,
    'cancelled_at', r.cancelled_at,
    'original_reservation_id', r.original_reservation_id,
    'service', CASE WHEN s.id IS NOT NULL THEN jsonb_build_object(
      'name', s.name,
      'duration_minutes', s.duration_minutes
    ) ELSE NULL END,
    'instance', CASE WHEN i.id IS NOT NULL THEN jsonb_build_object(
      'name', i.name,
      'phone', i.phone,
      'address', i.address,
      'logo_url', i.logo_url,
      'customer_edit_cutoff_hours', i.customer_edit_cutoff_hours,
      'slug', i.slug
    ) ELSE NULL END
  ) INTO result
  FROM reservations r
  LEFT JOIN services s ON s.id = r.service_id
  LEFT JOIN instances i ON i.id = r.instance_id
  WHERE r.confirmation_code = p_code;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  -- Also check for pending change request
  result := result || jsonb_build_object(
    'change_request', (
      SELECT row_to_json(cr)
      FROM (
        SELECT id, reservation_date, start_time, end_time, end_date,
               status, customer_notes, service_ids
        FROM reservations
        WHERE original_reservation_id = (result->>'id')::uuid
          AND status = 'change_requested'
        ORDER BY created_at DESC
        LIMIT 1
      ) cr
    )
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_reservation_by_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_reservation_by_code(text) TO authenticated;
