CREATE TABLE protocol_settings (
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  protocol_type  text NOT NULL DEFAULT 'reception' CHECK (protocol_type IN ('reception', 'pickup')),
  config         jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  PRIMARY KEY (instance_id, protocol_type)
);

ALTER TABLE protocol_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "protocol_settings_admin" ON protocol_settings
  FOR ALL USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
  );

CREATE POLICY "protocol_settings_employee_select" ON protocol_settings
  FOR SELECT USING (
    public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id)
  );

CREATE TRIGGER update_protocol_settings_updated_at
  BEFORE UPDATE ON protocol_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE vehicle_protocols
  ADD COLUMN IF NOT EXISTS custom_field_values jsonb DEFAULT '{}'::jsonb;
