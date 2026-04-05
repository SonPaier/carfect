-- ============================================================================
-- SECURITY FIX: P0 + P1 findings from 2026-04-04 audit (HiService)
-- ============================================================================

-- ============================================================================
-- P0-1: FIX protocols RLS — broken token policy
-- Previously: USING (public_token IS NOT NULL) → exposes ALL protocols
-- Fix: require token to be provided via header or use dedicated RPC
-- ============================================================================
DROP POLICY IF EXISTS "Public can view protocol by token" ON public.protocols;

-- Block direct anon SELECT — use get_protocol_by_token RPC instead
CREATE POLICY "Anon cannot directly read protocols"
ON public.protocols
AS permissive
FOR SELECT
TO anon
USING (false);

-- Create RPC for public protocol view
CREATE OR REPLACE FUNCTION public.get_protocol_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 6 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  SELECT row_to_json(p) INTO result
  FROM (
    SELECT
      id, instance_id, status, protocol_type,
      customer_name, vehicle_brand, vehicle_model,
      vehicle_registration, vehicle_color, vehicle_vin,
      mileage, fuel_level, notes, photos,
      created_at, updated_at, public_token,
      calendar_item_id
    -- NOTE: excludes customer_phone, customer_email, customer_nip,
    -- customer_address, signature_data from public view
    FROM protocols
    WHERE public_token = p_token
  ) p;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Protocol not found';
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_protocol_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_protocol_by_token(text) TO authenticated;

-- ============================================================================
-- P0-2: FIX instances RLS — replace USING (true)
-- Previously: all instances publicly readable including bank accounts
-- Fix: only authenticated users can view instances (needed for app login flow)
--       OR create a public view with only non-sensitive fields
-- ============================================================================
DROP POLICY IF EXISTS "Instances are publicly readable" ON public.instances;

-- Public (anon) can see only basic instance info needed for login/branding
CREATE POLICY "Anon can view basic instance info"
ON public.instances
AS permissive
FOR SELECT
TO anon
USING (active = true);

-- But we need to restrict WHICH columns anon sees.
-- Since RLS can't filter columns, create a view for public use:
CREATE OR REPLACE VIEW public.instances_public AS
SELECT
  id, name, slug, primary_color, logo_url, working_hours, active
FROM public.instances
WHERE active = true;

-- Grant anon access to the view
GRANT SELECT ON public.instances_public TO anon;

-- NOTE: Frontend code for login/instance lookup should use instances_public view
-- instead of the instances table directly. Until frontend is updated,
-- the anon SELECT policy above will still return all columns.
-- TODO: After frontend update, change the anon policy to USING (false)

-- ============================================================================
-- P1: FIX profiles RLS — remove "Anyone can lookup by username"
-- Previously: USING (username IS NOT NULL) → exposes all 17 profiles
-- Fix: only authenticated users can lookup
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can lookup by username" ON public.profiles;

CREATE POLICY "Authenticated users can lookup by username"
ON public.profiles
AS permissive
FOR SELECT
TO authenticated
USING (username IS NOT NULL);
