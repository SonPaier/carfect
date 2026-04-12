-- Full subscription billing schema for HiService

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  price_per_station NUMERIC NOT NULL DEFAULT 49,
  sms_limit INTEGER NOT NULL DEFAULT 100,
  included_features JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Instance subscriptions
CREATE TABLE IF NOT EXISTS public.instance_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  station_limit INTEGER NOT NULL DEFAULT 1,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_at DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_trial BOOLEAN DEFAULT false,
  trial_expires_at TIMESTAMPTZ,
  next_billing_date DATE,
  billing_day INTEGER DEFAULT 1 CHECK (billing_day IN (1, 10, 20)),
  UNIQUE (instance_id)
);

ALTER TABLE public.instance_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own instance subscription"
ON public.instance_subscriptions FOR SELECT TO authenticated
USING (instance_id = (SELECT p.instance_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin full access to subscriptions"
ON public.instance_subscriptions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Billing fields on instances
ALTER TABLE public.instances
  ADD COLUMN IF NOT EXISTS billing_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_nip TEXT,
  ADD COLUMN IF NOT EXISTS billing_street TEXT,
  ADD COLUMN IF NOT EXISTS billing_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_city TEXT;

-- Subscription invoices
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  amount_net NUMERIC NOT NULL,
  amount_gross NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PLN',
  positions JSONB NOT NULL DEFAULT '[]',
  invoice_number TEXT,
  invoice_issue_date DATE NOT NULL,
  payment_due_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  pdf_url TEXT,
  external_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscription_invoices_instance_id ON public.subscription_invoices(instance_id);
CREATE INDEX idx_subscription_invoices_payment_status ON public.subscription_invoices(payment_status);
CREATE UNIQUE INDEX idx_subscription_invoices_unique_period ON public.subscription_invoices(instance_id, billing_period_start);

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own instance invoices"
ON public.subscription_invoices FOR SELECT TO authenticated
USING (instance_id IS NOT NULL AND instance_id = (SELECT p.instance_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Super admin full access to subscription invoices"
ON public.subscription_invoices FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- RPCs
CREATE OR REPLACE FUNCTION public.process_billing_for_instance(
  p_subscription_id UUID, p_instance_id UUID,
  p_billing_period_start DATE, p_billing_period_end DATE,
  p_amount_net NUMERIC, p_amount_gross NUMERIC, p_positions JSONB,
  p_invoice_issue_date DATE, p_payment_due_date DATE, p_next_billing_date DATE,
  p_invoice_number TEXT DEFAULT NULL, p_external_invoice_id TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_invoice_id UUID;
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
  ) RETURNING id INTO v_invoice_id;
  UPDATE public.instance_subscriptions SET next_billing_date = p_next_billing_date
  WHERE id = p_subscription_id AND instance_id = p_instance_id;
  RETURN v_invoice_id;
END; $$;

CREATE OR REPLACE FUNCTION public.update_billing_data(
  p_instance_id UUID, p_billing_name TEXT, p_billing_nip TEXT,
  p_billing_street TEXT, p_billing_postal_code TEXT, p_billing_city TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND (instance_id = p_instance_id OR role = 'super_admin')
  ) THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.instances SET
    billing_name = p_billing_name, billing_nip = p_billing_nip,
    billing_street = p_billing_street, billing_postal_code = p_billing_postal_code,
    billing_city = p_billing_city
  WHERE id = p_instance_id;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_due_subscriptions(p_today DATE)
RETURNS SETOF public.instance_subscriptions LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.instance_subscriptions
  WHERE next_billing_date <= p_today AND status = 'active'
    AND is_trial = false AND monthly_price > 0
  FOR UPDATE SKIP LOCKED;
$$;
