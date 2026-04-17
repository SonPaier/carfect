-- Seed E2E test data: customer + service for reservation tests
-- Uses deterministic UUIDs so tests can reference them
DO $$
DECLARE
  v_instance_id uuid;
  v_cat_id uuid := 'e2e00000-0000-0000-0000-000000000001';
  v_svc_id uuid := 'e2e00000-0000-0000-0000-000000000002';
  v_cust_id uuid := 'e2e00000-0000-0000-0000-000000000003';
BEGIN
  SELECT id INTO v_instance_id FROM instances WHERE slug = 'e2e' LIMIT 1;
  IF v_instance_id IS NULL THEN RETURN; END IF;

  -- Idempotent: skip if already seeded
  IF EXISTS (SELECT 1 FROM unified_services WHERE id = v_svc_id) THEN RETURN; END IF;

  -- Category
  INSERT INTO unified_categories (id, instance_id, name, slug, category_type, prices_are_net, sort_order, active)
  VALUES (v_cat_id, v_instance_id, 'E2E Detailing', 'e2e-detailing', 'both', false, 1, true)
  ON CONFLICT (id) DO NOTHING;

  -- Service
  INSERT INTO unified_services (id, instance_id, category_id, name, short_name, price_from, default_price, duration_minutes, requires_size, service_type, active, visibility, unit, sort_order)
  VALUES (v_svc_id, v_instance_id, v_cat_id, 'Mycie podstawowe E2E', 'Mycie E2E', 100, 100, 30, false, 'both', true, 'both', 'szt.', 1)
  ON CONFLICT (id) DO NOTHING;

  -- Customer
  INSERT INTO customers (id, instance_id, name, phone)
  VALUES (v_cust_id, v_instance_id, 'E2E Testowy', '123456789')
  ON CONFLICT (id) DO NOTHING;

END $$;
