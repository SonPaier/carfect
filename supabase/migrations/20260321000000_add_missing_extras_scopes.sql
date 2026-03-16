-- Add missing "Dodatki" (extras) scope to instances that don't have one.
-- Some instances were created before the extras scope auto-creation was added
-- to copy_global_scopes_to_instance().

INSERT INTO offer_scopes (instance_id, name, short_name, is_extras_scope, has_unified_services, source, active, sort_order)
SELECT i.id, 'Dodatki', 'Dodatki', true, true, 'instance', true, 999
FROM instances i
WHERE i.active = true
  AND NOT EXISTS (
    SELECT 1 FROM offer_scopes os
    WHERE os.instance_id = i.id
      AND os.is_extras_scope = true
      AND os.active = true
  );
