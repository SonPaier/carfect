-- Prevent duplicate product_code per instance (only for active rolls with non-null codes)
CREATE UNIQUE INDEX sales_rolls_unique_product_code_per_instance
  ON public.sales_rolls (instance_id, product_code)
  WHERE product_code IS NOT NULL AND status = 'active';
