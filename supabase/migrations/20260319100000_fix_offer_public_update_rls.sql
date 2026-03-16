-- Drop the overly permissive RLS policy that allows any anonymous user
-- to update ANY offer row where public_token IS NOT NULL
DROP POLICY IF EXISTS "Public update offer via token" ON "public"."offers";

-- Create a secure RPC function that marks an offer as viewed,
-- requiring the caller to know the actual token value.
CREATE OR REPLACE FUNCTION public.mark_offer_viewed(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE offers
  SET status = 'viewed', viewed_at = now()
  WHERE public_token = p_token
    AND status = 'sent';
END;
$$;

-- Allow anonymous users to call this function
GRANT EXECUTE ON FUNCTION public.mark_offer_viewed(text) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_offer_viewed(text) TO authenticated;
