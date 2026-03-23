-- price_unit must be 'meter' (not 'm2') — frontend checks priceUnit === 'meter' for roll assignment
UPDATE sales_products SET price_unit = 'meter'
WHERE instance_id = '29f15eeb-5ada-446c-9351-0194dbc886fd';
