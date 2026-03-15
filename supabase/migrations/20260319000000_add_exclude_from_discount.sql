-- Add exclude_from_discount flag to sales_products
ALTER TABLE sales_products ADD COLUMN IF NOT EXISTS exclude_from_discount BOOLEAN NOT NULL DEFAULT false;

-- For existing products with variants that had price_net = 0,
-- update price_net to the max variant price so they have a valid price
UPDATE sales_products sp
SET price_net = COALESCE(
  (SELECT MAX(spv.price_net) FROM sales_product_variants spv WHERE spv.product_id = sp.id),
  0
)
WHERE sp.has_variants = true AND (sp.price_net IS NULL OR sp.price_net = 0);
