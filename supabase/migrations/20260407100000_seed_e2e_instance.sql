-- Seed E2E test instance with demo data (customers, services, categories)
-- Instance slug: 'e2e'
DO $$
DECLARE
  v_instance_id uuid;
BEGIN
  SELECT id INTO v_instance_id FROM instances WHERE slug = 'e2e' LIMIT 1;

  IF v_instance_id IS NULL THEN
    RAISE NOTICE 'E2E instance not found, skipping seed';
    RETURN;
  END IF;

  -- Only seed if no services exist yet
  IF EXISTS (SELECT 1 FROM unified_services WHERE instance_id = v_instance_id AND active = true LIMIT 1) THEN
    RAISE NOTICE 'E2E instance already has services, skipping seed';
    RETURN;
  END IF;

  PERFORM seed_demo_data(v_instance_id);
  RAISE NOTICE 'E2E instance seeded with demo data';
END $$;
