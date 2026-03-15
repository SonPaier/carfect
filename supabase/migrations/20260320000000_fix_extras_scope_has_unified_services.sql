-- Fix: copy_global_scopes_to_instance should set has_unified_services=true on auto-created "Dodatki" scope.
-- This ensures the extras scope dynamically fetches all unified_services with service_type='both'.

-- 1. Update the function to set has_unified_services=true when creating extras scope
CREATE OR REPLACE FUNCTION public.copy_global_scopes_to_instance(_instance_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_scope RECORD; v_new_scope_id uuid; v_product RECORD; v_count integer := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM offer_scopes WHERE instance_id = _instance_id AND active = true) THEN RETURN 0; END IF;
  FOR v_scope IN SELECT * FROM offer_scopes WHERE source = 'global' AND instance_id IS NULL AND active = true ORDER BY sort_order
  LOOP
    INSERT INTO offer_scopes (instance_id, name, short_name, description, is_extras_scope, has_coating_upsell, has_unified_services, sort_order, default_warranty, default_payment_terms, default_notes, default_service_info, source, active)
    VALUES (_instance_id, v_scope.name, v_scope.short_name, v_scope.description, v_scope.is_extras_scope, v_scope.has_coating_upsell, v_scope.has_unified_services, v_scope.sort_order, v_scope.default_warranty, v_scope.default_payment_terms, v_scope.default_notes, v_scope.default_service_info, 'instance', true)
    RETURNING id INTO v_new_scope_id;
    FOR v_product IN SELECT * FROM offer_scope_products WHERE scope_id = v_scope.id ORDER BY sort_order
    LOOP
      INSERT INTO offer_scope_products (scope_id, product_id, variant_name, is_default, sort_order, instance_id)
      VALUES (v_new_scope_id, v_product.product_id, v_product.variant_name, v_product.is_default, v_product.sort_order, _instance_id);
    END LOOP;
    v_count := v_count + 1;
  END LOOP;
  -- Auto-create extras scope with has_unified_services=true so it dynamically fetches all service_type='both' products
  IF NOT EXISTS (SELECT 1 FROM offer_scopes WHERE instance_id = _instance_id AND is_extras_scope = true AND active = true) THEN
    INSERT INTO offer_scopes (instance_id, name, short_name, is_extras_scope, has_unified_services, source, active, sort_order)
    VALUES (_instance_id, 'Dodatki', 'Dodatki', true, true, 'instance', true, 999);
    v_count := v_count + 1;
  END IF;
  RETURN v_count;
END;
$function$;

-- 2. Fix existing instances: set has_unified_services=true on all extras scopes that don't have it
UPDATE offer_scopes
SET has_unified_services = true, updated_at = now()
WHERE is_extras_scope = true AND has_unified_services = false;
