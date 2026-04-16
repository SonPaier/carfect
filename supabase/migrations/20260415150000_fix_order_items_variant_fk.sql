-- Change variant_id FK to SET NULL on delete, preventing constraint violations
-- when variants are deleted while referenced by order items
DO $$
BEGIN
  -- Drop existing FK if it exists
  ALTER TABLE public.sales_order_items DROP CONSTRAINT IF EXISTS sales_order_items_variant_id_fkey;

  -- Null out orphaned variant_id references
  UPDATE public.sales_order_items SET variant_id = NULL
  WHERE variant_id IS NOT NULL
    AND variant_id NOT IN (SELECT id FROM public.sales_product_variants);

  -- Re-add with ON DELETE SET NULL
  ALTER TABLE public.sales_order_items
    ADD CONSTRAINT sales_order_items_variant_id_fkey
      FOREIGN KEY (variant_id) REFERENCES public.sales_product_variants(id)
      ON DELETE SET NULL;
END $$;
