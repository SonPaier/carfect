CREATE TABLE custom_field_definitions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  context      text NOT NULL,
  field_type   text NOT NULL CHECK (field_type IN ('checkbox', 'text', 'number', 'textarea')),
  label        text NOT NULL,
  required     boolean NOT NULL DEFAULT false,
  sort_order   integer NOT NULL DEFAULT 0,
  config       jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(instance_id, context, label)
);

CREATE INDEX idx_custom_field_defs_instance_context
  ON custom_field_definitions(instance_id, context);

ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_field_defs_instance_member" ON custom_field_definitions
  FOR ALL USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_instance_role(auth.uid(), 'admin'::public.app_role, instance_id)
    OR public.has_instance_role(auth.uid(), 'employee'::public.app_role, instance_id)
  );

CREATE TRIGGER update_custom_field_definitions_updated_at
  BEFORE UPDATE ON custom_field_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
