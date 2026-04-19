-- FIX: sales_roll_usages has no instance_id, causing cross-instance data leak
-- for scrap/offcut usages (roll_id IS NULL).
-- The "Users can manage scrap roll usages" policy allowed ANY authenticated user
-- to read/write usages where roll_id IS NULL, regardless of instance.

-- 1. Add instance_id column (nullable for backfill)
ALTER TABLE public.sales_roll_usages
  ADD COLUMN instance_id uuid REFERENCES public.instances(id) ON DELETE CASCADE;

-- 2. Backfill instance_id from parent roll (for usages with roll_id)
UPDATE public.sales_roll_usages u
  SET instance_id = sr.instance_id
  FROM public.sales_rolls sr
  WHERE u.roll_id = sr.id
    AND u.instance_id IS NULL;

-- 3. Backfill instance_id from parent order (for usages with order_id but no roll_id)
UPDATE public.sales_roll_usages u
  SET instance_id = so.instance_id
  FROM public.sales_orders so
  WHERE u.order_id = so.id
    AND u.instance_id IS NULL;

-- 4. For any remaining orphan scrap entries, try to match via worker_name → employees table
-- This covers the exact leak scenario: scrap usages from bling workers
UPDATE public.sales_roll_usages u
  SET instance_id = e.instance_id
  FROM public.employees e
  WHERE u.worker_name = e.name
    AND u.instance_id IS NULL
    AND u.source = 'worker';

-- 5. Make instance_id NOT NULL now that we've backfilled
-- (any remaining NULLs are truly orphaned and should be deleted)
DELETE FROM public.sales_roll_usages WHERE instance_id IS NULL;
ALTER TABLE public.sales_roll_usages ALTER COLUMN instance_id SET NOT NULL;

-- 6. Add index for instance_id filtering
CREATE INDEX sales_roll_usages_instance_id_idx
  ON public.sales_roll_usages (instance_id);

-- 7. Drop the broken scrap policy
DROP POLICY IF EXISTS "Users can manage scrap roll usages" ON public.sales_roll_usages;

-- 8. Drop the old roll-based policy too (we'll replace with a unified one)
DROP POLICY IF EXISTS "Users can manage sales roll usages" ON public.sales_roll_usages;

-- 9. Create a single unified policy using instance_id directly
CREATE POLICY "Users can manage sales roll usages"
  ON public.sales_roll_usages
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.can_access_instance(instance_id))
  WITH CHECK (public.can_access_instance(instance_id));
