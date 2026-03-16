-- Invoicing settings per instance
CREATE TABLE IF NOT EXISTS invoicing_settings (
  instance_id UUID PRIMARY KEY REFERENCES instances(id) ON DELETE CASCADE,
  provider TEXT, -- 'fakturownia' | 'ifirma'
  provider_config JSONB DEFAULT '{}'::jsonb,
  default_vat_rate INTEGER DEFAULT 23,
  default_payment_days INTEGER DEFAULT 14,
  default_document_kind TEXT DEFAULT 'vat',
  default_currency TEXT DEFAULT 'PLN',
  auto_send_email BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  customer_id UUID,
  provider TEXT NOT NULL,
  external_invoice_id TEXT,
  external_client_id TEXT,
  invoice_number TEXT,
  kind TEXT DEFAULT 'vat',
  status TEXT DEFAULT 'draft',
  issue_date DATE,
  sell_date DATE,
  payment_to DATE,
  buyer_name TEXT,
  buyer_tax_no TEXT,
  buyer_email TEXT,
  positions JSONB DEFAULT '[]'::jsonb,
  total_gross NUMERIC,
  currency TEXT DEFAULT 'PLN',
  pdf_url TEXT,
  oid TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE invoicing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS: restrict to instance members
CREATE POLICY "invoicing_settings_admin" ON invoicing_settings FOR ALL USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
);

CREATE POLICY "invoicing_settings_sales_select" ON invoicing_settings FOR SELECT USING (
  public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id)
);

CREATE POLICY "invoices_admin" ON invoices FOR ALL USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
);

CREATE POLICY "invoices_sales_select" ON invoices FOR SELECT USING (
  public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id)
);

CREATE POLICY "invoices_sales_insert" ON invoices FOR INSERT WITH CHECK (
  public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id)
);

CREATE POLICY "invoices_sales_update" ON invoices FOR UPDATE USING (
  public.has_instance_role(auth.uid(), 'sales'::public.app_role, instance_id)
);

-- Triggers for updated_at
CREATE TRIGGER update_invoicing_settings_updated_at
BEFORE UPDATE ON invoicing_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
