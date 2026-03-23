-- Ensure ALL Bling products have price_unit = 'm2'
UPDATE sales_products SET price_unit = 'm2'
WHERE instance_id = '29f15eeb-5ada-446c-9351-0194dbc886fd';
