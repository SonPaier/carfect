-- Blocker 7: Filter out zero-price subscriptions to prevent infinite lock loop
-- S7: Add search_path to SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.claim_due_subscriptions(p_today DATE)
RETURNS SETOF public.instance_subscriptions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.instance_subscriptions
  WHERE next_billing_date <= p_today
    AND status = 'active'
    AND is_trial = false
    AND monthly_price > 0
  FOR UPDATE SKIP LOCKED;
$$;

-- S7: Add search_path to existing RPCs
CREATE OR REPLACE FUNCTION public.process_billing_for_instance(
  p_subscription_id UUID,
  p_instance_id UUID,
  p_billing_period_start DATE,
  p_billing_period_end DATE,
  p_amount_net NUMERIC,
  p_amount_gross NUMERIC,
  p_positions JSONB,
  p_invoice_issue_date DATE,
  p_payment_due_date DATE,
  p_next_billing_date DATE,
  p_invoice_number TEXT DEFAULT NULL,
  p_external_invoice_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id UUID;
BEGIN
  INSERT INTO public.subscription_invoices (
    instance_id, billing_period_start, billing_period_end,
    amount_net, amount_gross, currency, positions,
    invoice_number, invoice_issue_date, payment_due_date,
    payment_status, external_invoice_id
  ) VALUES (
    p_instance_id, p_billing_period_start, p_billing_period_end,
    p_amount_net, p_amount_gross, 'PLN', p_positions,
    p_invoice_number, p_invoice_issue_date, p_payment_due_date,
    'pending', p_external_invoice_id
  )
  RETURNING id INTO v_invoice_id;

  UPDATE public.instance_subscriptions
  SET next_billing_date = p_next_billing_date
  WHERE id = p_subscription_id
    AND instance_id = p_instance_id;

  RETURN v_invoice_id;
END;
$$;

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
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (instance_id = p_instance_id OR role = 'super_admin')
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
