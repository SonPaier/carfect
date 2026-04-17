-- Fix: column "role" does not exist in profiles table
-- Use has_role() helper instead
CREATE OR REPLACE FUNCTION public.update_billing_data(
  p_instance_id UUID,
  p_billing_name TEXT,
  p_billing_nip TEXT,
  p_billing_street TEXT,
  p_billing_postal_code TEXT,
  p_billing_city TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, p_instance_id)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.instances SET
    billing_name = p_billing_name,
    billing_nip = p_billing_nip,
    billing_street = p_billing_street,
    billing_postal_code = p_billing_postal_code,
    billing_city = p_billing_city
  WHERE id = p_instance_id;
END;
$$;
