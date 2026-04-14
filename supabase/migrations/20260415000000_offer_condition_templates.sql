-- Reusable condition templates for offers (warranty, payment terms, etc.)
CREATE TABLE IF NOT EXISTS offer_condition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_template_type CHECK (
    template_type IN ('payment_terms', 'warranty', 'service_info', 'notes')
  )
);

CREATE INDEX IF NOT EXISTS idx_offer_condition_templates_lookup
  ON offer_condition_templates(instance_id, template_type, sort_order);

-- RLS
ALTER TABLE offer_condition_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users_manage_offer_templates" ON offer_condition_templates
    FOR ALL USING (
      instance_id IN (
        SELECT p.instance_id FROM profiles p WHERE p.id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
