-- Many-to-many: services ↔ reminder_templates
-- Replaces unified_services.reminder_template_id (single FK)

-- 1. Junction table
CREATE TABLE service_reminder_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES unified_services(id) ON DELETE CASCADE,
  reminder_template_id uuid NOT NULL REFERENCES reminder_templates(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instances(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, reminder_template_id)
);

-- 2. RLS
ALTER TABLE service_reminder_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own instance service_reminder_templates"
ON service_reminder_templates FOR SELECT
USING (instance_id IN (SELECT instance_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own instance service_reminder_templates"
ON service_reminder_templates FOR INSERT
WITH CHECK (instance_id IN (SELECT instance_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own instance service_reminder_templates"
ON service_reminder_templates FOR DELETE
USING (instance_id IN (SELECT instance_id FROM profiles WHERE id = auth.uid()));

-- 3. Migrate existing data from unified_services
INSERT INTO service_reminder_templates (service_id, reminder_template_id, instance_id)
SELECT id, reminder_template_id, instance_id
FROM unified_services
WHERE reminder_template_id IS NOT NULL;

-- 4. Migrate existing data from products_library
INSERT INTO service_reminder_templates (service_id, reminder_template_id, instance_id)
SELECT id, reminder_template_id, instance_id
FROM products_library
WHERE reminder_template_id IS NOT NULL
ON CONFLICT (service_id, reminder_template_id) DO NOTHING;

-- 5. Drop old FK columns
ALTER TABLE unified_services DROP COLUMN reminder_template_id;
ALTER TABLE products_library DROP COLUMN reminder_template_id;

-- 6. Index for fast lookups
CREATE INDEX idx_srt_service_id ON service_reminder_templates(service_id);
CREATE INDEX idx_srt_template_id ON service_reminder_templates(reminder_template_id);
CREATE INDEX idx_srt_instance_id ON service_reminder_templates(instance_id);
